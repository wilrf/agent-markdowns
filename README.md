# agent-markdowns

A Claude Code plugin marketplace for agent skill markdowns.

## Plugins

### `engine` — the autonomous build engine

One entrypoint for autonomous, self-verifying builds. Given any task it:

1. **Understands the intent** and classifies the work (deterministic vs. taste-based).
2. **Designs a gate** that can prove the task done — and, critically, can *fail*.
3. Gets your **sign-off on the target** (Gate 1) before any build.
4. **Builds and self-verifies** against that gate until green, owning every reversible
   call in between.
5. Hands back a **committed slice** (Gate 2) for you to push / PR / merge / deploy.

It carries the full loop discipline inline — gate design, an adversarial verify panel,
fan-out, context budgeting, and a retro pass — so it is self-sufficient for long,
multi-day runs.

## Install

```sh
# Add this marketplace
/plugin marketplace add wilrf/agent-markdowns

# Install the engine plugin
/plugin install engine@agent-markdowns
```

## Use

```
/engine <your task>
```

…or just say "use the engine for this" / "run the engine on …".

## License

MIT
