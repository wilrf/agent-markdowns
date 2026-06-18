# Infrastructure template — the loop machinery pointed at system state

The artifact is a STATE CHANGE (migration, deploy, env change, CI/CD, infra
config). The gate is the environment itself: dry-run diffs, parity harnesses,
canary probes, and a REHEARSED rollback. Simplify means smallest blast radius
and fewest moving parts. The defining property of infra work: mistakes are
often irreversible and failures often SILENT — tune the loop accordingly.

---

```
/goal [STATE CHANGE — migration/deploy/config] on [SYSTEM].
DONE = the staged ladder below is climbed with each rung's gate green,
AND rollback has been REHEARSED (executed against a lower rung), not
merely written.

LADDER (no rung may be skipped; each rung is its own loop-until-green):
1. DRY RUN — produce the diff of intended state change (terraform plan,
   migration --dry-run, render the config) and ADVERSARIALLY REVIEW THE
   DIFF like code: blast-radius lens (what can this touch beyond the
   target?), irreversibility lens (which lines can't be undone?),
   [DOMAIN INVARIANT] lens.
2. HARNESS FIRST — before touching the real system, build the thing that
   can say "wrong": parity checks for migrations (row counts, checksums,
   query-replay diff), health probes for deploys, alert thresholds for
   config. The loop closes against THE HARNESS PASSING — never against
   "the script ran without error."
3. LOWER ENVIRONMENT — apply + harness green + ROLLBACK REHEARSAL: actually
   roll back, verify the harness goes green again, re-apply. A rollback
   that has never run is documentation, not capability.
4. CANARY / PARTIAL — smallest real slice. Harness green + soak time.
5. FULL — apply, harness green, then the negative-space check: what did
   the harness NOT measure? List it.

INFRA-TUNED ANOMALY TRIGGERS (stop-and-log, never explain away):
silent success (state change reports OK but the diff shows nothing / the
side effect is absent) · drift (live state ≠ declared state before you
started) · a rung passing FASTER than expected · partial application.

HARD RULES: one writer per environment — check for other actors (other
sessions, CI, operators) before applying; never loop unattended against
production without the parity harness; capped iterations per rung — a
stuck rung fails UP to a human, never improvises sideways.
```

Notes:
- "Done" for infra is never the apply command exiting 0. It's the harness
  green at every rung + rehearsed rollback + negative-space list.
- Cost asymmetry is inverted vs build mode: iteration is cheap in code and
  expensive (sometimes unrepeatable) against real systems. Spend lavishly
  on rungs 1–3 so rungs 4–5 are boring.
