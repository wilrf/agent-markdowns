# The adversarial verify panel

Run read-only verifier subagents at high effort, prompted to break the work, not bless it.
Default each toward "refuted/failing unless proven otherwise." For the full panel procedure,
use the `engine-review` skill.

- **Lens-specialize; do not replicate.** One lens per failure class: `correctness` · one
  **domain-invariant** lens (the one that pays — a data-isolation / visibility boundary,
  money/parity, auth/security, as fits the domain) · `simplicity`.
- **Give simplicity a hunt list:** existing-helper reuse before new code; abstractions that
  do not earn their keep; dead code left by replacements; smallest readable diff. Stage 2
  applies these at write time; the lens is the backstop, not the primary gate.
- **Adjudicate findings; do not obey them.** Check each proposed change against the real
  gate. Log every rejection with its rationale to the ledger's **do-NOT-re-raise** list, and
  paste that list into the next panel prompt.
- **Pin the verifier model** on orchestrated/`Workflow` agents.

## Anomaly triggers

The triggers and the mocked-boundary rule live in the `engine` core. They apply at every stage.

