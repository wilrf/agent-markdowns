# Context budgeting — the run outlives its window

A multi-phase run exceeds one context window, and the main loop auto-compacts. Engineer for it.

- **Ledger first.** The ledger is the source of truth; the conversation is scratch. State
  that is not in the ledger does not exist.
- **Compact at phase boundaries only** — right after a commit and a ledger update, with zero
  in-flight state. Never mid-edit. In interactive runs, suggest `/compact` to the human.
  Autonomously, keep the ledger compaction-ready and trust auto-summarization.
- **Reads cost context too.** Send any read over ~200 lines to a reader subagent that returns
  conclusions, not file dumps. A post-review fix round over ~5 edits becomes a new delegate
  slice, not in-session surgery.
- **Session-per-phase ratchet (multi-day scale).** Run each phase as a fresh session or a
  headless `claude -p` with this contract: read ledger → do the next unchecked phase → run
  gates → commit → update ledger. Each phase carries its own completion condition in the
  ledger. A `-p`/SDK driver can also send a literal `/compact [focus]` (a documented SDK
  input) between phases — the one environment where boundary compaction is real.
- **Fan out builders, not just verifiers.** Every inline Read/Edit lands in the main window.

## The ledger (`<plans-dir>/<task>-progress.md`, created in Stage 0)

Update it before every commit. Put it where the project keeps plans (e.g. `.claude/plans/`)
or beside the work. Sections:
- **Goal / DONE block** (the target you set) and **the designed gate**
- **Phase status** (per phase: todo / done / blocked-with-reason)
- **Decisions made** (with the alternatives rejected and why)
- **Findings REJECTED with rationale** (the do-NOT-re-raise list)
- **Anomalies** (expected X, observed Y) · **environment facts** · **unexercised cells**

## Gotchas

- Auto-compaction is lossy, and the agent cannot invoke `/compact` itself → keep the ledger
  compaction-ready; suggest `/compact` to the human at phase boundaries.
- Surgical exceptions compound into a burned window → a fix round over ~5 edits becomes a new
  delegate slice; reads over ~200 lines go to a reader subagent.
- Inline building is the biggest context burner → for large phases, delegate the writes too.
