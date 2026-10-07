---
name: engine-audit
description: Use when the product is FINDINGS, not code — a security audit, a vulnerability sweep, a pre-merge deep review, a dead-code or dependency audit, or any "find everything wrong with X" pass. Triggers on "audit", "security review", "review this PR/codebase for bugs", "find vulnerabilities", "deep review", "exhaustively check". For a single small PR, the built-in /code-review beats this; reserve the loop for audits where coverage accounting matters.
user-invocable: false
---

# Review mode — the loop pointed at existing code

The same loop engine, with FINDINGS as the artifact. Drive it from the station skeleton:

**`templates/review-template.md`** — the review-mode stations.

The full method (and *why*) is in the **agent-loops playbook** (`agent-loops` plugin →
`references/agent-loops-playbook.md`, "Review mode"). Install `agent-loops` for the depth.

Three inversions vs. build mode:

1. **The gate verifies *claims*, not code.** Every finding needs an adversarial refute panel
   and a **mandatory repro**: no repro, no finding. Default each verifier toward "this
   finding is false unless proven." Run verifiers at high effort.
2. **"Done" is *exhaustion*, not a checklist.** Loop until dry (keep finding until K rounds
   surface nothing new). Then publish an honest **coverage map + negative-space list** of
   what you did not examine.
3. **The work is all checker**, so false-positive discipline is the work. Dedup against ALL
   seen findings, not only confirmed ones. Adjudicate every claim against reality before
   you report it.

Pick the lens that pays for your domain (data-isolation/visibility, auth/security,
money/parity) and give it a standing seat on every panel.

## Gotchas

- A clean report with no coverage map is a vibe, not a result → always publish the coverage
  map and negative-space list.
- Verifiers do not know the codebase's history and re-flag rejected findings forever → dedup
  against all seen findings and carry the rejections forward.
