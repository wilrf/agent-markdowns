---
name: bug-hunt
description: Deep bug hunt — assume bugs exist and find them. Manual only: /bug-hunt.
disable-model-invocation: true
---

# Bug Hunt Playbook

Assume bugs exist. Find all of them, not only the first.

## Approach

- Check runtime and build-time code paths.
- Verify version consistency across package.json, CDNs, and actual usage.
- Run at high effort. Effort catches missed edge cases; it does not fix a wrong approach.
- Done means each finding has evidence: a file:line plus a snippet, a trace, or a repro. A finding without evidence is a hypothesis; label it so. `/bug-fix` verifies each finding with a failing test before any fix.

## What to Check

### Security (OWASP Top 10) — always check
- Injection (SQL, command, XSS)
- Broken authentication, session management, or access control
- Sensitive data exposure; security misconfiguration
- XML external entities (XXE); insecure deserialization
- Components with known vulnerabilities
- Insufficient logging/monitoring

### Logic Errors
- Off-by-one errors
- Null/undefined handling
- Type coercion issues
- Boundary conditions
- Integer overflow/underflow
- Regex edge cases (escaped chars, greedy matching, multiline)

### Concurrency
- Race conditions
- Deadlocks
- Thread safety issues
- Shared mutable state
- **File system race conditions** (read-modify-write without locking)

### Resource Management
- Memory leaks
- File handle leaks
- Connection pool exhaustion
- Unclosed resources
- **Promise leaks** (stored promises never resolved/rejected on error)

### Error Handling
- Swallowed exceptions
- Generic catch blocks
- Missing error paths
- Incomplete rollback on failure
- JSON.parse without schema validation (type assertion bypasses TypeScript)

### Async/Worker Patterns
- Init failure not preventing subsequent calls
- Missing timeout on validation/secondary operations

### Version & Dependency Issues
- Dynamic require/import without structure validation
- Build artifacts out of sync with source (manifest files)

### Parsing & Transform Pipelines
- Escaped quotes in regex patterns
- **Sorting instability** with floating point or equal values
- Order/numbering schemes that don't handle suffixes (1.4a)

### Data Issues
- Data leakage (using future data in ML)
- Inconsistent state
- Missing validation
- Truncation/precision loss
- **Prototype pollution** via unvalidated object keys (__proto__, constructor)
- Duplicate operations overwriting timestamps without idempotency

### AI-Generated Code Patterns
- Hallucinated APIs/methods that don't exist
- Incomplete error handling (happy path only)
- Missing edge cases
- Placeholder/TODO code never completed
- Broken imports/dependencies
- Features that look implemented but aren't wired up
- **Dead parameters** accepted but never used

## Output Format

| Location | Issue | Severity | Evidence |
|----------|-------|----------|----------|
| file:line | Description | Critical/High/Medium/Low | Code snippet or explanation |

## Severity Guidelines

- **Critical**: Data loss, security vulnerability, system hang/crash
- **High**: Silent failures, resource leaks, version mismatches affecting behavior
- **Medium**: Edge cases, validation gaps, debugging difficulty
- **Low**: Code cleanup, unused parameters, minor UX issues

## Summary Structure

End with:
1. Executive summary (X issues across Y modules)
2. Summary by severity (Critical: X, High: Y, etc.)
3. Recommended fix priority order (grouped by file/module)
4. Patterns observed (systemic issues)
5. Test coverage status (framework configured? tests exist?)

## Gotchas

- `Promise.race` timeouts do not cancel the underlying operation → check that the work actually stops (abort signal, worker terminate).
- A CDN script version can differ from the package.json version → compare the CDN URL, the declared version, and the installed version.
- Closures go stale: React `useCallback`/`useMemo` captures and status checks captured in closures → check dependency arrays and where the value is read.
- A Web Worker crash leaves pending callbacks orphaned → check that `onerror` rejects and clears all pending state.
- A function returns `null` for both "not found" and "error" → flag it; callers cannot tell a silent failure from an empty result.
- Whitespace splitting breaks quoted values and leaves empty strings → check quote handling and `filter(Boolean)`.
