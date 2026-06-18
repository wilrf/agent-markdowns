# Engine template — one entrypoint, the full pipeline under one /goal

The **engine** composes the four modes into a single autonomous driver: one entrypoint
takes a task from fuzzy intent to a verified, committed slice, checking its own work
against an explicit done-condition before handing back. Reach for it when you want to say
*"run the engine on this"* and walk away until it's done. Bindings in `<angle brackets>`
are per-repo; the STAGES, GATES, and disciplines are not optional.

This template is **self-sufficient for long runs** — it carries the gate-design, verify-
panel, fan-out, context-budgeting and retro discipline inline, so the prompt that invokes
it stays lean. Deeper philosophy + field notes: the `agent-loops` plugin's playbook
(`agent-loops-playbook.md`). Build stations: `goal-template.md` (also in the `agent-loops` plugin).

**Status: design-stage pattern, pending field-proof.** Prove the gate can FAIL (planted-bug
self-test) before trusting the engine. Build it foundation-first: design `<verify>` → prove
it exits non-zero on a broken build → write the driver → prove it on one small task + a
planted regression → only then trust it for large work.

## Core idea — you design the gate

The engine has **no fixed gate.** For each task *you* design the checks that prove "done"
and that can **fail**, then run until they're green.

- A gate that can't fail is worthless — confirm any gate you design **rejects a wrong
  answer** (a planted error trips it). If it can't fail, it isn't a gate.
- The risk in a self-verifying engine isn't bugs (the gate catches those) — it's a
  confidently-verified **wrong target**. The human approves the *target*; hitting it is
  yours. Garbage-in is the failure mode, not bugs.

## The autonomy contract

On Gate-1 approval, set `/goal <approved DONE>` and run to green **without soft stops.**
The ONLY interruptions:

- **GATE 1 (target)** — up front, before any build.
- **GATE 2 (done)** — green + committed focused slice; the human decides
  push / PR / merge / deploy. The engine never crosses the release boundary on its own.
- **HARD BLOCKER** — auth, fixed ports taken, prod-env / force-push / blocked push flags.
  Try every legitimate path first, then surface loudly. Never fake a green, never bypass
  the auth gate, never edit ports/env.
- **SAFETY CAP** — a runaway loop surfaces *with* ledger state; never a silent give-up.

Fix at **root cause**: never lint-disable, never `any`. Invoking the engine IS the standing
`Workflow` opt-in — **announce** heavy fan-out (what's parallelized, rough scale) before it
runs; honor a budget directive. Pre-authorized is not invisible.

**Blocked-boundary rule (anti-stuck):** a phase whose gate depends on UNMERGED external work
is "complete" once the unblockable part is done and the blocker is written to the ledger.
Close at the achievable frontier; move on. Never spin on a gate you can't legitimately pass.

## The pipeline — 4 stages, 2 gates

**STAGE 0 — UNDERSTAND & DESIGN THE GATE**
- Read intent, scope, route mode(s). **CLASSIFY**: deterministic (a machine check can judge
  it) vs non-deterministic (UI/UX / taste — no clean pass/fail).
- Scale to size: quick confirm for small; full brainstorm for large.
- Write a machine-checkable **DONE block** (acceptance as exit codes / checked artifacts).
- **DESIGN THE GATE** that proves it (see "Designing the gate").
- **╞═ GATE 1:** present the DONE block + the gate; get the human's yes on the TARGET. ═╡
- On approval: `/goal <DONE>`, create the ledger.

**STAGE 1 — PLAN** — propose the approach; self-verify it: **grounding** (does each step
touch files/APIs that actually exist?) + **premortem** (how could this be wrong?). Every
phase names the gate it closes against. Write the plan to disk.

**STAGE 2 — BUILD** — drive `goal-template.md`. Fewest readable lines (delete don't golf;
reuse don't reinvent). **Where the gate needs a test that doesn't exist, write the failing
test FIRST** (TDD), then make it pass. Fan out builders for large work. Update the ledger
**before** each commit.

**STAGE 3 — VERIFY** — run the gate you designed; **loop until green**; re-run the real user
journey after **every** fix (not "the last error is gone" — layered failures hide behind
each other). Run the adversarial panel (see "The verify panel").

**STAGE 4 — RETRO + COMMIT** — promote ledger traps (see "Retro"); ONE **pathspec** commit
of the focused slice (never bundle others' dirty files).
- **╞═ GATE 2:** stop. Green + committed, waiting on the human's go. ═╡

## Designing the gate (the heart of the engine)

Assemble a gate from the pieces that fit the task; each must be able to fail; together they
cover the DONE block.

**Code correctness — your repo's real checks** (compose only what the task touches):
`<typecheck>` · `<lint --max-warnings 0>` · `<unit tests>`. Watch for **environment-specific
suites that fail for non-code reasons** (platform paths, missing services) — exclude them
from the gate (they're not your code) and note it. Watch for **test suites your main runner
skips** (a separate framework/config) — run them **explicitly** or the gate is blind to
them. **Do not put a prod build that needs prod env in the local gate** — it's a CI concern
*past* Gate 2.

**New behavior with no check** → write the failing test first, watch it fail, then pass it.
**User-journey changes** → an authenticated `<browser smoke>` against the running app. The
smoke is **load-bearing**: unit tests that mock a library away are structurally blind to that
library's integration bugs.

**Prove the gate can fail** before trusting it (a planted error trips it). A gate you haven't
seen say "no" isn't yet a gate.

## Deterministic vs non-deterministic work

- **Deterministic** (logic, data, types): the gate above judges pass/fail outright.
- **Non-deterministic** (UI/UX, layout, copy, taste): no clean pass/fail — escalate:
  - **Mandatory** browser visual pass, from a **live screenshot of the real surface** (polish
    the real thing; don't rebuild it).
  - **+ design-conformance check** against `<design-authority doc>`.
  - **More looks**: iterate visual + coding passes until *your own* judgment says it looks
    good, then continue. No human pause. Taste isn't fully machine-checkable — conformance +
    visual passes shrink the residue; they don't erase it.

## The adversarial verify panel

Run **read-only verifier subagents prompted to *break* the work**, not bless it; default each
toward "refuted/failing unless proven otherwise."

- **Lens-specialize, don't replicate** — three identical reviewers find the same bug thrice.
  One lens per failure *class*: `correctness` · one **domain-invariant** lens (the one that
  pays — `<security / visibility / money / parity>`, whatever your domain must never violate)
  · `simplicity`.
- **Give simplicity a hunt list** or it returns style nits: existing-helper reuse before new
  code; abstractions not earning their keep; dead code left by replacements; smallest readable
  diff. Expect this lens's highest false-positive rate — adjudicate hardest here.
- **Adjudicate findings; don't obey them** — verifiers don't know your lint config/history;
  ~1 in 3 minor findings collide with reality. Check each against the real gate; log every
  rejection + rationale to the ledger's **"do-NOT-re-raise"** list and paste it into the next
  panel prompt.
- **Pin the verifier model** on orchestrated/`Workflow` agents — a panel that silently errors
  is indistinguishable from one that found nothing.

## Fan-out & workflows

Reserve fan-out for genuinely large work (many files, audits, migrations); for a small task a
dynamic `Workflow` is just an expensive single agent. When you do fan out:

- **`pipeline()` by default** — items flow through stages with no barrier; only use a barrier
  (`parallel()`) when a stage genuinely needs ALL prior results at once (dedup, early-exit on
  zero, cross-item comparison).
- **Adversarially verify in the pipeline** — each finding refuted by N skeptics; kill on
  majority-refute.
- **Loop-until-dry** for unknown-size discovery — keep finding until K rounds return nothing
  new; dedup against ALL seen, not just the confirmed.
- **Small payloads** — subagents/workflows write detail to a file and return counts + the
  path, not multi-KB blobs into the main loop.
- **Review the delegate's diff** — self-gating catches most issues, but spot-check the largest
  per-file diff.

## Context budgeting — the run outlives its window

A multi-phase run will exceed one context window; the main loop auto-compacts (lossy, not
free). Engineer for it:

- **Ledger-first** — the ledger (below) is the source of truth; the conversation is scratch.
  If state isn't in the ledger, it doesn't exist.
- **`/compact` at phase boundaries only** — right after commit + ledger update (zero in-flight
  state). Never mid-edit.
- **Session-per-phase ratchet (multi-day scale)** — run each phase as a fresh session or
  headless `claude -p` whose contract is: read ledger → do the next unchecked phase → run gates
  → commit → update ledger. `/goal` works in `-p`, so each phase can carry its own completion
  condition.
- **Fan out builders, not just verifiers** — inline building is the biggest context burner;
  for large phases delegate the writes too.

## Nesting

The engine's `/goal` is the outermost ring; phases nest under it, verify rounds under phases,
per-finding refute loops under those. Three rules: every level has its own done-condition;
inner iterations are cheaper than outer; a stuck inner loop **fails UP** with its ledger state
(never improvises a different approach — that's the parent's call). Subagents can't type
`/goal`; give them a goal by writing the DONE + stations into their prompt — the parent's goal
evaluator waits for them before judging "met?".

## Anomaly triggers — noticing (stop-and-log to the ledger the instant one fires)

behavior matching no code in the tree · tests green but the feature visibly dead/blank · a
failure that disappears without your fix explaining why · logs referencing files/models you
didn't touch · silent success · a gate that goes green on empty arrays. **Every mocked
boundary** must name the station that exercises the real thing; one with none is a
ledger-recorded gap. At phase end, sketch the verification matrix (paths × real-vs-mocked ×
envs) and list the unexercised cells.

## The ledger (`<task>-progress.md`, created at Gate 1)

Source of truth; updated **before every commit**; survives compaction. Sections:
- **Goal / DONE block** (the approved target) and **the designed gate**
- **Phase status** (per phase: todo / done / blocked-with-reason)
- **Decisions made** · **Findings REJECTED with rationale** (the "do-NOT-re-raise" list)
- **Anomalies** (expected X, observed Y) · **environment facts** · **unexercised cells**

## Retro — feed lessons back (before declaring DONE)

Near-miss pass: what was caught by exactly *one* station, by design or luck? Strengthen
single-sensor catches. Promote any trap that **bit twice / cost a phase / would bite a fresh
session** into the playbook as part of the final commit; session-specific noise dies with the
task. Promotion to the *species* (a shared/public playbook) wants the stronger bar —
**independent convergence** in a second repo with a different stack.

## Hard rules (never route around — adapt to your repo)

`<fixed dev ports>` (taken → STOP and report) · plain `git push` only (no `--force` /
`--no-verify` / `--mirror` / `--delete` / `+refspec`) · never touch prod env / prod deploys ·
no lint-disable, no `any` — fix the underlying issue.

---

## Copy-paste skeleton

```
ENGINE: <WHAT to build/do, per WHICH spec>.
TARGET/DONE: <machine-checkable acceptance — exit codes / checked artifacts; reachable,
  blocked-boundary semantics>.
GATE: <the checks that prove DONE and can FAIL — design per "Designing the gate"; prove it
  can fail before trusting it>.
LENS: <the domain-invariant verify lens for this work>.
Then run STAGE 0→4 / GATE 1→2 above. Ledger at <task>-progress.md, updated before every
commit. /compact at phase boundaries. Honor the HARD RULES.
```
