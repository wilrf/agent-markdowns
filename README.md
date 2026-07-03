# agent-markdowns

A Claude Code plugin marketplace for autonomous, self-verifying agent work — the
**agent-loops toolkit**.

## The toolkit: one loop engine, four modes, two plugins

The loop is always the same — produce an artifact → verify it against something that can
**fail** → adversarially attack it → simplify → iterate to a machine-checkable done. Only the
bindings change per mode. All four modes ship in **one plugin** (`engine`); the accumulated
operating manual ships in a second (`agent-loops`) you install alongside for the depth.

| Plugin | Ships | What it's for |
| ------ | ----- | ------------- |
| **`engine`** | four skills | The build mode plus its three sibling modes — one install, no à-la-carte. |
| **`agent-loops`** | foundation | The operating manual every mode rests on — the playbook + the `goal-template`. Install alongside. |

Inside the `engine` plugin, the four mode skills:

| Skill | Mode | Artifact | Gate that can fail | Trigger |
| ----- | ---- | -------- | ------------------ | ------- |
| **`engine`** | build | code | tests / types / lint / smoke | `/engine`, or "run the engine on…" |
| **`engine-review`** | review | findings | refute-panels + mandatory repros | "audit / security review / find bugs in…" |
| **`engine-planning`** | plan | spec/plan | grounding checks + premortem | "plan this / design a spec before coding" |
| **`engine-infra`** | infra | system state | parity harness, dry-run diff, canary, rehearsed rollback | "migrate / deploy / backfill safely" |

`engine` is directly invocable via `/engine`; the three mode skills fire on their own trigger
phrases (above). All four are **richer with `agent-loops` installed alongside** — their skills
reference its playbook for the full method.

## Layout

```
plugins/
├── engine/                       # all four modes, one plugin
│   skills/
│   ├── engine/           SKILL.md + templates/engine-template.md      (build, /engine)
│   ├── engine-review/    SKILL.md + templates/review-template.md
│   ├── engine-planning/  SKILL.md + templates/planning-template.md
│   └── engine-infra/     SKILL.md + templates/infra-template.md
└── agent-loops/                  # the foundation
    skills/engineering-agent-loops/
      SKILL.md
      references/agent-loops-playbook.md   # the accumulated judgment
      templates/goal-template.md           # build-goal stations
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

# The engine (all four modes) + the foundation playbook
/plugin install engine@agent-markdowns
/plugin install agent-loops@agent-markdowns   # recommended — the deep method
```

## Use

```
/engine <your task>          # build mode — directly invocable
```

…or just **describe the work** and the right mode triggers on its own: "audit this for
security" → `engine-review`, "plan the X feature first, don't code" → `engine-planning`,
"migrate this table safely" → `engine-infra`. `/engine` and the `engineering-agent-loops`
skill are directly invocable; the review / planning / infra skills fire on their trigger
phrases.

## License

MIT
