---
name: engine-review
description: Use at the quality tripod's review leg, on "/engine-review", "run the review panel", "adversarially review this change", or wherever doctrine says to invoke code-review/engine-review and the repo has no review skill of its own.
argument-hint: [what to review: a diff, branch, or change description + the domain invariant that must hold]
user-invocable: true
---

# Engine review — the adversarial panel

Reviewers try to break the work, not bless it. A finding survives only if it withstands a
genuine attempt to kill it. This skill is the standing substitute wherever doctrine names
`code-review`/`engine-review` and the repo has no review skill of its own.

## Launch the panel (one message, parallel, models pinned)

Spawn three read-only reviewer subagents on `model: opus` at high effort — one lens per
failure class, not three generalists:

1. **Correctness** — concrete failure scenarios only (inputs/state → wrong behavior),
   boundary/ordering/compat traps. Style is out of scope.
2. **Domain invariant** — THE property this change must not break, named explicitly in the
   prompt (data isolation/visibility, money/parity, auth — pick the task's). Frame it as:
   construct the violating scenario.
3. **Simplicity with a hunt list** — only: existing-helper reuse, unearned abstractions, dead
   code left by the replacement, drive-by hunks, duplicated fixtures.

Optionally add a **Codex xhigh advisor** (read-only, diff pasted inline) as an
independent-model lens. Use it liberally; it is effectively free.

Every reviewer prompt carries:
- the worktree path and change set;
- the ledger's **do-NOT-re-raise list**, pasted, so settled questions stay settled;
- the output contract: write full findings to a file (a path you assign); return only
  counts by severity plus the path.

The main loop reads findings files only, never reviewer transcripts.

## Adjudicate (the command tier disposes — findings are input, not verdict)

- Verify each finding against the actual code before you accept it. Independent convergence
  across reviewers is the strongest signal that a finding is real.
- Accepted findings become fixes, with tests where testable.
- Rejected findings go to the ledger's do-NOT-re-raise list with the rationale.
- Critical findings escalate per the command tree. After fixes, re-run the touched gate
  checks for fresh evidence; never carry over a green.

## Scope notes

- The **security lens is mandatory** across the tripod. If lens 2 was not security, run the
  dedicated pass (`security-review`, or the repo's authz skill, e.g. `convex:convex-authz`).
  Skip it only for zero-attack-surface changes, and say so in the ledger.
- The simplicity lens's accepted and applied findings satisfy the tripod's simplify leg.
  State the substitution in the ledger.

## Gotchas

- Three generalist reviewers find the same bug three times → one lens per failure class.
- The simplicity lens has the panel's highest false-positive rate → warn it in its prompt
  and adjudicate it hardest.
- ~1 in 3 minor findings collides with reality → verify each against the code before you
  accept it.
- A fix round over ~5 edits turns into in-session surgery that burns the window → make it a
  new delegate slice.
