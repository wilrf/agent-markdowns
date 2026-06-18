# Engineering Agent Loops & Goals — the playbook

Load this when: you are about to design or run anything that iterates without a
human in the inner loop — a `/loop`, a dynamic Workflow fan-out, an overnight
headless `claude -p` run, a maker/checker pair, or any task whose acceptance
criteria you intend to express as a machine-checkable "done" condition.

This playbook is **self-improving by design**: the field notes in it were
earned on real autonomous runs, and the retro station (below) is the mechanism
that keeps adding to them. Fork it, then let your own runs feed it.

---

## The general loop — this was never a coding playbook

The loop is an epistemic engine: produce an artifact -> verify it against
something that can actually FAIL -> adversarially attack it -> simplify it ->
iterate to a machine-checkable done. Code was just the first artifact. Per
domain, only four bindings change: the artifact, what "a gate that can fail"
means, the domain-invariant lens, and what "simplify" means.

| Mode | Artifact | Gate that can fail | Simplify means | Template |
| ---- | -------- | ------------------ | -------------- | -------- |
| Build | code | tests/types/lint/smoke | fewest readable lines | `goal-template.md` |
| Review | findings | refute-panels + repros | kill false positives | `review-template.md` |
| Plan | spec/plan | grounding checks + premortem panel + every phase names a gate | scope: fewest phases | `planning-template.md` |
| Infra | system state | dry-run diff, parity harness, canary, REHEARSED rollback | smallest blast radius | `infra-template.md` |

**Nesting doctrine.** Loops nest: goal -> phase loops -> verify rounds ->
per-finding refute loops. Three rules keep nesting from becoming thrash:
1. **Every level has its own done-condition.** An inner loop without one
   inherits its parent's and never terminates locally.
2. **Inner iterations must be cheaper than outer ones** (the tiered-gate
   pattern, generalized). If an inner loop costs more per cycle than its
   parent, the nesting is inside out.
3. **A stuck inner loop fails UP, never sideways.** Hit the iteration cap ->
   report to the parent level (or the human) with the ledger state. It does
   not improvise a different approach mid-loop; changing approach is the
   parent's decision.

The modes compose end-to-end: a planning-mode goal emits the spec a
build-mode goal consumes; review mode audits what build mode shipped; infra
mode carries it to production. Each handoff artifact (plan, code, findings,
state) was adversarially verified before crossing the boundary.

---

## The one rule everything else serves

**When the agent makes a mistake, change the harness so it can't make that
mistake again.** A loop is just that rule applied repeatedly: the agent acts,
something *real* tells it it's wrong, it fixes, repeat. The agents are cheap and
disposable. The harness around them — the verification gate, the isolation, the
guardrails — is the asset. Build the gate first; the loop is easy once something
can tell it it's wrong.

**Agent count is the last dial you turn, not the first.** For a solo operator,
the right configuration is 1–3 well-instrumented loops, not a swarm. Your review
bandwidth — not compute — is the bottleneck.

**`/goal` is the spine, not the main tool.** Long-horizon work needs one *control*
primitive that keeps the agent working across turns until a condition holds —
that's `/goal` (a real built-in command; see the buzzwords section), and it's the
outermost ring everything else nests inside. But it does no work itself; it only
refuses to let the agent stop. The **gate** is still the heart (the thing that can
*fail*); Workflows, subagents, and worktrees are still the **muscle** (they build
and check). The order of dependence is **gate → goal → work primitives**: a
`/goal` pointed at a vibe instead of a machine-checkable condition is strictly
*worse* than no automation — an agent that can't stop and can't tell whether it's
done. Elevate `/goal` to the driver; never to the asset.

---

## When to use a loop vs. just doing the work

| Situation | Use |
| --------- | --- |
| One bounded change you'll review yourself | Plain edit, no loop |
| A change with a clear pass/fail gate, you want it green before you look | **Closed loop** — `/goal "<gate> exits 0"` (native), or headless + verify |
| 2–3 independent features at once | **Worktrees**, one agent each |
| A judgement tests can't make (API shape, naming, "did it actually solve it") | **Maker/checker** — reviewer subagent with its own context |
| Hundreds of files / whole-service audit / migration | **Dynamic Workflow** (`Workflow` tool) — but only with explicit user opt-in |
| Touching production data or an irreversible system | **Parity/guardrail harness FIRST**, then loop against parity |

If a task is small, a dynamic workflow is just an expensive single agent.
Reserve fan-out for genuinely large work.

### The full stack under one goal (how the primitives nest)

The table above reads like a menu — pick one. For real long-horizon work they
**stack**, and `/goal` is the outermost ring holding the whole thing together:

```
/goal Build <feature> per <spec> at the fewest readable lines.
DONE = verify exits 0 AND the live smoke matches the mock.        ← spine: won't stop until true
└─ per phase (spec order), the four-station loop runs to a phase gate:
   ├─ BUILD  → a Workflow fans out one builder subagent per unit,  ← muscle: parallel writers
   │           each in its own worktree (isolation:"worktree")
   ├─ VERIFY → the same Workflow runs a 3-lens adversarial panel   ← maker/checker, own context
   │           (correctness · domain-invariant · simplicity)
   ├─ GATE   → fast tier (types, lint, unit) every iteration;      ← heart: the thing that can FAIL
   │           full suite + build + smoke at the phase boundary
   ├─ SMOKE  → real user journey on the real dependency (mocks don't count)
   └─ COMMIT (pathspec) + LEDGER update, then /compact at the boundary
   ... repeat per phase ...
RETRO before DONE flips: promote ledger traps into this playbook.
```

Read top to bottom: `/goal` is the only thing holding Stop shut; everything
indented under it is the work. Strip the goal and you have a loop that quits the
moment the agent *thinks* it's done. Strip the gate and the goal never legitimately
closes. You need both — plus the muscle in the middle to actually move.

---

## The four-station loop (station 3 is the one people skip)

1. **Plan** — read the spec + context, propose an approach.
2. **Act** — edit code, run commands.
3. **Verify** — run something *real that can fail*: build, types, tests, lint, a
   browser check. **Not self-review.** A maker/checker reviewer is verification;
   "I reviewed my own work" is not.
4. **Fix** — read the failure, fix, loop back to Act. Stop when verification is
   green **or** a max-iteration cap is hit.

> If a loop has no station 3 that can actually fail, you don't have a loop. You
> have vibe coding with extra steps. **No test = no loop.**

Maker/checker separation matters: the agent that *wrote* the code should not be
the only one that *judges* it. In Claude Code that's a separate subagent (or a
Workflow verifier stage) with its own context, ideally adversarial — prompted to
*break* the work, not bless it. Default the verifier toward "refuted/failing
unless proven otherwise."

### The adversarial verify panel (field-tested)

> **Field note (June 2026, a 7-phase search/RAG build):** a 3-lens adversarial
> panel per phase found ≥1 real bug **every single phase**, including a CRITICAL
> (soft-deleted records re-indexable by a racing job) and a prompt-injection
> exfiltration path (model-supplied userId on an agent tool) that no compiler,
> lint, or test gate could have caught.

Run three read-only verifier agents per phase — `correctness`, one
**domain-invariant** lens (security/visibility/money/data-parity — whatever your
domain must never violate), and `simplicity`. Mechanics that make it work:

- **Lens-specialize, don't replicate.** Three identical reviewers find the same
  bug thrice. One lens per failure *class*; the domain-invariant lens is the one
  that pays for the panel.
- **Paste an "adjudicated decisions — do NOT re-raise" list into every verify
  prompt.** Verifiers re-flag previously-rejected findings forever otherwise.
  The ledger's rejected-findings section is that list's source.
- **Adjudicate findings; don't obey them.** Verifiers don't know your lint
  config or history. Expect a meaningful fraction of minor findings to be wrong
  (e.g. proposed "deletions" that would re-trip a duplicate-string lint rule or
  *add* lines). Check every proposed change against the actual gate before
  applying; record each rejection + rationale in the ledger.
- **Give the simplicity lens a hunt list, or it returns style nits.** Prime it
  with: existing-helper reuse before new code; abstractions not earning their
  keep (wrong altitude, single-call-site wrappers); dead code left behind by
  replacements; comments restating code; smallest readable diff. Pair it with
  the goal-line discipline — **fewest lines that stay readable: DELETE, never
  golf; reuse, don't reinvent** — so "simpler" means *less code*, not
  *different code*. And expect this lens to have the panel's highest
  false-positive rate (in the first field run ~1 in 3 of its minors collided
  with lint/config reality) — adjudicate hardest here.

  > **Field note:** in the first field run this lens only produced concrete
  > deletions because every panel prompt carried the hunt list by hand; a
  > second installed repo, reading the playbook cold, independently flagged
  > that the lens "has a seat but no teeth." The playbook now carries the
  > teeth so prompts don't have to.

- **Pin the verifier model explicitly** on orchestrated agents. A panel that
  silently errors out is indistinguishable from a panel that found nothing —
  one environment's workflow agents all died on a model/API incompatibility
  until the model was pinned per-call.

---

## The verification gate — build this first

A loop needs ONE green/red command as its done-condition. If your repo doesn't
have a `verify` composite, building it is the highest-value thing to do before
running any serious loop. Example (adapt to your stack):

```jsonc
// package.json — wire the gate so a loop has a single exit code
"verify": "pnpm check-types && pnpm lint:check && pnpm test && pnpm build"
```

The loop's done-condition then becomes: **`pnpm verify` exits 0.**

**Tier the gate: fast every iteration, full at phase boundaries.** Every repo
has gates too slow for the inner loop (a model-training test suite, an eval
harness, a full `next build`). Split them: the fast tier (types, lint on
touched files, unit tests) runs every Act→Verify cycle; the expensive tier
runs at phase boundaries, before each commit. A loop that runs the full gate
every iteration spends its budget waiting; a loop that never runs it ships
phase-level regressions. One sharp edge: use check-only forms in the gate
(`black --check`, lint without autofix) so verification never rewrites files
mid-loop.

> **Field note:** this pattern emerged independently in both repos that ran
> this playbook — an implicit touched-files-lint/full-suite-at-commit split in
> one, an explicit pytest-subset/eval-harness split in the other. When two
> organisms evolve the same organ, name it.

**Visual changes are not done until browser-verified.** Lint / typecheck / unit
/ DOM-only checks do NOT satisfy a layout, spacing, typography, color, or
hierarchy change. The gate for visual work includes an authenticated live
browser pass (Playwright or in-app screenshots). If auth or browser tooling is
blocked, record the blocker and ask for the narrow unblock — do not close the
task.

**Mocked-component tests are structurally blind to integration bugs.**

> **Field note:** a live-browser smoke caught a UI-library bug (cmdk silently
> re-filtering server-side search results — every semantic match would have
> been hidden) that 92 green unit tests could never catch, because the jest
> suite *mocked the component away*. If a test replaces the real library, the
> live pass is the only station that exercises it. Treat the smoke as
> load-bearing, not ceremonial.

**Layered failures: re-verify the user journey, not the absence of the last
error.**

> **Field note:** one outage stacked four causes (provider quota → a pricing
> throw in a usage handler → an error-saver that used the failing machinery →
> a 1-step tool-turn SDK default). Each fix revealed the next; three of four
> were invisible until the one in front was removed.

The gate for "fixed" is *the real user path completing end-to-end*, re-run after
**every** fix. Corollary: error-reporting paths must be strictly simpler than
the paths they report on, or your last line of defense fails first.

**Data migrations get data-shaped gates.** Verification is parity, not
code-shaped: row counts, checksums, query-replay diff between old and new.
Build the parity harness *before* any agent touches the system. The loop closes
against "parity check passes," **never** "the migration script ran without
error."

---

## Review mode — the same machinery pointed at existing code

The loop also runs with FINDINGS as the product (audit, security review,
pre-merge deep review). Same stations, three inversions: the gate verifies
*claims* (adversarial refute-panels + mandatory repros — "no repro = no
finding" is review's "no test = no loop"); "done" is *exhaustion*
(loop-until-dry + an honest coverage map and negative-space list), not a
checklist; and the work is all-checker, so the false-positive discipline
(dedup against all SEEN findings, adjudicate every claim) is the work
itself, not hygiene around it. See `../templates/review-template.md` for the
copy-paste skeleton. Small scopes don't need it — one maker/checker pass
beats the machinery; reserve it for audits where coverage accounting matters.

---

## "Done" must be verifiable, not vibes

`/goal <condition>` is a real built-in command in current Claude Code: it sets a
completion condition and Claude keeps working across turns until the condition is
met, blocking Stop until then (auto-clears on success; `/goal clear` aborts). It
runs in interactive, headless (`-p`), and Remote Control, and is enforced as a
Stop hook (so it needs hooks enabled — `disableAllHooks` / `allowManagedHooksOnly`
break it). The command is the easy half. The load-bearing half is the *condition*:
it only does real work if it's machine-checkable, because the evaluator deciding
"met?" needs something real to check — not a vibe.

| ❌ Vague | ✅ Verifiable |
| ------- | ------------ |
| "make the tasks page nicer" | "`pnpm verify` green AND Playwright smoke screenshot matches the mock" |
| "fix the search bug" | "the failing repro test passes AND no other test regresses" |
| "migrate the table" | "parity harness: row counts equal, checksums equal, 100-query replay diff is empty" |

Write the done-condition *before* the loop starts. If you can't state it as a
command that exits 0/non-zero (or a checked artifact), you're not ready to loop.

### How `/goal` composes with subagents

A `/goal` completion condition is **session-scoped to the session that set it**
(enforced as a Stop hook on that session). Three consequences before you fan out:

- **The parent holds the goal; subagents don't each carry one.** A subagent
  dispatched via the Agent tool or a Workflow `agent()` call runs in its own
  context and cannot type `/goal`. It doesn't need to: the parent's goal evaluator
  **waits for delegated subagents and background shells to finish before it judges
  "met?"** So the parent stays alive until the fan-out's output satisfies the
  condition — one goal governs the whole tree even though only the parent holds the
  hook.
- **Give a subagent its own goal by writing the contract into its prompt** — never
  via a slash command (the reliable channel to a child agent is always its prompt).
  Inject the DONE-condition + the stations it must run, straight from
  `goal-template.md`. This is the nesting doctrine made concrete: outer `/goal` →
  per-phase subgoals in subagent prompts, each with its own machine-checkable
  done-condition.
- **For real per-phase enforcement, use headless `-p` sessions, each with its own
  `/goal`.** Because `/goal` works in `-p`, the session-per-phase ratchet (see
  "Long loops") can run each phase as a `claude -p` session carrying its own
  completion condition — actual Stop-hook enforcement at every level of the nest,
  not just the top.

---

## What the buzzwords actually are in Claude Code

| Term | What it actually is | How to use it |
| ---- | ------------------- | ------------- |
| "Write loops not prompts" | **Headless mode**: `claude -p "…"` runs one non-interactive turn, can `--resume <session-id>`. Wrap in a shell loop or hand looping to a Workflow. | Script plan→act→verify→fix; re-invoke until the gate passes. |
| `/loop <interval>` | Recurring/self-paced runs (where available). Omit the interval to let the model self-pace. | Poll a deploy; iterate a fix to convergence. **One-offs don't need it.** |
| `/goal <condition>` | **Real built-in command.** Sets a completion condition; Claude works across turns until met, blocking Stop until then (auto-clears on success; `/goal clear` aborts). Interactive + `-p` + Remote Control; live overlay; needs hooks enabled. | Hand it the *machine-checkable* done-condition from the "Done" section; start from `goal-template.md`. The condition is the contract, not the command. |
| Worktrees | `Agent(isolation:"worktree")`, the `EnterWorktree` tool, or `claude --worktree`. Each agent gets an isolated checkout/branch. | 2–3 parallel features without clobbering. Expensive per-agent — use only when agents mutate files in parallel. |
| Dynamic workflows | The **`Workflow` tool** — Claude writes an orchestration script, fans out subagents, verifies, iterates. **Requires explicit user opt-in.** | Migrations, audits, stress-tests, dead-code sweeps. |
| Skills | `SKILL.md` + YAML frontmatter in `.claude/skills/` (project) or `~/.claude/skills/` (global). Auto- or `/`-invoked. | Encode a repeatable workflow once; stop re-pasting prompts. |
| CLAUDE.md | Always-on context, injected every turn. | Short, always-true rules ONLY. Situational knowledge goes in skills/docs (like this one). |
| Maker/checker | Subagents with their own context, or a Workflow verifier stage. | One agent builds, a *different* one adversarially reviews. |
| Hooks | Deterministic code on lifecycle events; exit code 2 blocks the action and feeds the reason back. | Hard guardrails (e.g. gating git push/commit). |

**`/goal` vs `/loop` — don't confuse them.** `/goal` is *condition-driven*: "keep
working until *this is true*," then stop. `/loop` is *schedule-driven*: "run *this*
every N minutes (or self-paced)," with no terminal condition. Reach for `/goal` to
**converge** (build to green, fix to passing); reach for `/loop` to **poll** (watch
a deploy, re-check PRs). They nest — a `/goal` run can use `/loop` inside it to wait
on an external thing — but a `/loop` should never own a build-to-done; that's the
goal's job.

---

## The unified engine — composing the modes under one driver

The four modes are usually run one at a time. The **engine** composes them into a
single autonomous driver: one entrypoint — *"run the engine on this"* — takes a
task from fuzzy intent through plan → build → verify to a green, committed slice,
under one `/goal`, with exactly two human gates. Skeleton:
`../templates/engine-template.md`.

The shape is a **thin driver skill** — not a mega-skill (which burns the main
context on long runs) and not a single `Workflow` script (which runs
start-to-finish and so can't pause for the up-front human gate). The driver runs
the intent stage in the main loop, stops at Gate 1, then sets `/goal <DONE>` and
delegates the heavy work to subagents and `Workflow` fan-out.

Two ideas earn the pattern its keep:

1. **The risk migrates to the done-condition.** In ordinary coding the risk is in
   the building (bugs); in a self-verifying engine the building is the *safe* part
   — the gate catches it. What the gate can't catch is a confidently-verified
   *wrong target*. So the human's one up-front job is approving the TARGET (Gate 1,
   a machine-checkable DONE block); the engine owns *hitting* it. Garbage-in is the
   failure mode, not bugs.
2. **Classify deterministic vs non-deterministic work, and escalate the latter.**
   Deterministic work (a machine gate can judge it) closes on the normal gate +
   panel. Non-deterministic work (taste, UX, layout, copy) has no clean pass/fail,
   so the engine converts what it can to checkable — a design-authority-doc
   conformance lens + a mandatory browser visual pass from a live screenshot — and
   compensates for the residue with MORE self-judged looks (loop until the agent
   judges it good), not a human checkpoint. The honest limit: taste is not fully
   machine-checkable; doc-conformance + visual passes shrink the residue, they
   don't erase it.

**Status — design-stage, pending field-proof.** This is documented as a
*candidate*, not battle-tested judgment: it has not yet been built and proven in a
first repo, let alone converged in a second. Per "Two promotion levels" it stays a
candidate until a first organism proves the gate can actually fail (the
planted-bug self-test) and a second converges on the shape. Don't trust an engine
whose Stage-3 gate has never been shown to say "no."

---

## Build order (staged, for a solo operator)

**Stage 0 — Foundations.** Keep CLAUDE.md to always-true rules; push situational
knowledge into skills/docs. (This doc is an instance of that.)

**Stage 1 — Close one loop.** Pick one bounded feature. Give the agent the spec
plus the verify gate as the done-condition; let it iterate to green *before* you
review. You're proving the gate works, not parallelizing. The day a loop fixes
its own failing test without you, you've crossed the line.

**Stage 2 — Parallelize with worktrees (1–3 agents).** One feature per worktree.
Three concurrent is plenty for one human to review. Resist more.

**Stage 3 — Maker/checker.** Add an adversarial reviewer subagent with its own
context — for the calls tests can't make. Then graduate to the 3-lens panel.

**Stage 4 — Dynamic Workflows for big swings.** Migrations, modernization
passes, security audits, dead-code cleanup. Scope tight, watch the first run —
these consume meaningfully more tokens.

**Stage 5 — Overnight autonomy.** Headless `claude -p` launched before bed,
results at dawn. Cap concurrency, pipe JSON output somewhere scannable. Only
safe once the gate and guardrails are real.

---

## Guardrails & cost control

- **Workflow opt-in is mandatory.** Do NOT launch a dynamic `Workflow` unless
  the user explicitly opted in. A task merely *benefiting* from fan-out is not
  opt-in — describe the workflow and its rough cost, and ask first.
- **Respect your repo's HARD RULES** — the deterministic guardrails a loop must
  never route around. Typical examples: fixed dev ports (port taken → STOP and
  report, never edit config/env to dodge it); git push restrictions (`--force*`,
  `--no-verify` blocked); prod env vars and env files untouchable.
- **Never** add lint-disable comments or `any` to make a gate pass — fix the
  underlying issue. A loop that suppresses the gate has defeated its own purpose.
- **Billing:** subscription plans are fine for 1–3 steady agents. Past ~5
  concurrent, or heavy Workflow use, route to API-key billing so a runaway loop
  is a line item, not an outage.
- **No silent caps.** If a loop bounds coverage (top-N, no-retry, sampling), say
  so. Silent truncation reads as "covered everything" when it didn't.
- **Make failures visible.** Never swallow a server error with a "zero" fallback
  to make a loop appear green. Surface it and fix the root cause.

---

## Shared-environment traps (multi-agent, one repo, one dev deployment)

> **Field note:** earned the hard way when two Claude sessions worked the same
> repo concurrently.

1. **One writer per live deployment.** Hot-reload dev servers (e.g. `convex dev`)
   auto-push every file save — a second session's in-progress edits (including
   test stubs) go live instantly under your verification. Symptom: behavior that
   matches no code in your tree (we once got a literal "PONG" from a production
   surface). Before verifying against a live deployment, `git status` the files
   on that path; if another actor's edits are in flight, **pause and coordinate
   via the user** rather than debugging their WIP.
2. **Pathspec commits keep a shared dirty tree safe.** `git add <your files>`
   then `git commit -- <same paths>` commits exactly your slice and leaves the
   user's staged/dirty work untouched. Never stash, reset, or bundle someone
   else's files; if your change and theirs land in the same file and theirs is
   load-bearing for yours (e.g. an import fix the file needs to compile), say so
   in the commit message.
3. **Delegate mechanical fan-out, but review the delegate's diff.** A subagent
   wiring 31 call sites is a context win, and self-gating (it runs lint/tsc)
   catches most issues — but spot-check the largest per-file diff. One
   delegate's single creative moment was a nonsense conditional-type cast that
   gates passed but a human reviewer wouldn't.
4. **Paste the gate's sharp edges into builder/verifier prompts.** Repo lint
   rules (duplicate-string thresholds, max-lines-per-function, no-disable)
   repeatedly shape what a "correct" change even looks like. Agents that don't
   know the rules propose changes the gate rejects; tell them up front.

---

## Engineering "noticing" — unknown-unknowns don't volunteer

The retro can only promote lessons the loop *noticed*. Noticing is engineerable:

1. **Anomaly triggers force a stop-and-log.** The moment any of these fire,
   write an "expected X, observed Y" entry in the ledger *before* continuing —
   even if you resolve it seconds later:
   - Observed behavior matches **no code in your tree**.
   - Tests green but the **feature is visibly dead/blank** in the real surface.
   - A failure **disappears without your fix explaining why**.
   - Logs/errors reference a file, model, or path you didn't touch.
   - Silent success: an operation that should have side effects completes
     without them.
2. **Every mock needs a real-dependency counterpart somewhere in the gate.**
   A test suite that mocks a library away is *structurally incapable* of
   catching that library's integration bugs, no matter how many tests pass.
   For each mocked boundary (UI library, provider API, auth), name the one
   station that exercises the real thing (browser smoke, live-deployment probe,
   paid-key integration test) — and if none exists, that's a ledger-recorded
   gap, not a shrug.
3. **Negative-space audit at phase end.** Sketch the verification matrix
   (user paths × real-vs-mocked × environments) and *list the unexercised
   cells* in the ledger. You can't always afford to fill them; you can always
   afford to know where you're blind. A completeness-critic agent ("what
   modality wasn't run, what claim wasn't verified?") is the fan-out version.
4. **Near-miss analysis in the retro.** Don't just promote what bit you — ask
   "what was caught by exactly *one* station, and was that station in the
   contract by design or by luck?" Single-sensor catches mean the next bug of
   that class escapes. Strengthen or duplicate that sensor.

---

## Make the loop self-improving (the retro station)

The four stations close a *task*; a fifth closes the *system*. At goal
completion (or when a session ends mid-goal):

1. **The ledger's "traps" section is the staging area.** Every standing trap,
   environment fact, or rejected-finding rationale discovered mid-loop gets
   written there *at the moment of discovery* — not reconstructed later.
2. **Promote on recurrence.** When a goal completes, diff the ledger's traps
   against this playbook: anything that (a) bit twice, (b) cost a phase, or
   (c) would bite a fresh session with zero context, gets promoted into this
   doc as part of the final commit. Session-specific noise stays in the ledger
   and dies with the task.
3. **The skill stays a thin router.** Lessons land here, not in SKILL.md — the
   skill's job is routing; this doc's job is accumulating judgment. If SKILL.md
   grows past ~50 lines, it's absorbing what belongs here.
4. **Prompt it explicitly.** A goal prompt should end with: "before declaring
   done, run the retro station: promote ledger traps into the playbook if they
   meet the promotion bar." Self-improvement that isn't in the loop's contract
   doesn't happen.

**Two promotion levels, two bars.** The three bars above (bit twice / cost a
phase / bites a fresh session) gate promotion into the *per-repo* playbook —
they are single-organism signals: they measure how much a lesson hurt in one
context, which can't distinguish "universal" from "situationally expensive
here." Promotion to the *species* (a shared/public copy of this playbook, if
you maintain one) wants the stronger bar: **independent convergence** — the
same pattern surfacing in a second repo with a different stack, gate, and
domain. The only thing two such repos share is the underlying engineering
reality, so convergence is the closest thing the playbook has to a held-out
test set. Caveat: convergence is high-precision but low-recall — a universal
lesson seen once isn't false, just unconfirmed. Park it in the repo playbook
until a second organism confirms it; don't let the species bar starve the
repo layer.

The promotion bar matters: without it the doc accumulates session diary instead
of judgment and taxes every future read. The three-layer architecture — SKILL.md
routes (per-trigger), this playbook accumulates (per-repo/per-user), the ledger
stages (per-task) — is what survives compaction and session boundaries.

---

## Long loops: context is a consumable — budget it

A multi-phase loop will outlive its context window. The main loop doesn't die at
100% — it **auto-compacts**: the conversation is summarized and work continues in
a fresh window. Compaction is **lossy memory, not free memory**: exact code,
error text, and decision rationale survive only as well as the summary writer
did. Engineer for it instead of being surprised by it:

1. **Ledger-first.** Keep a durable ledger at `.claude/plans/<task>-progress.md`:
   phase status, decisions made, findings **rejected with rationale** (so a
   post-compaction agent doesn't re-accept them), environment facts, exact reuse
   signatures. Update it *before* each commit. The ledger is the source of truth;
   the conversation is scratch space. If the loop's state isn't on disk, it
   doesn't exist.
2. **Compact deliberately at phase boundaries.** Right after a commit + ledger
   update is the safest compaction point — zero in-flight state. Mid-edit
   auto-compaction is the riskiest. Run `/compact` after each phase commit rather
   than letting the window hit the wall mid-task.
3. **Fan out builders, not just verifiers.** Inline building is the biggest
   context burner — every Read/Edit of a large file lands in the main window.
   Subagent/Workflow transcripts cost the main loop nothing but their final
   message. For small phases inline is fine; for large ones, delegate the writes
   too.
4. **Small result payloads.** Have workflows/subagents write detailed findings to
   a file and return counts + the path — not multi-KB JSON into the main loop.
5. **Session-per-phase ratchet (multi-day scale).** Each phase as a fresh session
   or headless `claude -p` run whose contract is: read ledger → do the next
   unchecked phase → run gates → commit → update ledger. Compaction becomes
   irrelevant because no session needs more than one phase of context.

---

## Anti-patterns (stop if you catch yourself here)

- **Looping without a real failure signal.** No gate = not a loop.
- **Self-review as verification.** The maker can't be the only judge.
- **Chasing agent count.** Three good loops beat thirty blind ones.
- **Situational knowledge in CLAUDE.md.** It taxes every turn. Skills/docs exist
  for that.
- **Unattended loops on production data without a parity harness.**
- **Letting auto-compaction be your memory strategy.** If phase status, rejected
  decisions, and environment facts live only in chat, every compaction rolls the
  dice on them. Ledger file, updated before every commit.
- **Handing over architecture and taste.** The model iterates; you still decide
  what's worth building and whether the result is good. That half doesn't compress.

---

## Minimal closed-loop skeleton

The closed loop is now a one-liner, because **`/goal` IS the loop**:

```
/goal pnpm verify exits 0 — fix root causes only (no lint-disable, no `any`,
no port/env edits); re-run pnpm verify after each fix until it is green.
```

Claude won't stop until `pnpm verify` exits 0: no bash wrapper, no `--resume`
juggling, no hand-rolled iteration counter. The harness holds the loop shut —
that's the whole reason `/goal` replaced the scaffolding below. Bound it from the
outside if you're worried about runaway cost (watch the live elapsed/turns/tokens
overlay; `/goal clear` to abort).

**Hand-rolled fallback** — only when `/goal` is unavailable: hooks are disabled
(`disableAllHooks` / `allowManagedHooksOnly`), or a non-Claude process (CI, cron,
another orchestrator) owns the iteration and just calls `claude -p` per step:

```bash
# done-condition: `pnpm verify` exits 0. Cap iterations so a stuck loop dies.
SESSION=""
for i in $(seq 1 6); do
  if pnpm verify; then echo "GREEN on iter $i"; break; fi
  PROMPT="pnpm verify is failing. Read the output, fix the root cause \
          (no lint-disable, no any, no port/env edits), re-run pnpm verify."
  if [ -z "$SESSION" ]; then
    SESSION=$(claude -p "$PROMPT" --output-format json | jq -r .session_id)
  else
    claude -p "$PROMPT" --resume "$SESSION"
  fi
done
```

The shape is the point either way: **real gate, bounded iterations, fix the root
cause not the symptom, context that carries between fixes.** `/goal` gives you all
four natively; the bash loop is what you write when you can't reach it.

---

*Throughline: you're not learning to prompt better — you're building the harness
that lets a small number of agents run hard without babysitting. Build the gate
first; the loops are easy once something can tell them they're wrong.*
