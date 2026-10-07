---
name: goal
description: Use on "/goal", "set the goal", "are we done?", "check the goal", at engine Stage 0, or whenever doctrine says to set /goal. With arguments it writes the GOAL/DONE block in the active ledger; bare, it evaluates the current state against that block and reports met/unmet with evidence.
argument-hint: [the DONE condition — or empty to evaluate the current goal]
user-invocable: true
---

# Goal — the ledger DONE block, made invocable

The goal lives in ONE place: the active ledger's **Goal / DONE** section (`<task>-progress.md`
per the `ledger` skill). This skill reads and writes that section. It holds no state of its own.

## With arguments — SET

1. Locate the active ledger: the current lane's `<task>-progress.md` (worktree/lane root).
   If no ledger exists yet, invoke `ledger` first, then continue.
2. Write the DONE block: machine-checkable acceptance (exit codes, checked artifacts,
   driven-in-browser outcomes) and the gate that proves it, per the engine's gate-design
   rules (each check must be able to fail; anchor red-green on fast-evaluable fixtures).
3. Re-setting an existing goal mid-run is a scope change. Log old → new with the why; the
   command tier disposes.

## Bare — EVALUATE

Run the evaluation at high effort.
1. Read the ledger's Goal / DONE block and gate.
2. Run the gate's cheap checks now for fresh evidence; never claim from a previous run. Name
   any expensive checks you did not rerun.
3. Report per check: MET with evidence / UNMET with the failing output / NOT RUN with the
   reason. Give an overall verdict only if every check is MET fresh; otherwise state what
   remains. Update the ledger's phase status to match.

## Rules

- The DONE block is binding. Make no "done", "complete", or "ready" claim while any gate
  check is UNMET or stale. The verification Stop hook enforces this — feed it evidence.
- Subagents do not invoke this skill. Give them their goal by writing DONE + stations into
  their prompt (nesting rules: `engine/references/fan-out.md` §Nesting).
