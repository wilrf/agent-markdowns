---
name: planning
description: Use when the artifact is a SPEC or PLAN, not code — design a feature before any implementation, break a large task into phased work, produce an architecture/design doc, or pressure-test an approach. Triggers on "plan this", "design a spec for", "before coding, plan", "break this down into phases", "architecture plan", "what's the approach for". The output is a verified plan you then hand to build mode (the engine).
user-invocable: false
---

# Planning mode — the loop pointed at a plan

The same loop engine, with a SPEC/PLAN as the artifact. Drive it from the station skeleton:

**`templates/planning-template.md`** — the planning-mode stations.

The full method is in the **agent-loops playbook** (`agent-loops` plugin →
`references/agent-loops-playbook.md`). Install `agent-loops` for the depth.

What "a gate that can fail" means when the artifact is a plan:

1. **Grounding checks.** Every step must touch files/APIs/tables that *actually exist* —
   verify the load-bearing assumptions against the real tree, don't build the plan on a guess.
   A plan that references a function that isn't there fails its gate.
2. **A premortem panel.** Adversarially ask "how is this plan wrong?" — missing migration,
   unhandled concurrency, a dependency that isn't there yet, a phase that can't be verified.
3. **Every phase names the gate it closes against.** A phase whose "done" you can't state as a
   check is a phase that will spawn a vibe-loop downstream. No un-gated phases.

Simplify = **fewest phases**. The plan emitted here is what build mode (the `engine` plugin)
consumes — so write the done-conditions machine-checkable now; the engine will only be as
honest as the plan it's handed.
