import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

// Portable capture harness: drives Chrome through a small steps-JSON DSL and
// records a .webm plus time-aligned DevTools signals (console, network, DOM
// computed-style snapshots, trace) on a single `recordingStartMs` clock.
//
// Env:
//   PLAYWRIGHT_BASE_URL     base for relative routes (default http://localhost:3000)
//   PLAYWRIGHT_STORAGE_STATE auth storage-state json (default e2e/.auth/user.json)
//   GLITCH_OUT_ROOT         output root dir (default test-results)
//   CAPTURE_HEADLESS=1      run headless (default headed — matches what a human sees)

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const AUTH_STATE_PATH = path.resolve(
  process.env.PLAYWRIGHT_STORAGE_STATE ?? "e2e/.auth/user.json",
);
const OUT_ROOT = process.env.GLITCH_OUT_ROOT ?? "test-results";
const COMPUTED_PROPS = [
  "display",
  "opacity",
  "visibility",
  "zIndex",
  "position",
  "transform",
  "pointerEvents",
  "height",
  "width",
];

function resolveUrl(route) {
  if (/^(https?|file|data):/.test(route)) return route;
  return new URL(route, BASE_URL).toString();
}

function locatorFor(page, step) {
  if (step.selector) return page.locator(step.selector).first();
  if (step.role) return page.getByRole(step.role, { name: step.name }).first();
  throw new Error(`Step needs 'selector' or 'role': ${JSON.stringify(step)}`);
}

async function executeStep({ page, step, baseAt, events, domDir }) {
  const stamp = (extra = {}) =>
    events.push({ tMs: Date.now() - baseAt, action: step.action, ...extra });
  switch (step.action) {
    case "wait":
      await page.waitForTimeout(step.ms);
      return stamp({ ms: step.ms });
    case "click":
      await locatorFor(page, step).click({ timeout: 10_000 });
      return stamp({ target: step.selector ?? step.name });
    case "hover":
      await locatorFor(page, step).hover({ timeout: 10_000 });
      return stamp({ target: step.selector ?? step.name });
    case "type":
      await locatorFor(page, step).fill(step.text, { timeout: 10_000 });
      return stamp({ target: step.selector ?? step.name });
    case "mark":
      return stamp({ label: step.label });
    case "snapshotDom": {
      const data = await locatorFor(page, step).evaluate((node, props) => {
        const s = getComputedStyle(node);
        const computed = {};
        for (const k of props) computed[k] = s.getPropertyValue(k);
        return { html: node.outerHTML, computed, rect: node.getBoundingClientRect().toJSON() };
      }, COMPUTED_PROPS);
      const tMs = Date.now() - baseAt;
      fs.writeFileSync(path.join(domDir, `${tMs}.json`), JSON.stringify(data, null, 2));
      return stamp({ target: step.selector ?? step.name, tMs });
    }
    default:
      throw new Error(`Unknown action: ${step.action}`);
  }
}

export async function runCapture({ stepsPath, headless = false }) {
  const spec = JSON.parse(fs.readFileSync(stepsPath, "utf8"));
  if (!spec.slug) throw new Error("steps file needs a 'slug'");
  if (!Array.isArray(spec.steps)) throw new Error("steps file needs a 'steps' array");

  const outDir = path.resolve(`${OUT_ROOT}/glitch-${spec.slug}`);
  const videoDir = path.join(outDir, "video");
  const domDir = path.join(outDir, "dom-snapshots");
  fs.mkdirSync(videoDir, { recursive: true });
  fs.mkdirSync(domDir, { recursive: true });

  const viewport = spec.viewport ?? { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    storageState: spec.html ? undefined : AUTH_STATE_PATH,
    viewport,
    recordVideo: { dir: videoDir, size: viewport },
  });
  await context.tracing.start({ screenshots: true, snapshots: true });

  const consoleLines = [];
  const networkLines = [];
  const baseAt = Date.now();
  const page = await context.newPage();

  page.on("console", (m) =>
    consoleLines.push(JSON.stringify({ tMs: Date.now() - baseAt, type: m.type(), text: m.text() })),
  );
  page.on("pageerror", (e) =>
    consoleLines.push(JSON.stringify({ tMs: Date.now() - baseAt, type: "pageerror", text: e.message })),
  );
  page.on("requestfinished", async (req) => {
    const res = await req.response();
    networkLines.push(
      JSON.stringify({ tMs: Date.now() - baseAt, method: req.method(), url: req.url(), status: res?.status() ?? null }),
    );
  });
  page.on("requestfailed", (req) =>
    networkLines.push(
      JSON.stringify({ tMs: Date.now() - baseAt, method: req.method(), url: req.url(), status: "failed", error: req.failure()?.errorText ?? null }),
    ),
  );

  const events = [];
  let exitCode = 0;
  try {
    if (spec.html) {
      await page.setContent(spec.html, { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(resolveUrl(spec.route), { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      if (/sign-in|login/.test(page.url())) {
        console.error(`[capture] auth expired — redirected to ${page.url()}`);
        exitCode = 42;
      }
    }
    if (exitCode === 0) {
      for (const step of spec.steps) await executeStep({ page, step, baseAt, events, domDir });
    }
  } finally {
    await context.tracing.stop({ path: path.join(outDir, "trace.zip") });
    await context.close();
    await browser.close();
  }

  const webm = fs.readdirSync(videoDir).find((f) => f.endsWith(".webm"));
  const videoPath = webm ? path.join(outDir, "run.webm") : null;
  if (webm) fs.renameSync(path.join(videoDir, webm), videoPath);

  fs.writeFileSync(path.join(outDir, "console.jsonl"), consoleLines.join("\n"));
  fs.writeFileSync(path.join(outDir, "network.jsonl"), networkLines.join("\n"));
  fs.writeFileSync(path.join(outDir, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n"));

  const summary = {
    outDir,
    slug: spec.slug,
    baseAt,
    video: videoPath,
    consoleCount: consoleLines.length,
    networkCount: networkLines.length,
    events: events.length,
    exitCode,
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  return summary;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const stepsPath = process.argv[2];
  if (!stepsPath) {
    console.error("usage: node capture-interaction.mjs <steps.json>");
    process.exit(1);
  }
  runCapture({ stepsPath, headless: process.env.CAPTURE_HEADLESS === "1" })
    .then((s) => {
      console.log(JSON.stringify(s, null, 2));
      process.exit(s.exitCode);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
