---
name: review
description: Use when the product is FINDINGS, not code — a security audit, a vulnerability sweep, a pre-merge deep review, a dead-code or dependency audit, or any "find everything wrong with X" pass. Triggers on "audit", "security review", "review this PR/codebase for bugs", "find vulnerabilities", "deep review", "exhaustively check". For a single small PR, the built-in /code-review beats this; reserve the loop for audits where coverage accounting matters.
user-invocable: false
---

# Review mode — the loop pointed at existing code

The same loop engine, with FINDINGS as the artifact. Drive it from the station skeleton:

**`templates/review-template.md`** — the review-mode stations.

The full method (and *why*) is in the **agent-loops playbook** (`agent-loops` plugin →
`references/agent-loops-playbook.md`, "Review mode"). Install `agent-loops` for the depth.

Three inversions vs. build mode — internalize these or it isn't review:

1. **The gate verifies *claims*, not code.** Every finding needs an adversarial refute-panel
   and a **mandatory repro**. "No repro = no finding" is review's "no test = no loop." Default
   each verifier toward "this finding is FALSE unless proven."
2. **"Done" is *exhaustion*, not a checklist.** Loop-until-dry (keep finding until K rounds
   surface nothing new), then publish an honest **coverage map + negative-space list** of what
   you did NOT examine. A clean report with no coverage map is a vibe, not a result.
3. **The work is all-checker**, so false-positive discipline IS the work: dedup against ALL
   seen findings (not just confirmed ones), and adjudicate every claim against reality before
   reporting — verifiers don't know the codebase's history and re-flag rejected findings forever.

Pick the lens that pays for your domain (data-isolation/visibility, auth/security, money/parity)
and give it a standing seat on every panel.
