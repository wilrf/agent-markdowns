---
name: infra
description: Use when the artifact is SYSTEM STATE, not code — a data-store migration, a deploy, a backfill, a schema change against live data, or anything touching production or hard-to-reverse infrastructure. Triggers on "migrate this database/table", "deploy", "backfill", "cut over to", "infrastructure change", "rollback plan", "production data change". The gate here is data-shaped and the harness comes BEFORE the change.
user-invocable: false
---

# Infra mode — the loop pointed at system state

The same loop engine, with SYSTEM STATE as the artifact. Drive it from the station skeleton:

**`templates/infra-template.md`** — the infra-mode stations.

The full method is in the **agent-loops playbook** (`agent-loops` plugin →
`references/agent-loops-playbook.md`). Install `agent-loops` for the depth.

The one rule that makes infra mode safe:

1. **Build the guardrail harness BEFORE any change touches the system.** For a migration, that
   is a **parity harness** — row counts, checksums, a query-replay diff between old and new.
   The loop closes against "**parity check passes**," NEVER "the script ran without error." A
   migration script that exits 0 against a silently-wrong target is the failure mode.
2. **Dry-run diff → canary → rehearsed rollback.** Verify the change as a diff first; apply to
   a canary slice; and **rehearse the rollback** before you need it — an untested rollback is
   not a rollback. Never run unattended against production data without this.
3. **Simplify = smallest blast radius.** Prefer the change that can be reversed by re-applying
   newer code over the one that deletes/rewrites irreversibly. Surface the blast radius to the
   human before any irreversible step.

Honor every fixed-infra HARD RULE (pinned ports/services, prod env, force-push) without
exception — infra mode is exactly where routing around a guardrail does the most damage.
