---
name: engine-review
description: The adversarial review panel — lens-specialized Opus reviewer subagents prompted to REFUTE the change (correctness · the task's domain invariant · simplicity-with-hunt-list), optionally a Codex xhigh second opinion, findings returned as files, then command-tier adjudication into the ledger's do-NOT-re-raise list. Use at the quality tripod's review leg, on "/engine-review", "run the review panel", or wherever doctrine says INVOKE code-review/engine-review and no repo-specific review skill exists.
argument-hint: [what to review: a diff, branch, or change description + the domain invariant that must hold]
user-invocable: true
---

# Engine review — the adversarial panel

Reviewers are prompted to BREAK the work, not bless it; a finding survives
only if it withstands a genuine attempt to kill it. This is the standing
substitute wherever doctrine names `code-review`/`engine-review` and the
repo has no review skill of its own.

## Launch the panel (one message, parallel, models PINNED)

Spawn three read-only reviewer subagents on `model: opus` — one lens per
failure CLASS, never three generalists:

1. **Correctness** — concrete failure scenarios only (inputs/state → wrong
   behavior), boundary/ordering/compat traps; style is out of scope.
2. **Domain invariant** — THE property this change must not break, named
   explicitly in the prompt (data isolation/visibility, money/parity,
   auth — pick the task's). Frame as: construct the violating scenario.
3. **Simplicity with a hunt list** — ONLY: existing-helper reuse, unearned
   abstractions, dead code left by the replacement, drive-by hunks,
   duplicated fixtures. Warn it that its false-positive rate is the
   panel's highest.

Optionally add a **Codex xhigh advisor** (read-only, diff pasted inline) as
an independent-model lens — use liberally, it is effectively free.

Every reviewer prompt carries: the worktree path + change set, the ledger's
**do-NOT-re-raise list** (pasted, so settled questions stay settled), and
the output contract: write full findings to a FILE (path you assign),
return only counts-by-severity + the path. The main loop reads findings
files only — never reviewer transcripts.

## Adjudicate (command tier disposes — findings are input, not verdict)

- Verify each finding against the actual code before accepting (~1 in 3
  minor findings collides with reality); independent convergence across
  reviewers is the strongest signal a finding is real.
- ACCEPTED findings become fixes with tests where testable — and a fix
  round exceeding ~5 edits is a new delegate slice, not in-session surgery.
- REJECTED findings go to the ledger's do-NOT-re-raise list WITH rationale.
- Critical findings escalate per the command tree; re-run the touched gate
  checks after applying fixes (fresh evidence, never carried-over green).

## Scope notes

- The SECURITY LENS is mandatory across the tripod: if lens 2 wasn't
  security, run the dedicated pass (`security-review`, or the repo's authz
  skill, e.g. `convex:convex-authz`); skip only for zero-attack-surface
  changes, and say so in the ledger.
- The simplicity lens's accepted+applied findings satisfy the tripod's
  simplify leg — state the substitution in the ledger.
