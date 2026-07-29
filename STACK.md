# The Skill Stack — operating doctrine

The default pipeline for agent work. Don't cherry-pick one skill and freestyle
the rest — walk the stack. Canonical personal copy lives in `~/.claude/CLAUDE.md`;
this is the portable doctrine. Skills resolve to the plugins in this repo
(`engine`, `ledger`, `orchestration`, `agent-loops`, `diagnose-ui-glitch`) plus
harness built-ins (`code-review`, `simplify`) and Superpowers
(`brainstorming`, `writing-plans`, `systematic-debugging`,
`verification-before-completion`).

## 0 · Recall — before anything else

Any reference to something the user did, saw, or read → query the screen-record
/ session-history tooling first (Coast, transcripts). Never guess at the past
when it's recorded.

Recall also fills in what the prompt forgot to say. Before any non-trivial
request, use it to recover the three things prompts most often omit:

- **Intent** — what was the user just doing/looking at that prompted the ask?
- **Scope** — which repo, branch, PR, file, or app is "this"/"it"?
- **Context** — errors, messages, or state they saw but didn't paste.

Ground the interpretation in recorded evidence; if the record has nothing,
say so and ask rather than guess.

## Cross-cutting · Ledger (plugin: `ledger`)

Any task spanning multiple phases, sessions, or context windows opens
`<task>-progress.md` at start: source of truth for goal/gate, phase status,
decisions, the do-NOT-re-raise list, anomalies, environment facts. Update
before every commit; `/compact` at phase boundaries only; a resuming session
reads the ledger before trusting its own memory. If state isn't in the
ledger, it doesn't exist.

## 1 · Shape the work

- New feature or behavior change → `brainstorming`, then `writing-plans` for
  anything multi-step.
- Bug or unexpected behavior → the bug-replication protocol, ALWAYS all
  three together, before any fix:
  1. **Screen-record recall** (Coast or equivalent) — pull the frames of
     what the user actually saw: the incident as experienced, timestamps,
     exact on-screen state.
  2. **`diagnose-ui-glitch`** — drive the app and RECORD the reproduction
     (.webm + first-bad-frame + time-aligned console/network signals); it
     is the recording harness for every UI bug repro, not just flicker.
  3. **`systematic-debugging`** — the method: reproduce → isolate →
     root-cause; no behavior edits before the root cause is named.
  Re-running the same recorded steps after the fix is the user-level
  red-green proof; a bug without a recorded repro doesn't enter the gate.
  (Non-UI bugs skip leg 2's browser recording and capture the repro as a
  failing test or logged command run instead.)

## 2 · Execute — ONE step, one machine

Engine + governor + delegate **compose**; they are not a menu.

- **`engine`** (plugin: `engine`) is the spine of all substantive execution:
  design a gate that can prove the work done (and can fail), get sign-off on
  the target, build and self-verify until green. If the work can have a gate,
  it runs under engine — not just overnight runs.
- **Delegate the typing**: inside engine phases the default builder is the
  cheapest capable frontier model via CLI offload (Codex at xhigh) — engine
  writes the tight spec, the delegate implements, engine verifies against the
  gate. In-session implementation is the exception that needs a reason.
- **Multi-lane phases** (plugin: `orchestration`): `govern` opens ABOVE the
  engines as policy/sequencing authority; each lane's `liaison` clerks the
  mechanics (worktrees, dispatch, gates, PRs) and dispatches its own
  engine + delegate work. Liaison never merges to main.
- **Gate design for anything user-facing MUST include a Playwright leg** —
  the gate isn't green until the feature is driven in the browser like a
  user (see tripod below).

Net shape: **govern steers → liaison clerks → engine drives → delegate types
→ gates prove → ledger remembers.** Single-lane work drops the top two
layers; the engine + delegate + gate core is always on.

## 3 · Polish and prove — the quality tripod

All three legs, every feature. A feature that skipped a leg is not done.
The legs catch disjoint failure classes; none substitutes for another.

1. **Playwright user-testing** (plugin: `user-walkthrough`) — enumerate every
   workflow the feature touches, walk each end-to-end like a real user, then
   the edge-case battery (empty states, invalid input, double-actions,
   refresh mid-flow, rapid navigation, small viewports, back button). Green
   unit tests are NOT this; the feature must be seen working in the browser.
   Findings go to the ledger.
   **Two surfaces, two roles — walk both, never confuse them:** the local
   dev server is the BUILD surface (full freedom: mutate, seed, instrument;
   fixes gate-verify here first, via Playwright with test auth); deployed
   production is the OBSERVE surface (read-only: confirm the bug exists for
   real users before fixing, confirm the fix after deploy; drive with the
   user's own signed-in browser, never wire test auth against prod). The
   ledger records which surface each finding and proof came from.
   *Catches: code is right but the product is broken.*
2. **Adversarial review** — reviewers prompted to REFUTE, not admire:
   `code-review` / `engine-review`, findings adjudicated by a
   verify-findings pass, optionally an independent second-model lens. A
   finding survives only if it withstands a genuine attempt to kill it — and
   so does the feature.
   **The security lens is a mandatory part of this leg** (default code
   review often excludes it): a dedicated pass covering authz/authn (who can
   reach this, per-document ownership, identity from client args), injection,
   and data exposure. Skip only for changes with no attack surface — and say
   so explicitly.
   *Catches: product looks right but the logic is wrong — or exploitable.*
3. **Simplify** — once it works and survives review, iterate the changed
   code to its sleekest form before presenting. Never settle for
   first-draft code.
   *Catches: both right but unmaintainable.*

Then, before claiming anything complete, fixed, or passing →
`verification-before-completion`. Evidence before assertions, every time.

## The through-line

Memory first · thinking before building · the cheapest capable model doing
the labor · nothing declared finished without proof.
