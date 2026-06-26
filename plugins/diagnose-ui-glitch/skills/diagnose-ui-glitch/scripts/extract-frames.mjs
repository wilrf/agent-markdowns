import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

// Two-pass frame extractor: scene-change detection + fixed-interval samples +
// explicit requested timestamps, deduped to ~1 frame @30fps. Requires ffmpeg
// and ffprobe on PATH.
//
// Env:
//   SCENE_THRESHOLD     ffmpeg scene score cutoff (default 0.1)
//   SAMPLE_INTERVAL_MS  fixed sampling interval (default 500)

const exec = promisify(execFile);
const SCENE_THRESHOLD = Number(process.env.SCENE_THRESHOLD ?? "0.1");
const SAMPLE_INTERVAL_MS = Number(process.env.SAMPLE_INTERVAL_MS ?? "500");

async function videoDurationMs(videoPath) {
  const { stdout } = await exec("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", videoPath,
  ]);
  return Math.round(Number.parseFloat(stdout.trim()) * 1000);
}

async function sceneChangeMs(videoPath) {
  // showinfo prints `pts_time:<sec>` on stderr for frames passing the scene filter.
  const { stderr } = await exec("ffmpeg", [
    "-i", videoPath,
    "-filter:v", `select='gt(scene,${SCENE_THRESHOLD})',showinfo`,
    "-f", "null", "-",
  ]).catch((e) => ({ stderr: e.stderr ?? "" }));
  const times = [];
  for (const m of stderr.matchAll(/pts_time:([0-9.]+)/g)) {
    times.push(Math.round(Number.parseFloat(m[1]) * 1000));
  }
  return times;
}

async function extractFrameAt(videoPath, ms, outPath) {
  await exec("ffmpeg", [
    "-y", "-ss", (ms / 1000).toFixed(3), "-i", videoPath, "-frames:v", "1", outPath,
  ]);
}

export async function extractFrames({ videoPath, outDir, requestedMs = [] }) {
  fs.mkdirSync(outDir, { recursive: true });
  const durationMs = await videoDurationMs(videoPath);
  const scene = await sceneChangeMs(videoPath);
  const samples = [];
  for (let t = 0; t <= durationMs; t += SAMPLE_INTERVAL_MS) samples.push(t);

  // Dedupe within ~1 frame @30fps; precedence: requested > scene > sample.
  const seen = new Set();
  const targets = [];
  const add = (ms, source) => {
    const key = Math.round(ms / 33);
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ ms, source });
  };
  requestedMs.forEach((ms) => add(ms, "requested"));
  scene.forEach((ms) => add(ms, "scene"));
  samples.forEach((ms) => add(ms, "sample"));

  targets.sort((a, b) => a.ms - b.ms);
  const frames = [];
  for (const { ms, source } of targets) {
    const frameName = `${ms}.png`;
    await extractFrameAt(videoPath, ms, path.join(outDir, frameName));
    frames.push({ ms, source, path: frameName });
  }
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ durationMs, frames }, null, 2));
  return { durationMs, frames };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const [, , videoPath, outDir, atArg] = process.argv;
  if (!videoPath || !outDir) {
    console.error("usage: node extract-frames.mjs <video.webm> <outDir> [--at=ms,ms]");
    process.exit(1);
  }
  const requestedMs = atArg?.startsWith("--at=")
    ? atArg.slice(5).split(",").map(Number).filter((n) => !Number.isNaN(n))
    : [];
  extractFrames({ videoPath, outDir, requestedMs })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
