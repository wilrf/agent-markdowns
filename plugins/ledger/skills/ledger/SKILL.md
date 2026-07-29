---
name: ledger
description: Working-memory discipline for any multi-phase task — keep a <task>-progress.md ledger as the source of truth, update it before every commit, and /compact only at phase boundaries so state survives context loss. Use whenever a task will span multiple phases, sessions, or context windows, or when the user says "keep a ledger", "take notes on this", or work resumes after a compaction/clear.
user-invocable: true
---

# Ledger — durable working memory for multi-phase work

Extracted from the engine's context-budgeting discipline so it can run under ANY
execution mode (engine, liaison lane, codex-delegate orchestration, or plain
in-session work). The premise: a multi-phase run outlives its context window,
and auto-compaction is lossy. Engineer for that from the start, not after the
first amnesia incident.

## The prime rule

**Ledger-first: the ledger is the source of truth; the conversation is
scratch.** If state isn't in the ledger, it doesn't exist. Any fact you would
be sad to lose in a compaction goes in the ledger the moment you learn it.

## Setup (at task start)

Create `<task>-progress.md` next to the work (repo root or the task's plan
directory). Sections:

- **Goal / DONE block** — the approved target and, if one exists, the gate
  that proves it.
- **Phase status** — per phase: `todo` / `done` / `blocked-with-reason`.
- **Decisions made** — one line each, with the why.
- **Findings REJECTED with rationale** — the **"do-NOT-re-raise"** list.
  Prevents re-litigating settled questions after context loss; paste it into
  any fresh session or subagent prompt.
- **Anomalies** — expected X, observed Y, resolved-or-open.
- **Environment facts** — ports, env names, credentials locations (never
  values), quirks discovered the hard way.
- **Unexercised cells** — mocked boundaries and untested paths; each mocked
  boundary must name the station that exercises the real thing.

## Cadence

- **Update BEFORE every commit** — the commit and the ledger move together;
  a commit whose state isn't in the ledger is a future archaeology project.
- **Update the instant an anomaly fires** — stop-and-log beats reconstruct-
  later.
- **`/compact` at phase boundaries ONLY** — right after commit + ledger
  update, when there is zero in-flight state. Never mid-edit, never mid-
  debug. The ledger is what makes the compaction safe.

## Resuming (fresh session, post-compact, or handoff)

Contract: **read ledger → do the next unchecked phase → run gates → commit →
update ledger.** A resuming session trusts the ledger over its own
recollection, honors the do-NOT-re-raise list, and appends rather than
rewrites history. For multi-day scale, run each phase as its own session with
exactly this contract.

## With subagents

Subagents don't inherit your memory. Paste the relevant ledger slices —
goal, current phase, do-NOT-re-raise list, environment facts — into their
prompts, and fold their results back into the ledger yourself.

## End of task

Before declaring DONE, run the retro pass over the ledger: promote any trap
that bit twice, cost a phase, or would bite a fresh session into the
appropriate playbook/CLAUDE.md. Session-specific noise dies with the task —
delete or archive the ledger once its lessons are promoted.
