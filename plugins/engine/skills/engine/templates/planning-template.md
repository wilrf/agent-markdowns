# Planning template — the loop machinery pointed at a plan, before any code

The artifact is a PLAN/spec. The gate that can fail: grounding checks (do the
things the plan references actually exist?) and an adversarial panel. Simplify
means SCOPE — the fewest phases that reach the goal. A plan that survives this
loop is cheap; a plan that would have failed it is the most expensive artifact
in software.

---

```
/goal Produce an implementation plan for [WHAT], written to [path].
DONE = every gate below passes; rejected alternatives and the cut-list are
recorded in the plan itself.

STATIONS:
1. DRAFT — judge panel: fan out [N=3] INDEPENDENT plan candidates from
   different angles (MVP-first / risk-first / infra-first). Score with
   parallel judges; synthesize from the winner, grafting runners-up's best
   ideas. One plan iterated N times converges to its first idea; N plans
   compared do not.
2. GROUND — the plan's repro requirement. Verify EVERY factual claim against
   reality: referenced files/APIs/symbols exist (grep them), data shapes
   match the schema, "we already have X" is true, limits/quotas hold.
   An ungrounded claim is downgraded to an assumption and listed as one.
3. ADVERSARIAL PANEL (lens-specialized):
   - premortem: "it is N months later and this plan failed — write the
     post-mortem." Distinct failure narratives, not generic risk lists.
   - scope: what can be CUT and still hit the goal? Every phase must
     justify its existence; the cut-list is part of the deliverable.
   - sequencing: what blocks what; which steps are reversible; where is
     the first user-visible value; what's the cheapest probe of the
     riskiest assumption (do THAT first).
   - [DOMAIN INVARIANT]: the same lens as build mode — plans leak
     security/visibility/money mistakes before code does.
4. GATE-COMPLETENESS — every phase in the plan names its own verification
   gate and done-condition. A phase without a gate is not a phase; it's a
   hope. (This is what makes the plan executable by a build-mode loop.)
5. LEDGER + RETRO — adjudicated panel findings, rejected alternatives with
   rationale (the next planner shouldn't re-derive them).

DONE checks: zero ungrounded claims (or each listed as an explicit
assumption with a probe step); every phase gated; cut-list present;
premortem narratives addressed or accepted as risks.
```

Notes:
- The output plan should be directly consumable by the build-mode goal
  template — phases map to PHASES, per-phase gates map to GATES.
- Small decisions don't need this. Reserve for plans whose failure costs
  more than the panel does.
