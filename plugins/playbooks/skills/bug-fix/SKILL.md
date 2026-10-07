---
name: bug-fix
description: Red-green-trace bug fix — verify each claimed bug before changing code, so correct code stays untouched. Manual only: /bug-fix.
disable-model-invocation: true
---

# Bug Fix Playbook — Red-Green-Trace

Fix bugs without fixing correct code or leaving incomplete fixes. Never change production code until a failing test confirms the claimed bug. Bug reports describe plausible issues, not verified ones; the failing test is the verification.

Run at high effort. Effort catches missed edge cases; it does not fix a wrong approach. Done means a test that failed before the fix passes after it, the callers are traced, and neighboring suites still pass.

## Protocol: Red-Green-Trace

### 1. Red — Prove the bug exists

Write a test that **encodes the bug report's claim**, not just the code path.

- The test must **fail** because of the specific broken behavior described.
- If it passes immediately, stop: the bug may not exist. Work through the logic (algebra, control flow, data flow) before you touch production code.
- If it fails for a different reason than claimed, the bug description is wrong. Investigate the real behavior before you fix.

**What makes a good "red" test:**
- Asserts the **wrong output**, not just "the function runs"
- Uses inputs that **distinguish the buggy formula from the correct one** (e.g., non-uniform values that break a mean-vs-sum assumption)
- Is minimal — tests one claim, not the whole module

### 2. Green — Smallest change that flips the test

- Apply the **minimal** production change that makes the failing test pass.
- If the fix touches multiple files or "cleans up" nearby code, split it: fix the bug in one change, clean up separately. Large fixes hide incomplete fixes, because you can't tell which part mattered.

### 3. Trace — Follow the callers

After fixing a component, **grep for every call site** and verify each one:

- Passes the right arguments to the fixed function
- Handles the changed return value/behavior correctly
- Has at least one test that exercises the **caller → callee wiring**, not just the callee in isolation

This step catches the most common AI-fix failure mode: correct component fix, broken wiring.

## Checklist per bug

```
[ ] Write test encoding the bug claim
[ ] Run it — does it FAIL?
    → Yes: bug confirmed, proceed to fix
    → No:  stop — verify the claim before changing production code
[ ] Does your fix match the original bug claim?
    → If narrower: explicitly document what you're fixing vs what the report said
    → If different: update BUGHUNT.md with the corrected finding
[ ] Apply smallest production fix
[ ] Run it — does it PASS now?
[ ] grep all callers of the changed function
[ ] Verify at least one test exercises caller→callee wiring
[ ] Run neighboring test suites for regressions
```

## When to skip this protocol

- Obvious typos or import errors (the "bug" is self-evident from the error message)
- Adding missing error handling at I/O boundaries (no "wrong behavior" to reproduce — the behavior is a missing guard)
- Documentation or type annotation fixes

For everything else: red, green, trace.

## Gotchas

- Uniform or symmetric test inputs can't tell the buggy formula from the correct one (e.g., uniform odds, where `n * mean(x)` always equals `sum(x)`) → use values that make the two formulas diverge.
- A test that only "exercises the code path" proves the function runs, not that it is correct → assert specific output values.
- A component test alone misses callers that pass wrong data → add an integration test for the call site.
- Fix plus cleanup in one change hides which one made the test pass → use separate commits.
- Silently reframing the bug: the fix and its test address a narrower problem than the report claimed, so the original bug survives → if your fix doesn't match the original claim, say so. Document what you fix and why the original framing was wrong or intentionally scoped down.
