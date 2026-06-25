import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

import { extractFrames } from "../extract-frames.mjs";

const exec = promisify(execFile);
const VIDEO = path.resolve("test-results/selftest-extract/synthetic.webm");

before(async () => {
  fs.mkdirSync(path.dirname(VIDEO), { recursive: true });
  await exec("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=10",
    "-pix_fmt", "yuv420p", VIDEO,
  ]);
});

test("extractFrames yields frames + manifest from a synthetic webm", async () => {
  const outDir = path.resolve("test-results/selftest-extract/frames");
  const result = await extractFrames({ videoPath: VIDEO, outDir, requestedMs: [1000] });

  assert.ok(result.durationMs >= 1500, "duration parsed");
  assert.ok(result.frames.length >= 2, "frames extracted");
  assert.ok(
    result.frames.some((f) => f.source === "requested" && f.ms === 1000),
    "requested frame present and wins dedupe",
  );
  const pngs = fs.readdirSync(outDir).filter((f) => f.endsWith(".png"));
  assert.ok(pngs.length >= 2, "png files written");
  assert.ok(fs.existsSync(path.join(outDir, "manifest.json")), "manifest written");
});
