---
name: vibe-audit
description: Audit an AI-generated codebase for the typical failure patterns of generated code. Manual only: /vibe-audit.
disable-model-invocation: true
---

# Vibe Code Audit Playbook

Post-generation review for a codebase an AI agent generated from a spec doc. Generated code fails in predictable ways; check each pattern below.

- Run at high effort. Effort catches missed edge cases; it does not fix a wrong approach.
- Done means you ran the install, the tests, and the app, and each finding cites a location. Reading code alone does not prove an audit.

## Common AI Code Problems

### 1. Hallucinated APIs
- Methods/functions that don't exist in the library version used
- Incorrect function signatures
- Made-up package names

**Check**: Verify every external API call exists in the pinned dependency version (requirements.txt/package.json), not only in current docs.

### 2. Happy Path Only
- Error handling missing or incomplete
- No validation on inputs
- Assumes all API calls succeed

**Check**: Trace each function—what happens when things fail?

### 3. Incomplete Implementations
- TODO/FIXME comments left in place
- Placeholder return values
- Functions that exist but do nothing useful

**Check**: Search for TODO, FIXME, "not implemented", pass statements in non-abstract methods.

### 4. Inconsistent Patterns
- Different coding styles across files
- Multiple ways of doing the same thing
- Naming convention violations

**Check**: Compare similar components—do they follow the same patterns?

### 5. Broken Wiring
- Features that look complete but aren't connected
- Dead code that's never called
- Imports that aren't used (or missing imports)

**Check**: Trace from the entry point—is every feature reachable?

### 6. Security Shortcuts
- Hardcoded credentials/API keys
- SQL queries built with string concatenation
- eval() or exec() usage

**Check**: Search for common security anti-patterns.

### 7. Dependency Issues
- Incompatible version combinations
- Missing dependencies
- Unused dependencies bloating the project

**Check**: Run the install, run the tests, run the app.

### 8. Copy-Paste Artifacts
- Duplicate code blocks
- Comments that don't match the code
- Variable names that don't make sense in context

**Check**: Look for suspiciously similar code blocks.

## Audit Checklist

```markdown
## Vibe Code Audit: [Project Name]

### Dependency Check
- [ ] All imports resolve
- [ ] Dependencies install without conflicts
- [ ] API calls match library versions

### Completeness Check
- [ ] No TODO/FIXME remaining
- [ ] No placeholder implementations
- [ ] All features wired up and reachable

### Error Handling Check
- [ ] All external calls have error handling
- [ ] Validation on all inputs
- [ ] Graceful degradation where appropriate

### Security Check
- [ ] No hardcoded secrets
- [ ] Auth/authz implemented correctly
- [ ] No injection vulnerabilities

### Consistency Check
- [ ] Naming conventions followed
- [ ] Patterns consistent across files
- [ ] Code style uniform

### Spec Compliance
- [ ] All requirements implemented
- [ ] No extra undocumented features
- [ ] Behavior matches spec
```

## Output Format

| Category | Issue | Location | Severity |
|----------|-------|----------|----------|
| Hallucinated API | `df.to_parquet()` called but pyarrow not in deps | `src/data/export.py:34` | High |
| Happy Path | No error handling on API call | `src/api/fetch.py:56` | Medium |
| ... | ... | ... | ... |

## Summary

End with:
1. Overall health assessment (Ready / Needs Work / Significant Issues)
2. Blocking issues (must fix before use)
3. Recommended fix order

## Gotchas

- Authentication disabled "for testing" stays in place → search for it and flag it.
