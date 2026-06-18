---
name: engine
description: The autonomous build engine. Use when the user says "use the engine for this", "run the engine on …", "/engine", or asks for an autonomous / long-horizon build that should design its own checks and verify its own work before handing back. Also fires for designing or running ANY autonomous loop — "set up a loop", "run this overnight", "let it iterate until…", "fan out agents", "create a workflow to…", a maker/checker pair, worktree parallelism, or any task whose done-condition you intend to express as a machine-checkable condition. Given any task, you understand the intent, DESIGN A GATE that can prove it done (and can fail), get the human's sign-off on the target, then build and self-verify against that gate until green — stopping at a committed slice. Carries the full loop discipline inline (gate design, verify panel, fan-out, context budgeting, retro) so it is self-sufficient for multi-day runs; for the broader loop-design space (review / plan / infra modes, field notes, copy-paste station templates) it routes to its bundled playbook + templates.
user-invocable: true
---

# The Engine

One entrypoint for autonomous, self-verifying builds. Given any task you: understand
the intent → **design a gate that can prove it done and can fail** → get the human's
yes on the target → build and self-verify against that gate until green → hand back a
committed slice. This skill is **self-sufficient for long autonomous runs** — it carries
the gate-design, verify-panel, fan-out, context-budgeting and retro discipline inline.

**Deeper reference (bundled).** The build pipeline below is the fast path. For the broader
loop-design space — the four modes (build / **review** / **plan** / **infra**), field notes
from real runs, the build order, and copy-paste station skeletons — route to:
- [`references/agent-loops-playbook.md`](references/agent-loops-playbook.md) — the accumulated
  judgment (read it before designing a non-build loop, or any unusually large run).
- [`templates/`](templates/) — copy-paste skeletons: `goal-template.md` (build stations) ·
  `engine-template.md` (this engine, parameterized) · `review-template.md` · `planning-template.md`
  · `infra-template.md`.

**Quick gut-check before you loop:** (1) is there a command that can actually **fail**? no gate =
no loop. (2) is "done" an exit code / checked artifact, not a vibe? (3) dynamic `Workflow` → did
the user explicitly opt in? (4) is the iteration count **capped**? (5) does it respect the repo's
HARD RULES (ports, push flags, prod env)? (6) will it outlive a context window → ledger on disk,
`/compact` at phase boundaries. (7) does the goal include the **retro** before declaring done?

**Bind to the active project first.** The engine is project-agnostic; its gate is not.
Before designing anything, read the active repo's contract — `CLAUDE.md` / `AGENTS.md`,
`package.json` scripts (or `Makefile` / `pyproject.toml` / `justfile`), and any
`.claude/docs` loop or goals doc the project keeps. Those define this run's real checks,
hard rules, and (if present) deeper field notes. Where the project documents an aggregate
"done" gate or a goal template, prefer it over anything you'd invent.

## Core idea — you design the gate

The engine has **no fixed gate.** For each task *you* design the checks that prove
"done" and that can **fail**, then run until they're green.

- A gate that can't fail is worthless — the first thing you confirm about any gate you
  design is that it **rejects a wrong answer** (a planted error trips it). If it can't
  fail, it isn't a gate.
- The risk in a self-verifying engine isn't bugs (the gate catches those) — it's a
  confidently-verified **wrong target**. The human approves the *target*; hitting it is
  yours. Garbage-in is the failure mode, not bugs.
- **Scaffolding is temporary — the harness is not precious.** Every check, panel, station,
  and subagent here is scaffolding that corrects for *today's* model's errors; as models
  improve they outgrow it (Claude Code's own team deletes large chunks of its prompt/tooling
  with each model release, and treats subagents as "scaffolding for models of today"). The
  *gate* is permanent — proof of done; the *apparatus around it* is disposable. Reach for the
  lightest harness that still holds the gate, and when a scaffold no longer changes the
  outcome, rip it out rather than carry it. Don't get attached to a verify panel or a fan-out
  that the current model no longer needs.

## The autonomy contract

On Gate-1 approval, set `/goal <approved DONE>` and run to green **without soft stops.**
The ONLY interruptions:

- **GATE 1 (target)** — up front, before any build.
- **GATE 2 (done)** — green + committed focused slice; the human decides
  push / PR / merge / deploy.
- **HARD BLOCKER** — a check that can't legitimately pass (auth/preflight fail, a fixed
  port already taken, a prod-env / force-push / project-forbidden operation). Try every
  legitimate path first, then surface loudly. Never fake a green, never bypass an auth
  gate, never edit ports/env/secrets to dodge it.
- **SAFETY CAP** — a runaway loop surfaces *with* ledger state; never a silent give-up.

**Decide vs. surface — the autonomy boundary.** Between the gates you *own every reversible
call*: implementation details, naming, which helper, local refactors — decide it, log it,
keep moving; asking would just be noise. **Surface** a fork only when it (a) changes the
approved target / DONE, (b) is hard to reverse — a data migration, a public API or contract,
an added dependency, anything destructive or outward-facing — or (c) trades a value the human
owns (security / privacy posture, cost, product behavior) with no obviously-right answer.
When you must surface mid-run, bring a recommendation + the alternatives, not an open
question. Auto-deciding an (a)/(b)/(c) fork to "keep the run going" is the failure mode, not
the speed-up.

Fix at **root cause**: never suppress a check (no lint-disable, no type-escape hatch like
`any`/`# type: ignore`) to make it pass. Invoking the engine IS the standing `Workflow`
opt-in — **announce** heavy fan-out (what's parallelized, rough scale) before it runs;
honor a `+Nk` budget directive. Pre-authorized is not invisible.

**Blocked-boundary rule (anti-stuck):** a phase whose gate depends on UNMERGED external
work is "complete" once the unblockable part is done and the blocker is written to the
ledger. Close at the achievable frontier; move to the next phase. Never spin on a gate
you can't legitimately pass, never fake one.

## The pipeline — 4 stages, 2 gates

**STAGE 0 — UNDERSTAND & DESIGN THE GATE**
- Read intent, scope, route mode(s). **CLASSIFY**: deterministic (a machine check can
  judge it) vs non-deterministic (UI/UX / taste — no clean pass/fail).
- Scale to size: quick confirm for small; full `superpowers:brainstorming` for large.
- Write a machine-checkable **DONE block** (acceptance as exit codes / checked artifacts).
- **DESIGN THE GATE** that proves it (see "Designing the gate").
- **╞═ GATE 1:** present the DONE block + the gate; get the human's yes on the TARGET. ═╡
- On approval: `/goal <DONE>`, create the ledger.

**STAGE 1 — PLAN** — planning is the **highest-ROI scaffold there is**: a written plan is
reportedly the difference between a medium task landing ~20–30% of the time and ~70–80% of
the time, for the cost of a few hundred tokens. So don't skip it on anything non-trivial.
For any non-trivial fork, **generate 2–3 candidate approaches and pick
one with a one-line reason** (the cheapest form of the judge-panel pattern) — the first
approach that comes to mind silently commits you to its constraints and is rarely the best.
Self-verify the chosen plan: **grounding** (does each step touch files/APIs that actually
exist? *verify* the load-bearing assumption, don't build on a guess) + **premortem** (how
could this be wrong?). Every phase names the gate it closes against. Log the alternatives +
why-rejected to the ledger (so a later phase doesn't relitigate or silently contradict),
then write the plan to disk.

**STAGE 2 — BUILD** — drive the project's goal/station template if it has one. Quality is
built at write-time, not bolted on in review:
- **Study before you write** — read the neighboring code first and match its conventions,
  naming, types, and error handling (and the repo's lint rules / `CLAUDE.md`). The best diff
  reads as if the file's own author wrote it.
- **Reuse before you add** — search for an existing helper / type / pattern and extend it
  before spawning a parallel one. A new abstraction needs a second caller or a real boundary
  to earn its keep; speculative "for later" generality is debt, not foresight.
- **Fewest readable lines** — delete don't golf; smallest diff that does the job; remove the
  code you replaced (no dead branches, no commented-out husks).
- **Test-first where the gate needs a check that doesn't exist** (TDD): write the failing
  test, watch it fail, then make it pass.
- Fan out builders for large work (see "Fan-out"). Update the ledger **before** each commit.

**STAGE 3 — VERIFY** — run the gate you designed; **loop until green**; re-run the real
user journey after **every** fix (not "the last error is gone" — layered failures hide
behind each other). Run the adversarial panel (see "The verify panel").

**STAGE 4 — RETRO + COMMIT** — promote ledger traps (see "Retro"); ONE **pathspec** commit
of the focused slice (never bundle others' dirty files).
- **╞═ GATE 2:** stop. Green + committed, waiting on the human's go. ═╡

## Designing the gate (the heart of the engine)

Assemble a gate from the pieces that fit the task; each must be able to fail; together
they cover the DONE block. **Use the active project's real checks — discover them, don't
assume them.**

**Code correctness — find this project's checks** (compose only what the task touches):
- Read `package.json` scripts / `Makefile` / `pyproject.toml` / `justfile` and the repo's
  `CLAUDE.md` / `AGENTS.md`. Identify the real commands for: **type-check**, **lint**
  (note if it's configured to fail on warnings — e.g. `--max-warnings 0` — and honor that),
  **unit tests**, and any **integration / component** suite run separately from unit tests.
- Many repos expose a single aggregate "done"/CI command (e.g. a `verify` script that
  chains type-check + lint + tests into one exit code). **Prefer it** when it exists — it
  is the project's own definition of the gate.
- Watch for **environment-specific exclusions** the project documents (a package that only
  tests green on one OS, a suite that needs a service running). Mirror the project's
  documented filter rather than fighting it.
- **Do NOT use a production build as a local gate** unless the project says to — a prod
  build typically validates prod env/secrets and fails locally for reasons unrelated to
  your change. Production build is a CI concern *past* Gate 2.

**New behavior with no check** → write the failing test first, watch it fail, then pass it.
**User-journey changes** → run the project's end-to-end / smoke path (e.g. an auth
preflight then a smoke suite against the running app). If it needs auth or a live server
and that's unavailable, STOP and ask for the human's re-auth/setup protocol — never bypass
it. The smoke is **load-bearing**: unit tests that mock a dependency away are structurally
blind to that dependency's integration bugs.

**Prove the gate can fail** before trusting it (a planted type error trips the type-check;
a planted visual break is caught by the visual pass). A gate you haven't seen say "no"
isn't yet a gate.

## Deterministic vs non-deterministic work

- **Deterministic** (logic, data, types): the gate above judges pass/fail outright.
- **Non-deterministic** (UI/UX, layout, copy, taste): no clean pass/fail — escalate:
  - **Mandatory** visual pass via browser automation, from a **live screenshot of the
    real page** (polish the real surface; don't rebuild it).
  - **+ design-conformance check** against the project's design/UX guidelines if it has
    any (look under `.claude/docs/design`, a design-system doc, or `CLAUDE.md`).
  - **More looks**: iterate browser + coding passes until *your own* judgment says it
    looks good, then continue. No human pause. Taste isn't fully machine-checkable —
    conformance + visual passes shrink the residue; they don't erase it.
  - **Spend to a bug budget, not to zero.** No surface is defect-free; the bar is that it
    *feels* reliable and fast, not that it's perfect. Once the gate is green and the surface
    looks right, stop — don't burn passes chasing the last cosmetic residue. Perfectionism on
    the non-deterministic tail is its own failure mode.

## The adversarial verify panel

Run **read-only verifier subagents prompted to *break* the work**, not bless it; default
each toward "refuted/failing unless proven otherwise."

- **Lens-specialize, don't replicate** — three identical reviewers find the same bug
  thrice. One lens per failure *class*: `correctness` · one **domain-invariant** lens (the
  one that pays — pick the task's invariant: a data-isolation / visibility boundary,
  money/parity, auth/security, as fits the domain) · `simplicity`.
- **Give simplicity a hunt list** or it returns style nits: existing-helper reuse before
  new code; abstractions not earning their keep; dead code left by replacements; smallest
  readable diff (STAGE 2 should have applied these at write-time — the lens is the backstop,
  not the primary gate). Expect this lens's highest false-positive rate — adjudicate hardest here.
- **Adjudicate findings; don't obey them** — verifiers don't know the lint config/history;
  ~1 in 3 minor findings collide with reality. Check each proposed change against the real
  gate; log every rejection + rationale to the ledger's **"do-NOT-re-raise"** list and
  paste that list into the next panel prompt.
- **Pin the verifier model** on orchestrated/`Workflow` agents — a panel that silently
  errors is indistinguishable from one that found nothing.

## Fan-out & workflows

Reserve fan-out for genuinely large work (many files, audits, migrations); for a small
task a dynamic `Workflow` is just an expensive single agent. When you do fan out:

- **`pipeline()` by default** — items flow through stages with no barrier; only use a
  barrier (`parallel()`) when a stage genuinely needs ALL prior results at once (dedup,
  early-exit on zero, cross-item comparison).
- **Adversarially verify in the pipeline** — each finding refuted by N skeptics; kill on
  majority-refute.
- **Loop-until-dry** for unknown-size discovery — keep finding until K rounds return
  nothing new; dedup against ALL seen, not just the confirmed.
- **Small payloads** — subagents/workflows write detail to a file and return counts + the
  path, not multi-KB blobs into the main loop.
- **Review the delegate's diff** — self-gating catches most issues, but spot-check the
  largest per-file diff.

## Context budgeting — the run outlives its window

A multi-phase run will exceed one context window; the main loop auto-compacts (lossy, not
free). Engineer for it:

- **Ledger-first** — the ledger (below) is the source of truth; the conversation is
  scratch. If state isn't in the ledger, it doesn't exist.
- **`/compact` at phase boundaries only** — right after commit + ledger update (zero
  in-flight state). Never mid-edit.
- **Session-per-phase ratchet (multi-day scale)** — run each phase as a fresh session or
  headless `claude -p` whose contract is: read ledger → do the next unchecked phase → run
  gates → commit → update ledger. `/goal` works in `-p`, so each phase can carry its own
  completion condition.
- **Fan out builders, not just verifiers** — inline building is the biggest context burner
  (every Read/Edit lands in the main window); for large phases delegate the writes too.

## Nesting

The engine's `/goal` is the outermost ring; phases nest under it, verify rounds under
phases, per-finding refute loops under those. Three rules: every level has its own
done-condition; inner iterations are cheaper than outer; a stuck inner loop **fails UP**
with its ledger state (never improvises a different approach — that's the parent's call).
Subagents can't type `/goal`; give them a goal by writing the DONE + stations into their
prompt — the parent's goal evaluator waits for them before judging "met?".

## Anomaly triggers — noticing (stop-and-log to the ledger the instant one fires)

behavior matching no code in the tree · tests green but the feature visibly dead/blank · a
failure that disappears without your fix explaining why · logs referencing files/models you
didn't touch · silent success (an op with no side effects it should have had) · a gate that
goes green on empty arrays. **Every mocked boundary** must name the station that exercises
the real thing; one with none is a ledger-recorded gap, not a shrug. At phase end, sketch
the verification matrix (paths × real-vs-mocked × envs) and list the unexercised cells.

## The ledger (`<plans-dir>/<task>-progress.md`, created at Gate 1)

Source of truth; updated **before every commit**; survives compaction. Put it where the
project keeps plans (e.g. `.claude/plans/`) or alongside the work. Sections:
- **Goal / DONE block** (the approved target) and **the designed gate**
- **Phase status** (per phase: todo / done / blocked-with-reason)
- **Decisions made** (with the alternatives rejected and why) · **Findings REJECTED with rationale** (the "do-NOT-re-raise" list)
- **Anomalies** (expected X, observed Y) · **environment facts** · **unexercised cells**

## Retro — feed lessons back (before declaring DONE)

Near-miss pass: what was caught by exactly *one* station, by design or luck? Strengthen
single-sensor catches. Promote any trap that **bit twice / cost a phase / would bite a
fresh session** into the project's loop/lessons doc (or `CLAUDE.md` if it has none) as part
of the final commit; session-specific noise dies with the task. (Promotion to a *cross-repo*
home wants the stronger bar — independent convergence in a second repo with a different
stack.)

## Hard rules (never route around — defer to the active repo's CLAUDE.md / AGENTS.md)

The project's own hard rules win; read them and obey them. Universally:
- **Fixed infra is fixed** — a port/service the project pins is taken → STOP and report;
  never silently move it.
- **Push policy** — plain `git push` only; never `--force` / `--no-verify` / `--mirror` /
  `--delete` / `+refspec`, and never the project's break-glass env flags, unless the human
  explicitly authorizes it for this run.
- **Never touch prod env/secrets** to make a local gate pass.
- **Root-cause only** — no check-suppression (lint-disable, type-escape hatch); fix the
  underlying issue.
