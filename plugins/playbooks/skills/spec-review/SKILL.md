---
name: spec-review
description: Review a spec doc before any code is written — find gaps, contradictions, and risks. Manual only: /spec-review.
disable-model-invocation: true
---

# Spec Doc Review Playbook

Review the spec doc to prevent problems before any code is written.

## Reasoning Approach

For each requirement, think step-by-step:
1. Is this requirement clear and unambiguous?
2. Is it implementable as described?
3. What could go wrong?
4. What's missing?
5. Will this create tech debt?

## Review Categories

| Category | Questions to Ask |
|----------|------------------|
| **Clarity** | Can two developers read this and build the same thing? Are there ambiguous terms? |
| **Completeness** | What happens on errors? Edge cases? Empty states? Are all user flows covered? |
| **Consistency** | Do requirements contradict each other? Are naming conventions consistent? |
| **Feasibility** | Can this actually be built? Are there impossible or conflicting constraints? |
| **Scalability** | Will this design handle 10x load? Are there O(n²) traps hidden in requirements? |
| **Security** | Auth/authz defined? Input validation? Data privacy? OWASP concerns? |
| **Data Integrity** | Race conditions possible? What if operations fail midway? Rollback strategy? |
| **Dependencies** | External APIs reliable? What if they're down? Version constraints? |
| **Testability** | Can each requirement be verified? Are acceptance criteria measurable? |
| **Maintainability** | Will this be debuggable? Are there hidden complexity bombs? |

## Tech Debt Prevention Checklist

- [ ] No "we'll handle this later" items
- [ ] No vague requirements that will require interpretation
- [ ] No over-engineering (features that aren't needed)
- [ ] No under-specification (gaps that will be filled ad-hoc)
- [ ] No premature optimization requirements
- [ ] No tight coupling baked into the design
- [ ] No missing error handling requirements
- [ ] No assumptions about external systems

## Output Format

```markdown
# Spec Review: [Document Name]

## Summary
[1-2 sentence overall assessment: Ready / Needs Work / Major Issues]

## Critical Issues (Must fix before implementation)
| Requirement | Issue | Recommendation |
|-------------|-------|----------------|
| ... | ... | ... |

## Warnings (Should fix)
| Requirement | Issue | Recommendation |
|-------------|-------|----------------|
| ... | ... | ... |

## Suggestions (Nice to have)
| Requirement | Suggestion |
|-------------|------------|
| ... | ... |

## Missing Requirements
[List anything the spec should address but doesn't]

## Ambiguities Requiring Clarification
[List questions that need answers before implementation]

## Tech Debt Risks
[Anything in this spec that will likely cause problems later]

## Verdict
[ ] Ready for implementation
[ ] Needs minor revisions (list them)
[ ] Needs major revisions (block implementation)
```
