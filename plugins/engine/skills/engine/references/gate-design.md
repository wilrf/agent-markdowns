# Designing the gate

Assemble a gate from the pieces that fit the task. Each piece must be able to fail; together
they cover the DONE block. Discover the active project's real checks; do not assume them.

## Code correctness — find this project's checks

Compose only what the task touches.
- Read `package.json` scripts / `Makefile` / `pyproject.toml` / `justfile` and the repo's
  `CLAUDE.md` / `AGENTS.md`. Find the real commands for **type-check**, **lint** (if it fails
  on warnings, e.g. `--max-warnings 0`, honor that), **unit tests**, and any **integration /
  component** suite that runs apart from unit tests.
- Many repos expose one aggregate "done"/CI command (e.g. a `verify` script that chains
  type-check + lint + tests into one exit code). Prefer it: it is the project's own gate.
- Mirror documented **environment-specific exclusions** (a package that only tests green on
  one OS, a suite that needs a running service) rather than fight them.
- Do not use a production build as a local gate unless the project says to (see Gotchas).

## New behavior and user journeys

- **New behavior with no check** → write the failing test first, watch it fail, then pass it.
- **User-journey changes** → run the project's end-to-end / smoke path (e.g. an auth
  preflight, then a smoke suite against the running app). If it needs auth or a live server
  and that is unavailable, stop and ask for the human's re-auth/setup protocol. Never bypass it.

**Browser-leg assertions** (any user-journey check) follow the four-part contract in
`user-walkthrough` §2.5:
1. **Content, not container.** Assert the thing the user came for — specific rows, IDs, answer
   text — never a wrapper that also renders while loading, empty, or failed.
2. **Terminal state.** Wait for the flow's end state, then assert.
3. **Pinned surface**, including the app's version/flag marker when one exists.
4. **Seen red.** Watch the assertion fail once before you trust its first green.

A workflow verified by an assertion missing any part is UNVERIFIED. See `user-walkthrough` §2.5.

## Prove the gate can fail

Before you trust a gate, see it say "no": a planted type error trips the type-check; a
planted visual break is caught by the visual pass; a browser assertion runs once against the
known-broken state or a falsified expectation.

Anchor red-green on fast-evaluable fixtures, never behind a slow data repair.

## Deterministic vs non-deterministic work

- **Deterministic** (logic, data, types): the gate above judges pass/fail outright.
- **Non-deterministic** (UI/UX, layout, copy, taste): no clean pass/fail, so escalate:
  - A visual pass via browser automation is mandatory. Work from a live screenshot of the
    real page — polish the real surface; do not rebuild it.
  - Add a design-conformance check against the project's design/UX guidelines, if any (look
    under `.claude/docs/design`, a design-system doc, or `CLAUDE.md`).
  - Iterate browser and coding passes until your own judgment says it looks good, then
    continue. No human pause. Conformance and visual passes shrink the taste residue; they
    do not erase it.
  - Spend to a bug budget, not to zero. The bar is that the surface feels reliable and fast.
    Once the gate is green and the surface looks right, stop.
