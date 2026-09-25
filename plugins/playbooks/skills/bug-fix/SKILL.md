---
name: bug-fix
description: Red-green-trace bug fix — verify each claimed bug before changing code, so correct code stays untouched. Manual only: /bug-fix.
disable-model-invocation: true
---

# Bug Fix Playbook — Red-Green-Trace

Fix bugs without fixing correct code or leaving incomplete fixes. Every claimed bug must be independently verified before production code changes.

## Protocol: Red-Green-Trace

### 1. Red — Prove the bug exists

Write a test that **encodes the bug report's claim**, not just the code path.

- The test must **fail** because of the specific broken behavior described.
- If it passes immediately → STOP. The bug may not exist. Work through the logic (algebra, control flow, data flow) before touching production code.
- If it fails for a different reason than claimed → the bug description is wrong. Investigate the real behavior before fixing.

**What makes a good "red" test:**
- Asserts the **wrong output**, not just "the function runs"
- Uses inputs that **distinguish the buggy formula from the correct one** (e.g., non-uniform values that break a mean-vs-sum assumption)
- Is minimal — tests one claim, not the whole module

**Common trap:** Tests with symmetric/uniform inputs that can't distinguish between the buggy and correct implementations (e.g., uniform odds where `n * mean(x)` always equals `sum(x)`).

### 2. Green — Smallest change that flips the test

- Apply the **minimal** production change that makes the failing test pass.
- If the fix requires touching multiple files or "cleaning up" nearby code, split it: fix the bug in one change, clean up separately.
- Large fixes hide incomplete fixes — you can't tell which part actually mattered.

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
    → No:  STOP — verify the claim before changing production code
[ ] Does your fix match the original bug claim?
    → If narrower: explicitly document what you're fixing vs what the report said
    → If different: update BUGHUNT.md with the corrected finding
[ ] Apply smallest production fix
[ ] Run it — does it PASS now?
[ ] grep all callers of the changed function
[ ] Verify at least one test exercises caller→callee wiring
[ ] Run neighboring test suites for regressions
```

## Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Test with uniform/symmetric inputs | Can't distinguish buggy from correct formula | Use values that make the two formulas diverge |
| Test that "exercises the code path" | Proves the function runs, not that it's correct | Assert specific output values |
| Component test only, no caller test | Component works but callers pass wrong data | Add integration test for the call site |
| Fix + cleanup in one change | Can't tell if the fix or the cleanup caused the test to pass | Separate commits |
| Trusting bug reports as ground truth | Bug hunters describe plausible issues, not verified ones | The failing test IS the verification |
| Silently reframing the bug | Fix addresses a narrower problem than the report claimed, test verifies the narrower claim, original bug survives | If your fix doesn't match the original claim, say so explicitly: document what you're actually fixing and why the original framing was wrong or intentionally scoped down |

## When to skip this protocol

- Obvious typos or import errors (the "bug" is self-evident from the error message)
- Adding missing error handling at I/O boundaries (no "wrong behavior" to reproduce — the behavior is a missing guard)
- Documentation or type annotation fixes

For everything else: red, green, trace.
