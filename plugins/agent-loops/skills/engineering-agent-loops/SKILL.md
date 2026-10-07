---
name: engineering-agent-loops
description: The reference manual for loop design — how to structure a /loop, a dynamic Workflow fan-out, a headless `claude -p` run, a maker/checker subagent pair, or worktree parallelism. Use when DESIGNING a loop's shape ("set up a loop", "create a workflow to…", "fan out agents", "parallelize with worktrees"). Not for running a build (use engine) or setting the done condition (use goal).
user-invocable: true
---

# Engineering Agent Loops & Goals — the foundation

The full operating manual lives next to this file:
**`references/agent-loops-playbook.md`**. Read it before you design the loop.

Wherever the manual says **`verify`**, substitute your project's real aggregate gate (the one
command that chains type-check + lint + tests into a single exit code).

## The four modes (all ship as skills in the `engine` plugin)

The loop is one engine: produce an artifact → verify it against something that can **fail** →
attack it adversarially → simplify → iterate to a machine-checkable done. Only four bindings
change with the work:

| Mode | Skill (in the `engine` plugin) | Artifact | Gate that can fail |
| ---- | ------------------------------ | -------- | ------------------ |
| **Build** | `engine` | code | tests / types / lint / smoke |
| **Audit** | `engine-audit` | findings | refute-panels + repros |
| **Plan** | `engine-planning` | spec/plan | grounding checks + premortem |
| **Infra** | `engine-infra` | system state | dry-run diff, parity harness, canary, rehearsed rollback |

The mode skills carry their own station template and trigger; this playbook deepens them.

## What the playbook covers

- The one rule: change the harness so the mistake can't recur. **Gate first, agents last.**
- When to use a loop vs. worktrees vs. maker/checker vs. a dynamic Workflow — vs. just doing it.
- The four-station loop (Plan → Act → **Verify** → Fix) and why station 3 must be able to *fail*.
- The **adversarial verify panel**: lens-specialized verifiers (correctness / your domain-invariant lens / simplicity), the "adjudicated — do NOT re-raise" list, model pinning.
- The verification gate: compose your real checks into one green/red gate; tier it (fast every iteration, full at phase boundaries).
- Why mocked-component tests can't catch integration bugs, and why layered failures need the *user journey* re-run after every fix.
- Verifiable "done"/goal conditions (no vibes), and how `/goal` composes with subagents.
- **Shared-environment traps**, **context budgeting** for long loops, the **self-improving retro station**, and **engineering "noticing"** (anomaly triggers, negative-space audits, cross-tenant isolation tests).
- **Provisioning an overnight lane** (night-shift retro) and **re-slicing onto a moved base** (harvest retro).
- **How Claude Code's own team runs agents (Boris Cherny)**: scaffolding is temporary — build the lightest harness the model still needs; planning is the highest-ROI scaffold; spend to a bug budget, not to zero.
- **`templates/goal-template.md`** — the copy-paste station skeleton. Start every long-horizon `/goal` from it.

Quick gut-check before you loop:

1. Is there a command that can actually **fail**? No gate = no loop.
2. Is "done" stated as an exit code or checked artifact, not a vibe?
3. If it's a dynamic Workflow — did the user **explicitly opt in**?
4. Is the iteration count **capped** so a stuck loop dies?
5. Does it respect the repo's HARD RULES (ports, push flags, prod env)?
6. Will the loop outlive a context window? Then loop state goes in a **ledger file on disk**,
   updated before every commit — and `/compact` runs at phase boundaries, not mid-edit.
7. Does the goal prompt include the **retro station** — promoting ledger traps into the manual
   before declaring done?
8. Is the harness **no heavier than the model needs**? A panel, fan-out, or station that no
   longer changes the outcome is debt — rip it out. The gate is permanent; the scaffolding
   around it is meant to be deleted as models improve.

If any answer is no, fix that before starting. Then follow the manual.
