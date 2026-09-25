---
name: spec-verify
description: Verify the codebase implements a spec correctly, requirement by requirement. Manual only: /spec-verify.
disable-model-invocation: true
---

# Spec Verification Playbook

Verify the codebase implements the spec correctly.

## Process

For each requirement in the spec:
1. Locate the implementation in code
2. Verify behavior matches spec exactly
3. Check edge cases are handled
4. Flag any deviations

## What to Flag

- **Missing**: Requirement exists in spec but no implementation found
- **Partial**: Implementation exists but incomplete
- **Deviates**: Implementation differs from spec
- **Extra**: Code does something spec doesn't mention (may be intentional or scope creep)
- **Ambiguous**: Spec unclear, implementation made assumptions

## Output Format

### Compliance Matrix

| Spec Section | Requirement | Implementation | Status | Notes |
|--------------|-------------|----------------|--------|-------|
| 2.1 | User can login | `src/auth/login.py:45` | Implemented | |
| 2.2 | Password reset | Not found | Missing | |
| 2.3 | Session timeout | `src/auth/session.py:12` | Partial | No warning before timeout |

### Status Legend
- ✅ Implemented - Matches spec
- ⚠️ Partial - Incomplete implementation
- ❌ Missing - Not implemented
- 🔀 Deviates - Different from spec
- ➕ Extra - Not in spec

### Summary

```markdown
## Compliance Summary

Total requirements: X
- Implemented: X (X%)
- Partial: X (X%)
- Missing: X (X%)
- Deviates: X (X%)

## Critical Gaps
[Requirements that must be implemented]

## Deviations Requiring Decision
[Cases where implementation differs - need to update spec or code]

## Recommendations
[Priority order for addressing gaps]
```
