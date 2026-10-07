---
name: engine-infra
description: Use when the artifact is SYSTEM STATE, not code — a data-store migration, a deploy, a backfill, a schema change against live data, or anything touching production or hard-to-reverse infrastructure. Triggers on "migrate this database/table", "deploy", "backfill", "cut over to", "infrastructure change", "rollback plan", "production data change". The gate here is data-shaped and the harness comes BEFORE the change.
user-invocable: false
---

# Infra mode — the loop pointed at system state

The same loop engine, with SYSTEM STATE as the artifact. Drive it from the station skeleton:

**`templates/infra-template.md`** — the infra-mode stations.

The full method is in the **agent-loops playbook** (`agent-loops` plugin →
`references/agent-loops-playbook.md`). Install `agent-loops` for the depth.

The rules that make infra mode safe:

1. **Build the guardrail harness BEFORE any change touches the system.** For a migration,
   that is a **parity harness**: row counts, checksums, a query-replay diff between old and
   new. The loop closes against "**parity check passes**," never "the script ran without
   error." Run parity checks at high effort.
2. **Dry-run diff → canary → rehearsed rollback.** Verify the change as a diff first. Apply
   it to a canary slice. Rehearse the rollback before you need it. Never run unattended
   against production data without all three.
3. **Simplify = smallest blast radius.** Prefer a change that re-applying newer code can
   reverse over one that deletes or rewrites irreversibly. Surface the blast radius to the
   human before any irreversible step.

Honor every fixed-infra hard rule (pinned ports/services, prod env, force-push) without
exception.

## Gotchas

- A migration script that exits 0 against a silently wrong target is the failure mode →
  close the loop on parity, not on exit code.
- An untested rollback is not a rollback → rehearse it before the change.
- Infra mode is where routing around a guardrail does the most damage → stop at a guardrail;
  never route around it.
