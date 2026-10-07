# Routing detail — effort, Codex, context economy, coordination

Read when you dispatch a subagent or Codex, choose an effort level, plan a
long run's context budget, or rely on another session's work. The tier table
and the escalation spine live in `../SKILL.md`.

## Effort

- Build at the session default. Run verification and review at high.
- For one hard kernel, spawn one worker at higher effort instead of raising
  the session effort. Use `max` only when Wil asks.
- Raise effort before you move to a bigger model.
- Effort fixes missed edge cases, not a wrong approach. For a wrong
  approach, change the plan.
- Keep the session model fixed. A mid-session switch breaks the prompt
  cache. Hand the work to a subagent instead.

## Codex

- Codex runs on a separate subscription and is effectively free. Use it
  liberally. Implementation slices go through `codex-delegate`.
- Codex effort: high (implementation); xhigh for second opinions.
- Second opinion:
  `codex exec --sandbox read-only --ephemeral -c model_reasoning_effort=xhigh "<question + context>"`.
  Its output is reviewer input, not a verdict.
- From a subagent, wrap it in a `sonnet` agent that runs `codex exec` and
  returns the output verbatim.

## Taste

Anything user-facing (UI, copy, API design) needs a model with taste
(`opus`/`sonnet`), not Codex or `haiku`.

## Context economy

The command tier's window is the scarcest resource.
- Send any read over ~200 lines to a `sonnet` reader that returns
  conclusions, not file dumps.
- A fix round over ~5 edits becomes a new codex-delegate slice, not
  in-session surgery.
- Reviewer subagents return findings files. The main loop reads the
  findings, not transcripts.

## Coordination

- **Decision-block cadence (autonomous runs):** render the decision widget
  at phase boundaries and at close only. Every row must hold a live
  decision.
- **Cross-session handoffs:** before you rely on another session's claimed
  watch or ownership, check it is alive with `list_sessions` (archived or
  not running means the claim is dead). Log the check in the ledger.
