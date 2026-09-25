---
name: goal
description: Set or evaluate the run's binding goal (the ledger DONE block). With arguments, write/refresh the GOAL/DONE block in the active ledger; bare, evaluate current state against it and report met/unmet with evidence. Use on "/goal", "set the goal", at engine Stage 0, or whenever doctrine says to set /goal.
argument-hint: [the DONE condition — or empty to evaluate the current goal]
user-invocable: true
---

# Goal — the ledger DONE block, made invocable

The goal lives in ONE place: the active ledger's **Goal / DONE** section
(`<task>-progress.md` per the `ledger` skill). This skill reads and writes
that section — it holds no state of its own.

## With arguments — SET

1. Locate the active ledger: the current lane's `<task>-progress.md`
   (worktree/lane root). No ledger yet → invoke `ledger` first, then
   continue.
2. Write the DONE block: machine-checkable acceptance (exit codes /
   checked artifacts / driven-in-browser outcomes), and the gate that
   proves it — per the engine's gate-design rules (each check must be able
   to FAIL; anchor red-green on fast-evaluable fixtures).
3. Re-setting an existing goal mid-run is a SCOPE CHANGE: log old → new
   with the why; command tier disposes.

## Bare — EVALUATE

1. Read the ledger's Goal / DONE block and gate.
2. Run the gate's cheap checks now (fresh evidence only — never claim from
   a previous run); name any expensive checks you did NOT rerun.
3. Report per check: MET with evidence / UNMET with the failing output /
   NOT RUN with the reason. Overall verdict only if every check is MET
   fresh — otherwise state what remains. Update the ledger phase status to
   match.

## Rules

- The DONE block is binding: no "done", "complete", or "ready" claims while
  any gate check is UNMET or stale (the verification Stop hook enforces
  this — feed it evidence, don't fight it).
- Subagents never invoke this skill; give them their goal by writing DONE +
  stations into their prompt (nesting rules per `engine`).
