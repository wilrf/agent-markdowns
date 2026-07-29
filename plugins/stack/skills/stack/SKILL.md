---
name: stack
description: The mega skill — one entry point that runs the full operating pipeline on any substantive task. Orchestrates Coast recall, git discipline, the ledger, shaping (brainstorm/plan or the bug-replication protocol), the execution machine (engine + govern/liaison + codex-delegate), and the quality tripod (user-walkthrough, adversarial + security review, simplify), sealed by verification-before-completion. Use on "/stack", "run the stack on …", "use the mega skill on …", or whenever a feature, bug, or build task is substantial enough to deserve the full machine.
argument-hint: [the task: a feature ask, bug report, or build mission]
user-invocable: true
---

# The Stack — one entry point, the whole machine

You are running the operating pipeline end to end on the task in ARGUMENTS.
Do not cherry-pick stages. Each stage names the skill to INVOKE (via the
Skill tool) — the skill's own instructions govern that stage; this file is
the conductor, not the orchestra. Canonical doctrine: `STACK.md` in
wilrf/agent-markdowns; personal copy in `~/.claude/CLAUDE.md`.

## Stage 0 — Recall (before anything else)

INVOKE `coast-cli-skill` and recover what the prompt didn't say:
- **Intent** — what was the user just doing/looking at that prompted this?
- **Scope** — which repo, branch, PR, file, or app is "this"?
- **Context** — errors/messages/state they saw but didn't paste.
Coverage-first; if the window isn't recorded, say "not recorded" and ask.

## Stage 1 — Lane setup (git discipline; violations void the run)

- Parallel or long-horizon work → own worktree off fresh origin/main
  (`git worktree add <dir> -b <branch> origin/main`). Two writers NEVER
  share a checkout.
- Short-lived single-concern branch; one branch → one small PR.
- Pathspec commits only; plain push only (no --force/--no-verify/--mirror/
  --delete/+refspec); NEVER merge to main — the run ends at an open,
  gated PR. Remove the worktree when the lane ends.

## Stage 2 — Ledger (working memory)

INVOKE `ledger`. Create `<task>-progress.md` in the lane root (uncommitted):
goal/gate, phase status, decisions, do-NOT-re-raise, anomalies, and the
SURFACE each finding/proof came from. Update before every commit; /compact
at phase boundaries only. If state isn't in the ledger, it doesn't exist.

## Stage 3 — Shape the work

- **Feature / behavior change** → INVOKE `superpowers:brainstorming`, then
  `superpowers:writing-plans` for anything multi-step.
- **Bug** → the bug-replication protocol, ALWAYS all three, before any fix:
  1. `coast-cli-skill` — frames of what the user actually saw;
  2. `diagnose-ui-glitch` — drive the app, RECORD the repro (.webm +
     first-bad-frame + console/network), for every UI bug not just flicker;
  3. `superpowers:systematic-debugging` — reproduce → isolate → root-cause;
     no behavior edits before the root cause is named.
  A bug without a recorded repro doesn't enter the gate. (Non-UI bugs swap
  leg 2 for a failing test or logged command run.)

## The command tree — model routing for every dispatch

Pin `model` explicitly on EVERY fan-out; an unpinned subagent silently
inherits the session model.

| Tier | Model | Role |
| ---- | ----- | ---- |
| Command | Fable 5 (high) | Orchestrates + governs; never a worker |
| Senior specialist | Opus 5 (high) | Adversarial + security review, hard debugging, shipping prose |
| First workhorse | Codex Sol GPT-5.6 (xhigh, via codex-delegate) | Builds from tight specs; never below xhigh |
| Menial agent | Sonnet 5 | Wide search, browser driving, mechanical sweeps |
| Deterministic runner | Haiku 4.5 | Known-right-answer tasks + cheap search; output machine-checked |

**Escalation spine — the most important decisions pass through Fable's
hands, always.** Work flows down; load-bearing decisions flow up, and only
the command tier disposes: gate definitions, ship/no-ship, architecture and
schema choices, critical-finding adjudication, scope changes and rule
exceptions, anything irreversible or outward-facing. Lower tiers decide
freely inside their lane; Codex-vs-Opus disagreement auto-escalates.

## Stage 4 — Execute (ONE machine: engine + govern + delegate compose)

- INVOKE `engine` (project-scoped version if the repo has one) — the spine:
  design a gate that can prove the work done AND can fail; prove it can
  fail; build and self-verify until green.
- Inside engine phases, INVOKE `codex-delegate` as the default builder —
  engine writes the tight spec, Codex (newest GPT at xhigh) types, engine
  verifies against the gate. In-session implementation needs a stated
  reason.
- Multi-lane phase (repo has `govern`/`liaison`) → `govern` opens ABOVE the
  engines as policy/sequencing authority; each lane's `liaison` clerks the
  mechanics. Liaison never merges (P-8).
- Gate design for anything user-facing MUST include a Playwright leg.

## Stage 5 — Prove (the quality tripod; all legs, every feature)

1. INVOKE `user-walkthrough` — walk every touched workflow like a real
   user, then the edge-case battery. TWO SURFACES, roles never confused:
   local dev = build surface (full freedom, test auth); deployed prod =
   observe surface (READ-ONLY, user's own signed-in browser, confirm
   bug-before/fix-after only). Ledger records surface provenance.
2. Adversarial review — INVOKE `code-review` (or `engine-review`), run on
   Opus 5 per the command tree; adjudicate with `verifying-review-findings`
   where available; the SECURITY LENS is mandatory (authz/authn, injection,
   data exposure — `convex:convex-authz` for Convex backends; skip only for
   zero-attack-surface changes, and say so). Critical findings escalate to
   the command tier for disposition.
3. INVOKE `simplify` on the changed code once it works and survives review.

## Stage 6 — Seal and close

- INVOKE `superpowers:verification-before-completion` — evidence before any
  "done" (the verification Stop hook enforces this; don't fight it, feed it).
- Pathspec commit(s), plain push, open the PR with: confirmed-vs-stale
  findings, gate results with evidence, surface provenance, recordings.
- Retro: promote any trap that bit twice into the playbook/CLAUDE.md;
  update the ledger's outcome; remove the worktree.

## Scale to fit

Small tasks run the same stages thinner — a one-file fix still gets recall,
a branch, a ledger stub, a gate, one walkthrough pass, and verification.
Skipping a stage entirely requires stating why in the ledger.
