---
name: stack
description: The mega skill — one entry point that runs the full operating pipeline on any substantive task. Orchestrates Coast recall, git discipline, the ledger, shaping (brainstorm/plan or the bug-replication protocol), the execution machine (engine + govern/liaison + codex-delegate), and the quality tripod (user-walkthrough, adversarial + security review, simplify), sealed by verification-before-completion. Use on "/stack", "run the stack on …", "use the mega skill on …", or whenever a feature, bug, or build task is substantial enough to deserve the full machine.
argument-hint: [the task: a feature ask, bug report, or build mission]
user-invocable: true
---

# The Stack — one entry point, the whole machine

Run the pipeline end to end on the task in ARGUMENTS. Do not cherry-pick stages. Each stage names a
skill to invoke; that skill governs its stage. This conductor is the single
home for model routing, git discipline, the ledger, the bug-replication
protocol, and the quality tripod. Portable doctrine: `DOCTRINE.md`.

## Stage 0 — Recall

Invoke `coast-cli-skill` and recover what the prompt left out: **intent**
(what Wil was just doing), **scope** (which repo, branch, PR, file, or app
is "this"), and **context** (errors or state he saw but didn't paste). If
the window is not recorded, say "not recorded" and ask.

## Stage 1 — Lane setup (git discipline; violations void the run)

- Parallel or long-horizon work gets its own worktree off fresh origin/main
  (`git worktree add <dir> -b <branch> origin/main`). Two writers never
  share a checkout.
- One short-lived, single-concern branch → one small PR. Commit with
  explicit pathspecs only. Never stash, reset, or clean another lane's WIP.
- Plain `git push` only: no --force, --no-verify, --mirror, --delete, or
  +refspec. Never merge to main — merges are Wil's alone; the run ends at an
  open, gated PR. Remove the worktree when the lane ends.

## Stage 2 — Ledger (working memory)

Invoke `ledger`. Create `<task>-progress.md` in the lane root, uncommitted:
goal and gate, phase status, decisions, the do-NOT-re-raise list,
anomalies, and the surface each finding or proof came from. Update it
before every commit. Write each fact the instant you learn it, so the
ledger is always compaction-ready. Unlogged state doesn't exist.

## Stage 3 — Shape the work

- **Feature / behavior change** → `superpowers:brainstorming`; multi-step → `superpowers:writing-plans`.
- **Bug** → the bug-replication protocol, all three legs, before any fix:
  1. `coast-cli-skill` — frames of what Wil actually saw;
  2. `diagnose-ui-glitch` — drive the app and record the repro (.webm,
     first bad frame, console/network) for every UI bug, not only flicker;
  3. `superpowers:systematic-debugging` — reproduce → isolate → root-cause.
     Make no behavior edits before the root cause is named.
  A bug without a recorded repro doesn't enter the gate. Non-UI bugs swap
  leg 2 for a failing test or a logged command run.
- **Discovery probes.** In Phase 0, run the system's own jobs, backfills,
  and pipelines on the build surface. Name the deployment and the
  org/tenant in every scoped query. When a CLI probe and the driven UI
  disagree, the UI gate wins; suspect the probe's identifiers first.
- **Name the check first.** Before you build, state how "done" will be
  proven: code → a test; math → an independent numeric check; finance → a
  recompute from sources; prose → a rubric. If you cannot name a check, the
  task is not specified yet. Go back to shaping.

## Model routing — the command tree

Tiers are roles, not versions; the aliases resolve to the newest model.
Never hardcode a version. Pin `model` on every Agent/Workflow fan-out.

| Tier | Model (`model` param) | Use for |
| ---- | --------------------- | ------- |
| Command | the main session | Orchestration, architecture, gate verdicts, final synthesis. Sole decision authority; never a worker |
| Senior specialist | `opus` subagent | Adversarial + security review, hard debugging kernels, prose that ships |
| Workhorse | newest GPT via Codex CLI (`codex-delegate`) | Implementation from tight specs, data analysis, second opinions |
| Menial agent | `sonnet` | Search fan-outs, browser driving, screenshot loops, mechanical sweeps |
| Deterministic runner | `haiku` | One verifiable right answer; output always machine-checked |

**Effort:** build at the session default; verify and review at high. Raise
effort before you move to a bigger model. Keep the session model fixed;
hand work to a subagent. Read
`references/routing.md` before you dispatch, pick effort, consult Codex,
budget context, or rely on another session.

**Escalation spine — load-bearing decisions pass through the main session.**
Work flows down; decisions flow up. Only the command tier disposes of: gate
definitions, ship/no-ship, architecture and schema choices, critical-finding
adjudication, scope changes and rule exceptions, and anything irreversible
or outward-facing. Lower tiers decide freely inside their lane. A
Codex-vs-Claude disagreement escalates automatically.

## Stage 4 — Execute (one machine: engine + govern + delegate compose)

- Invoke `engine` (the repo's project-scoped version if it has one). Design
  a gate that proves the work done, prove the gate can fail, then build and
  self-verify until green. A user-facing gate must include a Playwright leg.
- Inside engine phases, `codex-delegate` is the default builder: engine
  writes the tight spec, Codex types, engine verifies. In-session
  implementation needs a stated reason.
- Multi-lane phase (repo has `govern`/`liaison`) → `govern` opens above the
  engines as policy and sequencing authority; each lane's `liaison` clerks
  the mechanics. Liaison never merges (P-8).
- Anchor red-green on fast fixtures; a slow repair gets its own check off
  the critical path.

## Stage 5 — Prove (the quality tripod; all three legs, every feature)

1. `user-walkthrough` — walk every touched workflow like a real user, then
   the edge-case battery. Two surfaces, roles never confused. Local dev is
   the build surface: mutate freely, use test auth. Deployed production is
   the observe surface: read-only, Wil's own signed-in browser, no test
   data, confirm bug-before and fix-after only. In csa-new: build on
   `localhost:3000`; `https://tdg-csa.vercel.app` is production. The ledger
   records each proof's surface. Judge every pass/fail by `user-walkthrough`
   §2.5's four-part assertion contract; a weaker assertion is UNVERIFIED.
2. Adversarial review — `engine-review` (`opus` refute panel, optional
   Codex second opinion; or `code-review`, or the repo's own review skill); adjudicate with
   `verifying-review-findings` where available. **The security lens is
   mandatory** (authz/authn, injection, data exposure): `/security-review`
   or an `opus` pass, plus `convex:convex-authz` for Convex (always in
   csa-new). Skip it only for a zero-attack-surface change, and say so.
   Critical findings escalate to the command tier.
3. `simplify` on the changed code once it works and survives review. If the
   leg-2 panel ran a hunt-list simplicity lens and its accepted findings
   were applied, that satisfies this leg; record the substitution.

## Stage 6 — Seal and close

- `superpowers:verification-before-completion` — evidence before any
  "done". The verification Stop hook enforces this; feed it.
- Pathspec commit(s), plain push, open the PR with: confirmed-vs-stale
  findings, gate results with evidence, surface provenance, recordings.
- Retro: promote any trap that bit twice into Gotchas, the playbook, or
  CLAUDE.md. Update the ledger's outcome. Remove the worktree.

## Scale to fit

Small tasks run the same stages thinner: recall, a branch, a ledger stub, a
gate, one walkthrough pass, verification. Log any skipped stage and why.

## Gotchas

- The 2026-07-29 search run found its poison-pill defect only by running
  the backfill; no code read found it. → Run the machinery in Phase 0.
- macOS has no `timeout`; a command-not-found reads as "no results". →
  Confirm the probe executed before you trust empty output.
- An unpinned subagent silently inherits the session model. → Pin `model`.
- "Surgical" in-session fixes compound; the 2026-07-29 run burned most of
  its window this way. → Past ~5 edits, cut a codex-delegate slice.
- A gate check behind a 2-hour corpus walk stalls red-green. → Seed one
  fixture the live path indexes in seconds.
- Handoff claims age in minutes; an archived or stopped session's "I'm
  monitoring X hourly" is dead. → Check `list_sessions` first.
- The agent cannot invoke /compact itself. → Suggest it at phase
  boundaries; autonomous runs trust auto-summarization plus the ledger.
