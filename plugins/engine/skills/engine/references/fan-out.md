# Fan-out, workflows, and nesting

Reserve fan-out for genuinely large work: many files, audits, migrations. Builders run at the
session default effort; verifiers run at high effort.

- **`pipeline()` by default.** Items flow through stages with no barrier. Use a barrier
  (`parallel()`) only when a stage needs ALL prior results at once: dedup, early exit on
  zero, cross-item comparison.
- **Verify adversarially in the pipeline.** N skeptics try to refute each finding; kill it on
  a majority refute.
- **Loop until dry** for unknown-size discovery. Keep finding until K rounds return nothing
  new. Dedup against ALL seen findings, not only the confirmed ones.
- **Small payloads.** Subagents and workflows write detail to a file and return counts plus
  the path, not multi-KB blobs into the main loop.
- **Review the delegate's diff.** Self-gating catches most issues; spot-check the largest
  per-file diff.

## Nesting

The engine's goal (the ledger DONE block) is the outermost ring. Phases nest under it, verify
rounds under phases, per-finding refute loops under those. Three rules:
1. Every level has its own done-condition.
2. Inner iterations are cheaper than outer ones.
3. A stuck inner loop **fails up** with its ledger state. It does not improvise a different
   approach — that is the parent's call.

Give a subagent its goal by writing the DONE block and stations into its prompt. The parent
waits for its subagents before it judges "met?".

## Gotchas

- For a small task, a dynamic `Workflow` is just an expensive single agent → fan out only for
  genuinely large work.
