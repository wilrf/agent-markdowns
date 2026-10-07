---
name: codex-delegate
description: Delegate a well-specified, self-contained implementation slice to the Codex CLI (newest GPT) — a separate subscription, so zero Claude token burn. Use when orchestrating from an expensive session and the slice is mechanical-to-moderate implementation that a tight spec can fully describe. Triggers on "delegate this to codex", "offload to codex", "have codex implement", or when routing per the model-routing table in the stack skill. Do NOT use for convention-heavy work (Convex function patterns, CSA design-philosophy surfaces, anything whose correctness depends on CLAUDE.md context Codex can't see).
---

# Codex Delegate

Offload an implementation slice to `codex exec` (non-interactive Codex CLI).
The value: Codex runs on a separate subscription — every token it spends is a
token Claude doesn't. The risk: Codex sees **none** of your conversation
context, CLAUDE.md conventions, or memory. The spec is the only bridge.
GPT follows a spec closely: a precise spec gets precise output; a vague
spec gets plausible-looking convention violations.

## When to use / not use

**Good fits:** self-contained functions or modules, test authoring against an
existing pattern, mechanical refactors with a clear before/after, scripts,
isolated bug fixes with a known repro.

**Bad fits:** anything touching Convex validators/auth/scheduler patterns,
design-system UI surfaces, cross-cutting changes, work where "correct" is
defined by conventions living in CLAUDE.md or session context. Route those to
a Claude subagent — Opus (high) for hard slices, Sonnet for routine — which
inherits conventions for free.

## Protocol — spec → execute → review → gate

### 1. Write the spec (this is 80% of the job)

Write a spec file to the scratchpad. It must be self-sufficient — assume the
reader has never seen this repo. Include:

- **Task**: exact change, exact files (create/modify), function signatures if known
- **Conventions that apply** (copy them in — Codex cannot see CLAUDE.md):
  naming rules, typing rules (e.g. "never `any`"), import style, file layout
- **Constraints**: what must not change; adjacent code to leave alone.
  Every spec includes: "Do not commit or push — leave changes uncommitted
  for review." (See Gotchas.)
- **Acceptance**: the command(s) that must pass (test, typecheck, lint) and
  expected behavior
- **Context snippets**: paste the relevant existing code it should match in
  style rather than making it hunt

### 2. Execute

Run in an isolated worktree when the repo has parallel work in flight
(default for CSA). Then:

```bash
codex exec \
  -C <work-dir> \
  --sandbox workspace-write \
  -o <scratchpad>/codex-result.md \
  "$(cat <scratchpad>/codex-spec.md)"
```

- Omit `-m` to use the user's configured default model; override with
  `-m <model>` only if the user asks.
- Add `-c model_reasoning_effort=high` for delegated implementation (the
  worker tier in the stack); reserve `xhigh` for advisor-mode consultations
  below. GPT tokens are effectively unlimited (standing directive,
  2026-07-02); the high/xhigh split is about role, not rationing.
- Effort fixes missed edge cases, not a wrong approach. If the diff's shape
  is wrong, fix the spec and re-delegate; don't just raise effort. Raise
  effort before you reach for a bigger model.
- `--sandbox workspace-write` lets it edit files in the work dir but nothing
  else. Never use `--dangerously-bypass-approvals-and-sandbox`.
- Long tasks: run via Bash `run_in_background` and continue other work.

### Advisor mode (read-only, use liberally)

Separate from delegation: consult the newest GPT at xhigh as a second-opinion
advisor whenever a hard design call, stubborn bug, or review verdict deserves
one — cost is not a reason to skip it:

```bash
codex exec --sandbox read-only --ephemeral \
  -c model_reasoning_effort=xhigh \
  -o <scratchpad>/advisor-opinion.md \
  "<question — paste the relevant code/diff/trace inline; Codex sees no session context>"
```

Treat the answer as reviewer input, not a verdict: adjudicate it against the
actual codebase and gates before acting on it (same rule as any verify-panel
finding).

### 3. Review the diff — every time

`git diff` the result and review it yourself as if reviewing a PR from a
skilled contractor who has never seen the codebase:

- Convention violations (the #1 failure mode: `any` types, barrel files,
  missing validators, wrong naming)
- Scope creep — files or behavior changed beyond the spec
- Deleted or rewritten code the spec said to leave alone

Fix small violations yourself; re-delegate with a corrected spec if the shape
is wrong. **Never merge a Codex diff unreviewed** — Codex cannot see the
conventions it may have broken.

### 4. Gate

Run the acceptance commands from the spec (tests, typecheck, lint) in your
own shell before you report the slice done.

## Reporting

Tell the user the slice was implemented via Codex, what the review caught (if
anything), and the gate results. Attribution matters — they're tracking which
subscription absorbs which work.

## Gotchas

- Codex commits and pushes unprompted (learned 2026-07-02), and
  `--sandbox workspace-write` does not block network or `git push` in this
  config — the sandbox bounds file writes, not the network. → Every spec
  says "Do not commit or push."
- Codex's own "it passes" claim is not evidence. → Rerun the acceptance
  commands in your shell.
