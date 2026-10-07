---
name: engine
description: Use when the user says "use the engine for this", "run the engine on …", "/engine", or asks for an autonomous or long-horizon build that should design its own checks and verify its own work before it hands back. Also use for multi-day runs that must survive context loss without a human in the loop.
user-invocable: true
---

# The Engine

One entrypoint for autonomous, self-verifying builds. Given any task you: understand the intent →
**design a gate that can prove it done and can fail** → set your own target → build and
self-verify until green → commit and push a focused slice. You run end to end without pausing for
permission, and stop only at a genuine wall you cannot legitimately pass.

**Bind to the active project first.** The engine is project-agnostic; its gate is not. Read the
repo's contract (`CLAUDE.md` / `AGENTS.md`, `package.json` scripts or `Makefile` /
`pyproject.toml` / `justfile`, any `.claude/docs` loop or goals doc) before you design. Prefer a
documented aggregate "done" gate or goal template over one you invent.

## Core idea — you design the gate

- A gate must be able to fail. Before you trust it, confirm it rejects a planted wrong answer.
- The main risk is not bugs — the gate catches those. It is a confidently verified **wrong
  target**. State the DONE block explicitly and log it to the ledger before you build.
- The gate is permanent; the harness around it is temporary. Use the lightest harness that holds
  the gate (see `references/retro.md`).

## The autonomy contract

You do not ask for permission. When you understand the task, invoke `goal` with the DONE
condition (it writes the binding DONE block to the ledger). Then run to a green, committed,
**pushed** slice — no target sign-off, no done-handoff pause. Only walls stop you:

- **Hard blocker** — a check that cannot legitimately pass (auth/preflight fail, a fixed port
  already taken, a prod-env / force-push / project-forbidden operation). Try every legitimate
  path, then surface it with ledger state. Never fake a green, never bypass an auth gate, never
  edit ports/env/secrets to dodge it. An honest stop beats a false "done."
- **Safety cap** — a runaway loop surfaces with ledger state, never as a silent give-up.
- **Irreversible or destructive fork** — a data migration, a public API or contract change, an
  added dependency, deleting another lane's work, anything outward-facing or hard to undo.
  Surface it with a recommendation, because a wrong call here is unrecoverable.

**Decide vs. surface.** You own every reversible call and the target itself: implementation,
naming, helpers, local refactors, what "done" means. Decide, log, keep moving. Surface a fork only
when it (a) is hard to reverse, as above, or (b) trades a value the human owns — security or
privacy posture, cost, product behavior — with no obviously right answer. Bring a recommendation
and the alternatives, not an open question. Auto-deciding an (a)/(b) fork is one failure mode;
pausing for a reversible call is the other.

Invoking the engine is the standing `Workflow` opt-in. Announce heavy fan-out (what runs in
parallel, rough scale) before it runs, and honor a `+Nk` budget directive.

**Blocked boundary.** A phase whose gate depends on unmerged external work is complete once the
unblockable part is done and the blocker is in the ledger. Close at the achievable frontier and
move to the next phase; never spin on it.

## The pipeline — 4 stages, no permission gates

**Stage 0 — Understand and design the gate.** Read intent and scope; route the mode(s). Classify
the work: deterministic (a machine check judges it) or non-deterministic (UI/UX, taste). Scale to
size: a quick confirm for small work, `superpowers:brainstorming` for large. Write a
machine-checkable DONE block (exit codes, checked artifacts). Design the gate. Invoke `goal`, log
the target and gate to the ledger, and proceed.

**Stage 1 — Plan.** Planning is the highest-ROI scaffold: a written plan reportedly lifts a medium
task from ~20–30% to ~70–80% success for a few hundred tokens. For any non-trivial fork, generate
2–3 approaches and pick one with a one-line reason. Check **grounding** (verify the load-bearing
assumption against real files and APIs) and run a **premortem** (how could this be wrong?). Every
phase names the gate it closes against. Log rejected alternatives and why, so a later phase does
not relitigate them. Write the plan to disk.

**Stage 2 — Build** at the session default effort. Drive the project's goal/station template if
it has one. Read the neighboring code first; match its conventions, naming, types, and error handling. No
dead branches or commented-out husks. Reuse before you add: a new abstraction needs a second caller or a real boundary.
Make the smallest readable diff and delete the code you replace. Where the gate needs a missing
check, write the failing test first and watch it fail. Fan out builders for large work. Update
the ledger before each commit.

**Stage 3 — Verify** at high effort. Run the gate and loop until green. Re-run the real user
journey after every fix. Run the adversarial verify panel. Raise effort before you move to a
bigger model. Effort fixes missed edge cases, not a wrong approach — change the plan for that.

**Stage 4 — Retro, commit, push.** Promote ledger traps (retro). Make ONE **pathspec** commit of
the focused slice — never bundle others' dirty files — then plain `git push` of that branch.
Report done with the ledger summary. PR, merge, and deploy stay out of scope: they pull others in.

## Anomaly triggers

Stop and log to the ledger the instant one fires, at any stage:
- behavior that matches no code in the tree
- tests green but the feature visibly dead or blank
- a failure that disappears without your fix explaining why
- logs that reference files or models you did not touch
- silent success (an operation without the side effects it should have had)
- a gate that goes green on empty arrays

**Every mocked boundary** must name the station that exercises the real thing. A boundary with
none is a ledger-recorded gap.

## Hard rules

The active repo's `CLAUDE.md` / `AGENTS.md` rules win. Universally:
- **Fixed infra is fixed.** A pinned port or service is taken → stop and report; never move it.
- **Push policy.** Plain `git push` only. Never `--force` / `--no-verify` / `--mirror` /
  `--delete` / `+refspec`, and never the project's break-glass env flags, unless the human
  explicitly authorizes it for this run.
- **Never touch prod env/secrets** to make a local gate pass.
- **Root cause only.** No check suppression (lint-disable, `any`, `# type: ignore`).

## Gotchas

- A production build validates prod env/secrets and fails locally for unrelated reasons → do not
  use it as a local gate unless the project says to; it is a CI concern past the pushed slice.
- Unit tests that mock a dependency are blind to its integration bugs → run the smoke path for
  any user-journey change; the smoke is load-bearing.
- Green on dev proves dev, never the deployed claim → pin the surface the claim is about.
- A gate check behind a slow data repair stalls red-green → seed one fixture the live path
  processes in seconds; give the slow repair its own non-blocking check.
- Layered failures hide behind each other → "the last error is gone" is not green.
- The first approach that comes to mind silently commits you to its constraints → generate 2–3.
- Three identical reviewers find the same bug three times → one lens per failure class.
- A simplicity lens without a hunt list returns style nits, and it has the panel's highest
  false-positive rate → give it the hunt list; adjudicate it hardest.
- ~1 in 3 minor findings collides with reality (verifiers do not know the lint config or
  history) → check each against the real gate; log rejections to do-NOT-re-raise.
- A panel that silently errors looks the same as one that found nothing → pin the verifier model.
- Perfectionism on the non-deterministic tail is its own failure mode → spend to a bug budget.

## Read when

- `references/gate-design.md` — Stage 0: find project checks, browser-leg contract, prove the
  gate can fail, deterministic vs non-deterministic work.
- `references/verify-panel.md` — Stage 3: panel lenses, adjudication, phase-end
  verification matrix.
- `references/fan-out.md` — any subagent dispatch: pipelines, workflows, nesting, subagent goals, and
  fan-out gotchas.
- `references/context-budget.md` — multi-phase or multi-day runs: ledger, compaction, sessions,
  and context gotchas.
- `references/retro.md` — Stage 4, before you declare DONE; pruning the harness.
