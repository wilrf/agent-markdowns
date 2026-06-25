import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { runCapture } from "../capture-interaction.mjs";

test("runCapture produces a video + console + dom bundle", async () => {
  const slug = "selftest-capture";
  const stepsPath = path.resolve(`test-results/${slug}-steps.json`);
  fs.mkdirSync(path.dirname(stepsPath), { recursive: true });
  fs.writeFileSync(
    stepsPath,
    JSON.stringify({
      slug,
      html: `<button id="b" onclick="console.log('clicked');this.textContent='open'">Filter</button>`,
      steps: [
        { action: "click", selector: "#b" },
        { action: "wait", ms: 200 },
        { action: "snapshotDom", selector: "#b" },
      ],
    }),
  );

  const summary = await runCapture({ stepsPath, headless: true });

  assert.equal(summary.exitCode, 0);
  assert.ok(summary.video && fs.existsSync(summary.video), "run.webm exists");
  const consoleText = fs.readFileSync(path.join(summary.outDir, "console.jsonl"), "utf8");
  assert.match(consoleText, /clicked/, "console.log captured");
  assert.ok(summary.events >= 3, "events recorded");
  const domFiles = fs.readdirSync(path.join(summary.outDir, "dom-snapshots"));
  assert.ok(domFiles.length >= 1, "dom snapshot written");
});
