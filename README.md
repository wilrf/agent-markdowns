# agent-markdowns

A Claude Code plugin marketplace for autonomous, self-verifying agent work.

Every skill runs the same loop: produce an artifact, verify it against a check that can
**fail**, attack it adversarially, simplify, and repeat until "done" is machine-checkable.

## Plugins

| Plugin | Skills | What it's for |
| ------ | ------ | ------------- |
| **`stack`** | `stack` | One entry point (`/stack <task>`) that runs the full pipeline: recall, git discipline, ledger, shaping, the engine, and the quality tripod. |
| **`engine`** | `engine`, `engine-review`, `engine-audit`, `engine-planning`, `engine-infra`, `goal` | The build loop and its modes (see below). |
| **`ledger`** | `ledger` | A `<task>-progress.md` file as the source of truth, so state survives context loss. |
| **`user-walkthrough`** | `user-walkthrough` | Drive the running app like a real user (Playwright) before you call a feature done. |
| **`diagnose-ui-glitch`** | `diagnose-ui-glitch` | Record a `.webm` of a flicker or timing bug, find the first bad frame, and prove the fix. |
| **`codex-delegate`** | `codex-delegate` | Hand a tightly specified slice to the Codex CLI, then review the diff and run the gate. |
| **`playbooks`** | `spec-review`, `spec-verify`, `bug-hunt`, `bug-fix`, `architecture-doc`, `vibe-audit` | Manual-only playbooks. They never auto-trigger; call them by name. |
| **`agent-loops`** | `engineering-agent-loops` | The reference manual for loop design: the playbook and the goal template. |
| `orchestration` | `govern`, `liaison` | **Archived.** Only for csa-new. Manual-only. |

### Engine modes

| Skill | Artifact | Gate that can fail | Trigger |
| ----- | -------- | ------------------ | ------- |
| `engine` | code | tests / types / lint / smoke | `/engine`, "run the engine on…" |
| `engine-review` | verdict on a change | refute-panel of lens reviewers | `/engine-review`, the stack's review leg |
| `engine-audit` | findings | refute-panels + mandatory repros | "audit / security review / find bugs in…" |
| `engine-planning` | spec / plan | grounding checks + premortem | "plan this / design a spec before coding" |
| `engine-infra` | system state | parity harness, dry-run diff, canary, rehearsed rollback | "migrate / deploy / backfill safely" |
| `goal` | the DONE block | met / unmet with evidence | `/goal` |

## Model routing

The skills name **roles**, not model versions: the main session commands, `opus` reviews,
the newest GPT (through Codex) builds, `sonnet` sweeps, and `haiku` runs deterministic checks.
Always pin `model` on a fan-out, because an unpinned subagent inherits the session model.

## Install

```sh
/plugin marketplace add wilrf/agent-markdowns
/plugin install stack@agent-markdowns
/plugin install engine@agent-markdowns
```

To edit the skills in place, symlink them into `~/.claude/skills/` instead:

```sh
ln -s ~/agent-markdowns/plugins/engine/skills/engine ~/.claude/skills/engine
```

## License

MIT
