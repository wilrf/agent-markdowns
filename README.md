# agent-markdowns

A Claude Code plugin marketplace for autonomous, self-verifying agent work — the
**agent-loops toolkit**.

## The toolkit: one loop engine, four modes

The loop is always the same — produce an artifact → verify it against something that can
**fail** → adversarially attack it → simplify → iterate to a machine-checkable done. Only the
bindings change per mode. Each mode ships as its own plugin, so you install à la carte:

| Plugin | Mode | What it's for |
| ------ | ---- | ------------- |
| **`agent-loops`** | foundation | The operating manual every mode rests on — the playbook + the `goal-template`. Install this first. |
| **`engine`** | build | Build a feature/fix autonomously and self-verify until green, stopping at a committed slice. |
| **`review`** | review | Audits, security sweeps, deep reviews — *findings* as the product (no repro = no finding). |
| **`planning`** | plan | Design a spec/plan before any code; emit a machine-checkable plan build mode consumes. |
| **`infra`** | infra | Migrations / deploys / backfills — the guardrail harness (parity, canary, rollback) comes first. |

The mode plugins are self-contained but **richer with `agent-loops` installed alongside** —
their skills reference its playbook for the full method.

## Layout

```
plugins/
├── agent-loops/   skills/engineering-agent-loops/
│                    SKILL.md
│                    references/agent-loops-playbook.md   # the accumulated judgment
│                    templates/goal-template.md           # build-goal stations
├── engine/        skills/engine/      SKILL.md + templates/engine-template.md
├── review/        skills/review/      SKILL.md + templates/review-template.md
├── planning/      skills/planning/    SKILL.md + templates/planning-template.md
└── infra/         skills/infra/       SKILL.md + templates/infra-template.md
```

Three layers, three lifespans: a **skill** routes (per-trigger), the **playbook** accumulates
(per-repo, grows over time), and your task **ledger** stages (per-task) — the layering that
survives context compaction. The playbook is the distillation of real autonomous runs — among
them a 7-phase semantic-search + RAG build (~4,900 lines across schema, indexing, embeddings,
retrieval, backfill, frontend, monitoring) whose adversarial verify panel caught a real bug
**every phase**, including two security issues no compiler, lint, or test could see — plus an
overnight-lane night-shift retro and a multi-PR harvest off a moved base branch.

## Install

```sh
# Add this marketplace
/plugin marketplace add wilrf/agent-markdowns

# Install the foundation + whichever modes you want
/plugin install agent-loops@agent-markdowns
/plugin install engine@agent-markdowns
/plugin install review@agent-markdowns      # optional
/plugin install planning@agent-markdowns    # optional
/plugin install infra@agent-markdowns       # optional
```

## Use

```
/engine <your task>          # build mode — directly invocable
```

…or just **describe the work** and the right mode triggers on its own: "audit this for
security" → `review`, "plan the X feature first, don't code" → `planning`, "migrate this table
safely" → `infra`. `/engine` and the `engineering-agent-loops` skill are directly invocable;
the review / planning / infra skills fire on their trigger phrases.

## License

MIT
