# Review template — the loop machinery pointed at an existing codebase

Build mode produces code gated by commands; review mode produces FINDINGS
gated by adversaries. Three inversions from the build template:
(1) the gate verifies claims, not code — refute-panels + repros;
(2) "done" is exhaustion (loop-until-dry + coverage map), not a checklist;
(3) the work is all-checker, so false-positive discipline IS the work.

---

```
/goal Review [SCOPE — branch / PR / subsystem / whole repo] for
[DIMENSIONS]. DELIVERABLE = a findings report at [path] where every
finding is adversarially confirmed, severity-ranked, and repro-backed.
DONE = [K, e.g. 2] consecutive finder rounds produce nothing new AND the
coverage map + negative-space list are complete.

PREFLIGHT: read the repo's gates (lint config, test layout, CI) so finders
know what "correct" even looks like here; build the file/subsystem
inventory the coverage map will be checked against.

PER ROUND:
1. FIND — fan out lens-specialized finders, each blind to the others:
   correctness, [DOMAIN INVARIANT — security/visibility/money/data-validity],
   simplicity (use the playbook's hunt list), plus per-goal lenses
   (perf, concurrency, error-paths). Multi-modal sweep for large scopes:
   by-file, by-feature, by-recent-change, by-dependency.
2. DEDUP fresh findings against ALL previously SEEN findings — not just
   confirmed ones, or judge-rejected findings reappear every round and the
   loop never converges.
3. ADVERSARIAL VERIFY each fresh finding — N skeptics prompted to REFUTE
   ("default to refuted if uncertain"); majority-refuted dies. Severity
   gates evidence: CRITICAL/MAJOR require a repro (failing test, concrete
   exploit input, measured number) or are downgraded to hypothesis.
   No repro = no finding.
4. LEDGER — confirmed (with repro paths), rejected-with-rationale (feeds
   the do-NOT-re-raise list), coverage map progress, anomalies.

DONE checks: dry rounds reached; every inventory item visited by ≥1 lens;
negative-space list written (what was NOT reviewed: untested boundaries,
mocked dependencies never exercised live, environments not probed).

REPORT: findings ranked by severity × confidence, each with location,
repro, and the refute-panel vote. State coverage honestly — a silent cap
reads as "covered everything."

RETRO: same as build mode — promote traps that meet the bar.
```

Notes:
- Small scope (one PR)? A single maker/checker pass or your harness's
  built-in review command beats this machinery. Reserve the loop for
  audits where exhaustion and coverage accounting matter.
- Fixing during review is a mode switch: collect-then-fix beats
  fix-as-you-go (fixes invalidate sibling finders' context mid-round).
  Finish the round, then run fixes as a build-mode goal against the
  confirmed list.
