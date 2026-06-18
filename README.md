# agent-markdowns

A Claude Code plugin marketplace for agent skill markdowns.

## Plugins

### `engine` — the autonomous build engine

One entrypoint for autonomous, self-verifying builds. Given any task it:

1. **Understands the intent** and classifies the work (deterministic vs. taste-based).
2. **Designs a gate** that can prove the task done — and, critically, can *fail*.
3. Gets your **sign-off on the target** (Gate 1) before any build.
4. **Builds and self-verifies** against that gate until green, owning every reversible
   call in between.
5. Hands back a **committed slice** (Gate 2) for you to push / PR / merge / deploy.

It carries the full loop discipline inline — gate design, an adversarial verify panel,
fan-out, context budgeting, and a retro pass — so it is self-sufficient for long,
multi-day runs.

#### Bundled depth

The fast path is the engine pipeline. For the broader loop-design space it bundles the
**agent-loops playbook** and copy-paste **station templates**:

```
plugins/engine/skills/engine/
├── SKILL.md                              # the engine entrypoint (auto-loaded)
├── references/agent-loops-playbook.md    # accumulated judgment: build/review/plan/infra
│                                         #   modes, field notes, build order, retro
└── templates/                            # copy-paste skeletons
    ├── goal-template.md      # build stations, all contractual
    ├── engine-template.md    # this engine, parameterized for your repo
    ├── review-template.md    # findings-as-product (audits, security review)
    ├── planning-template.md  # spec/plan as the artifact
    └── infra-template.md     # system-state changes, parity/canary/rollback
```

The playbook is the distillation of a real autonomous run — a 7-phase semantic-search + RAG
build (~4,900 lines added across schema, indexing, embeddings, retrieval, backfill, frontend,
monitoring) whose adversarial verify panel caught a real bug **every phase**, including two
security issues no compiler, lint, or test could see. Three layers, three lifespans: the
**skill** routes (per-trigger), the **playbook** accumulates (per-repo), and your task
**ledgers** stage (per-task) — the layering that survives context compaction.

## Install

```sh
# Add this marketplace
/plugin marketplace add wilrf/agent-markdowns

# Install the engine plugin
/plugin install engine@agent-markdowns
```

## Use

```
/engine <your task>
```

…or just say "use the engine for this" / "run the engine on …".

## License

MIT
