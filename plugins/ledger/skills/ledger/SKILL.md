---
name: ledger
description: Working-memory discipline for any multi-phase task — keep a <task>-progress.md ledger as the source of truth, update it before every commit, and keep it compaction-ready so state survives context loss (compaction lands at phase boundaries; the human or an SDK driver triggers it, never the agent). Use whenever a task will span multiple phases, sessions, or context windows, or when the user says "keep a ledger", "take notes on this", or work resumes after a compaction/clear.
user-invocable: true
---

# Ledger — durable working memory for multi-phase work

This runs under any execution mode: engine, a liaison lane, codex-delegate
orchestration, or plain in-session work. A multi-phase run outlives its
context window, so plan for context loss from the start.

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
- **Findings rejected, with rationale** — the **"do-NOT-re-raise"** list.
  It stops a fresh session from re-litigating settled questions; paste it
  into any fresh session or subagent prompt.
- **Anomalies** — expected X, observed Y, resolved-or-open.
- **Environment facts** — ports, env names, credentials locations (never
  values), quirks discovered the hard way.
- **Unexercised cells** — mocked boundaries and untested paths; each mocked
  boundary must name the station that exercises the real thing.

## Cadence

- **Update before every commit.** The commit and the ledger move together;
  a commit whose state isn't in the ledger becomes archaeology later.
- **Update the instant an anomaly fires.** Logging now beats reconstructing
  later.
- **Compact at phase boundaries only** — right after commit and ledger
  update, with no in-flight state. Not mid-edit, not mid-debug; the ledger
  is what makes compaction safe. In interactive sessions, suggest /compact
  to the human at the boundary. In autonomous runs, keep the ledger
  compaction-ready and trust auto-summarization to land on it.

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

## Gotchas

- The agent cannot invoke `/compact` itself. → Suggest it to the human. A
  headless/SDK driver can send literal `/compact [focus]` between phases (a
  documented SDK input); that is the one place boundary compaction is
  automatable.
- Auto-compaction is lossy and can fire unplanned. → The compactor honors a
  "Compact Instructions" section in CLAUDE.md. Have it always preserve the
  ledger path, the gate/DONE block, and the do-NOT-re-raise list.
