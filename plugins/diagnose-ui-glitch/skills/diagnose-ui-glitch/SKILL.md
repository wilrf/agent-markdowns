---
name: diagnose-ui-glitch
description: Use when a UI bug is a motion/timing defect a screenshot cannot capture — flicker, a dropdown that opens then snaps shut, focus flashing, scroll stutter, a popover that paints empty before its data arrives, layout shift after first paint. Drives Chrome to record a .webm of the interaction, finds the first frame where behavior diverges from what should happen, diagnoses the cause with time-aligned DevTools signals (console, network, computed style, trace), proposes a fix, and re-records to prove the glitch is gone. Triggers on "this only shows up on video", "record the bug", "diagnose this flicker/stutter/flash", "the screenshot looks fine but it's broken when you use it".
user-invocable: true
---

# Diagnose UI Glitch

Forensic, video-driven diagnosis of motion/timing UI bugs — the class a still
screenshot cannot show. You capture a `.webm`, locate the offending frame, prove the
cause with DevTools signals recorded on the same clock, fix it, and re-record to verify.

Two bundled scripts (in `scripts/`, beside this file) do the mechanical work; your
judgment does the rest:
- `scripts/capture-interaction.mjs` — drives Chrome via a steps-JSON DSL and records
  `run.webm` + `console.jsonl` + `network.jsonl` + `dom-snapshots/` + `trace.zip`, every
  record stamped `tMs` against one `recordingStartMs`.
- `scripts/extract-frames.mjs` — ffmpeg two-pass frame slicer (scene-change + fixed
  samples + explicit timestamps), emitting PNGs + `manifest.json`.

## Requirements

- `node`, `ffmpeg`, and `ffprobe` on PATH; `@playwright/test` resolvable from the project
  under test (and its browsers installed: `npx playwright install chromium`).
- The app reachable at `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`).
- If the app needs auth, a Playwright storage-state JSON at `PLAYWRIGHT_STORAGE_STATE`
  (default `e2e/.auth/user.json`).

## Preflight — STOP if any fails

1. Working tree is clean (`git status`). If dirty with unrelated work, stop and report —
   Stage 5 edits code.
2. You are in a dedicated branch/worktree. If not, create one off the main branch first.
3. The app is running and reachable at `PLAYWRIGHT_BASE_URL`. If not, ask the user to start it.
4. If the surface needs auth, the storage state is valid (a capture that lands on
   `/sign-in` exits `42`). Refresh it the project's normal way. **Do not bypass the auth gate.**

## Stage 1 — Capture

1. Translate the user's description into a steps spec, written to `<slug>-steps.json`:
   ```json
   {
     "slug": "messages-filter-flicker",
     "route": "/dashboard/messages",
     "viewport": { "width": 1440, "height": 900 },
     "steps": [
       { "action": "mark", "label": "before-open" },
       { "action": "click", "role": "button", "name": "Filter" },
       { "action": "snapshotDom", "selector": "[data-slot=popover]" },
       { "action": "wait", "ms": 600 },
       { "action": "mark", "label": "after-settle" }
     ]
   }
   ```
   Prefer stable selectors. Put a `mark` at every moment an expectation applies, and a
   `snapshotDom` on the element under suspicion.
2. Run it **headed** (this is the real diagnostic, not a test):
   `node scripts/capture-interaction.mjs <slug>-steps.json`
3. Confirm `summary.json` has `exitCode: 0` and a `run.webm`. Exit `42` = auth expired →
   fix auth, do not proceed.

## Stage 2 — Expectation model

Synthesize the frame-level invariants — "what SHOULD happen" — from three layers,
**weighting `user hint > PRD/spec doc > component code`** (buggy code must not be allowed
to define "correct"):

1. Baseline UX intuition — a click-opened popover stays open until an outside click;
   content never flashes empty-then-fills; no layout shift after first paint; focus does
   not flicker.
2. Any PRD/spec/acceptance doc covering the surface — grep the repo's docs.
3. The component source and its handlers.

Write the ordered invariants to `glitch-<slug>/expectations.md`, each tied to an event or
`mark` timestamp from `events.jsonl`.

## Stage 3 — Locate the offending frame (fan-out)

1. Extract candidate frames:
   `node scripts/extract-frames.mjs glitch-<slug>/run.webm glitch-<slug>/frames --at=<invariant timestamps from events.jsonl>`
2. Group `manifest.json` frames into **anomaly windows** (contiguous scene/requested frames).
3. Fan out **one analysis subagent per window**. Give each: the window's frame PNGs, the
   relevant invariants, and this required structured verdict:
   ```json
   { "window": {"startMs":0,"endMs":0}, "violates": true, "firstViolationMs": 0,
     "invariantViolated": "string", "whatShould": "string", "whatDoes": "string",
     "frameRefs": ["path"], "confidence": 0.0 }
   ```
4. The **earliest `violates:true`** verdict is the offending frame. If none violate, report
   "could not reproduce / no divergence found" with the clean video — never invent a finding.

## Stage 4 — Diagnose

At the offending `firstViolationMs`, pull time-aligned signals within ±150ms:
- `console.jsonl` — errors/warnings at that `tMs`.
- `network.jsonl` — failed/pending requests overlapping that `tMs`.
- nearest `dom-snapshots/<tMs>.json` — computed style (e.g. `opacity:0`, `zIndex`, `display`).
- `trace.zip` (open with `npx playwright show-trace`) — long tasks / paint timing.

State the root cause and **cite the specific signal that proves it**, traced to `file:line`.
If no signal corroborates the visual anomaly, say so and lower confidence — never guess a cause.

## Stage 5 — Close the loop (≤3 attempts)

1. Apply the proposed fix to the source.
2. Re-run the **identical** capture with a new slug (e.g. `<slug>-after`).
3. Extract the same `firstViolationMs` from the new video and compare against the invariant.
   - **Resolved** → write `glitch-<slug>/report.md` (offending frame, what-should-vs-does,
     proven cause, the fix, before/after frame pair) and commit the fix with a focused message.
   - **Not resolved** → refine and retry, bounded to 3 attempts total, then hand back with
     findings rather than thrashing.

## Safety rails

Clean tree only; own branch/worktree; one focused commit at the boundary; never auto-push;
never force-anything. The `run-after.webm` is the visual evidence artifact — strictly better
than a screenshot.
