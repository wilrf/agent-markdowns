---
name: engine-planning
description: Use when the artifact is a SPEC or PLAN, not code — design a feature before any implementation, break a large task into phased work, produce an architecture/design doc, or pressure-test an approach. Triggers on "plan this", "design a spec for", "before coding, plan", "break this down into phases", "architecture plan", "what's the approach for". The output is a verified plan you then hand to build mode (the engine).
user-invocable: false
---

# Planning mode — the loop pointed at a plan

The same loop engine, with a SPEC/PLAN as the artifact. Drive it from the station skeleton:

**`templates/planning-template.md`** — the planning-mode stations.

The full method is in the **agent-loops playbook** (`agent-loops` plugin →
`references/agent-loops-playbook.md`). Install `agent-loops` for the depth.

What "a gate that can fail" means when the artifact is a plan:

1. **Grounding checks.** Every step must touch files/APIs/tables that actually exist. Verify
   the load-bearing assumptions against the real tree. A plan that references a missing
   function fails its gate.
2. **A premortem panel.** Ask adversarially, at high effort, "how is this plan wrong?" —
   a missing migration, unhandled concurrency, a dependency that does not exist yet, a phase
   that cannot be verified.
3. **Every phase names the gate it closes against.** No un-gated phases.

Simplify = **fewest phases**. The engine consumes this plan, so write the done-conditions
machine-checkable now. The engine is only as honest as the plan it gets.

## Gotchas

- A phase whose "done" you cannot state as a check spawns a vibe-loop downstream → rewrite
  it until its done-condition is a check.
