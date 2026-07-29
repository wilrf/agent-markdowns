---
name: user-walkthrough
description: The Playwright leg of the quality tripod — drive the running app like a real user to prove a feature works in the browser. Use after implementing any user-facing feature, before claiming it done, or when asked to "user-test this", "walk through the feature", or "prove it works in the browser". Walks every workflow the feature touches, then runs the edge-case battery; findings and screenshots go to the ledger.
user-invocable: true
---

# User walkthrough — prove the feature in the browser

Green unit tests are NOT this. This skill exists because "code is right but
the product is broken" is a failure class only a browser can catch: dead
buttons, unwired state, layout collapse, a form that submits nowhere. The
feature must be SEEN working, driven the way a user would drive it.

## 0 · Setup — know your surface

Most projects have two testable surfaces with DIFFERENT roles. Walk both,
never confuse them:

- **The build surface** (local dev, e.g. `localhost:3000`) — full freedom:
  drive, mutate, seed, instrument. Fixes are built and gate-verified here
  first. Playwright / Playwright MCP with the project's storage-state auth.
- **The observe surface** (deployed production, e.g. the project's Vercel
  URL) — READ-ONLY. Used only to (a) confirm a defect exists for real users
  before fixing and (b) confirm the fix after it deploys. No mutations, no
  test data; actions that trigger real AI/API cost sparingly. Prefer the
  user's own signed-in browser (Claude-in-Chrome) here; never wire test
  auth against prod.

The ledger records which surface every finding and every proof came from —
a bug repro'd only on dev might be env noise; a fix verified only on dev is
not user-verified.

- Find the running app (dev server, preview URL) or start it with the
  project's own launch method. Note the base URL + surface in the ledger.
- Use the Playwright MCP tools (`browser_navigate`, `browser_snapshot`,
  `browser_click`, `browser_fill_form`, `browser_take_screenshot`, ...) when
  available; otherwise write a Playwright script. Snapshot > screenshot for
  asserting text/structure; screenshot for visual evidence.
- If the feature has auth-gated paths, get to a signed-in state the project's
  normal way (seeded test user, dev bypass). NEVER type real credentials.

## 1 · Enumerate the workflows

Before touching the browser, list every user workflow the feature touches —
not just the happy path the implementer had in mind:

- The primary flow(s) the feature was built for, end-to-end (start from
  where a real user starts, not from the feature's own URL).
- Adjacent flows that share state with the feature (the list that shows the
  thing you created; the dashboard count it should bump).
- Each user role that can reach it, if roles differ.

Write the list to the ledger as a checklist. This list is the test plan;
walking it is non-negotiable, additions during the run are welcome.

## 2 · Walk each workflow

For each workflow: drive it like a user (click what a user clicks, type what
a user types), assert the outcome at the END of the flow (the data shows up,
the state persists after a reload), and capture one screenshot at the
decisive moment. Mark the checklist item pass/fail with a one-line note.

## 3 · The edge-case battery

Run against the feature's main surface. Skip an item only with a stated
reason:

- **Empty states** — new user / zero data: does the feature render, guide,
  and not crash?
- **Invalid input** — wrong types, too-long strings, required fields blank,
  paste of junk: rejected gracefully, with a usable message?
- **Double-actions** — double-click submit, rapid repeat clicks: one
  mutation or two? (look at the data, not the UI)
- **Refresh mid-flow** — reload halfway through: state recovers or resets
  cleanly, no half-written data?
- **Rapid navigation** — leave mid-action, come back: no stuck spinners,
  stale state, or console errors?
- **Small viewport** — mobile width (~375px): usable, nothing clipped or
  unreachable?
- **Back button** — after completing the flow: no resubmission, no broken
  state?

Watch the browser console throughout — errors are findings even
when the UI looks fine.

## 4 · Report

Everything goes to the ledger, then a short report: per-workflow pass/fail
table, edge-case battery results, findings with screenshot evidence, and an
explicit list of anything NOT exercised (the unexercised cells). A finding
here feeds the fix loop — the walkthrough reruns after fixes until the
checklist is green.

## Scope guard

This is user-level verification of one feature, not a full regression suite.
Keep it proportional: a small feature is ~10 minutes of driving, not an
afternoon. For motion/timing defects (flicker, flash, stutter) hand off to
`diagnose-ui-glitch` — video catches what interaction can't.
