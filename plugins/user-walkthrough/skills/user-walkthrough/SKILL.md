---
name: user-walkthrough
description: The Playwright leg of the quality tripod — drive the running app like a real user to prove a feature works in the browser. Use after implementing any user-facing feature, before claiming it done, or when asked to "user-test this", "walk through the feature", or "prove it works in the browser". Walks every workflow the feature touches, then runs the edge-case battery; findings and screenshots go to the ledger.
user-invocable: true
---

# User walkthrough — prove the feature in the browser

Green unit tests do not prove this. Some failures exist only in the browser:
dead buttons, unwired state, layout collapse, a form that submits nowhere.
You must see the feature work, driven the way a user drives it.

Run this skill at high effort. Effort fixes missed edge cases, not a wrong
approach.

## 0 · Setup — know your surface

Most projects have two testable surfaces with different roles. Walk both and
keep them apart:

- **The build surface** (local dev, e.g. `localhost:3000`) — full freedom:
  drive, mutate, seed, instrument. Build and gate-verify fixes here first.
  Use Playwright / Playwright MCP with the project's storage-state auth.
- **The observe surface** (deployed production, e.g. the project's Vercel
  URL) — READ-ONLY. Use it only to (a) confirm a
  defect exists for real users before you fix it and (b) confirm the fix
  after it deploys. No mutations, no test data. Trigger real AI/API cost
  sparingly. Prefer the user's own signed-in browser (Claude-in-Chrome)
  here. Never wire test auth against prod.

The ledger records which surface every finding and every proof came from.

- Find the running app (dev server, preview URL) or start it with the
  project's own launch method. Note the base URL and surface in the ledger.
- Use the Playwright MCP tools (`browser_navigate`, `browser_snapshot`,
  `browser_click`, `browser_fill_form`, `browser_take_screenshot`, ...) when
  available; otherwise write a Playwright script.
- For auth-gated paths, sign in the project's normal way (seeded test user,
  dev bypass). Never type real credentials.

## 1 · Enumerate the workflows

Before you open the browser, list every user workflow the feature touches —
not only the happy path the implementer had in mind:

- The primary flow(s) the feature was built for, end-to-end. Start where a
  real user starts, not at the feature's own URL.
- Adjacent flows that share state with the feature (the list that shows the
  thing you created; the dashboard count it should bump).
- Each user role that can reach it, if roles differ.

Write the list to the ledger as a checklist. This list is the test plan:
walk every item. Add items when the run reveals them.

## 2 · Walk each workflow

For each workflow: drive it like a user (click what a user clicks, type what
a user types), assert the outcome at the END of the flow (the data shows up,
the state persists after a reload), and capture one screenshot at the
decisive moment. Mark the checklist item pass/fail with a one-line note.

## 2.5 · What a valid outcome assertion IS

Every workflow's pass/fail is judged by an assertion with all four parts:

1. **Content, not container.** Assert the thing the user came for — the
   specific rows, IDs, values, or answer text expected for THIS input.
   A wrapper that also renders while loading, empty, or failed (a heading,
   panel, toast, spinner) proves nothing.
2. **Terminal state.** Wait for the flow's end state (answered / saved /
   rejected), then assert. An assertion that can pass mid-flight is invalid.
3. **Pinned surface.** The assertion runs on the exact surface the claim is
   about, and asserts the app's version/flag marker when one exists (e.g. a
   `data-*` version attribute). A pass on dev proves dev; the claim "works
   in production" requires a pass against the production bundle.
4. **Seen red.** Before trusting its first green, watch the assertion fail —
   run it against the known-broken state, or falsify the expectation once.
   A check that has never said "no" is not yet a check.

A workflow verified by an assertion missing any part is UNVERIFIED — mark it
as such in the ledger and report.

## 3 · The edge-case battery

Run against the feature's main surface. Skip an item only with a stated
reason:

- **Empty states** — new user / zero data: does the feature render, guide,
  and not crash?
- **Invalid input** — wrong types, too-long strings, required fields blank,
  paste of junk: rejected gracefully, with a usable message?
- **Double-actions** — double-click submit, rapid repeat clicks: one
  mutation or two?
- **Refresh mid-flow** — reload halfway through: state recovers or resets
  cleanly, no half-written data?
- **Rapid navigation** — leave mid-action, come back: no stuck spinners,
  stale state, or console errors?
- **Small viewport** — mobile width (~375px): usable, nothing clipped or
  unreachable?
- **Back button** — after completing the flow: no resubmission, no broken
  state?

## 4 · Report

Write everything to the ledger, then a short report: per-workflow pass/fail
table, edge-case battery results, findings with screenshot evidence, and an
explicit list of anything NOT exercised (the unexercised cells). A finding
here feeds the fix loop — rerun the walkthrough after fixes until the
checklist is green.

## Scope guard

This is user-level verification of one feature, not a full regression suite.
Keep it proportional: a small feature is ~10 minutes of driving, not an
afternoon. For motion/timing defects (flicker, flash, stutter) hand off to
`diagnose-ui-glitch` — video catches what interaction can't.

## Gotchas

- A bug reproduced only on dev may be env noise → confirm it on the observe
  surface before you fix it.
- A fix verified only on dev is not user-verified → confirm it on the
  observe surface after it deploys.
- A screenshot cannot assert text or structure → use `browser_snapshot` for
  assertions; keep screenshots for visual evidence.
- A double-click can look fine in the UI and still write two records →
  check the data, not the UI.
- The UI can look fine while the console logs errors → watch the browser
  console throughout; every error is a finding.
