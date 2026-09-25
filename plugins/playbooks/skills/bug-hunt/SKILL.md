---
name: bug-hunt
description: Deep bug hunt — assume bugs exist and find them. Manual only: /bug-hunt.
disable-model-invocation: true
---

# Bug Hunt Playbook

Deep bug hunting mode. Assume bugs exist—your job is to find them.

## Approach

Be thorough, not fast:
- Exhaustively explore before concluding
- Check every file that could be relevant
- Don't stop at the first issue—find them all
- Check both runtime AND build-time code paths
- Verify version consistency across package.json, CDNs, and actual usage

## What to Check

### Security (OWASP Top 10)
- Injection flaws (SQL, command, XSS)
- Broken authentication/session management
- Sensitive data exposure
- XML external entities (XXE)
- Broken access control
- Security misconfiguration
- Cross-site scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging/monitoring

### Logic Errors
- Off-by-one errors
- Null/undefined handling
- Type coercion issues
- Boundary conditions
- Integer overflow/underflow
- Regex edge cases (escaped chars, greedy matching, multiline)
- String splitting that doesn't respect quoted values

### Concurrency
- Race conditions
- Deadlocks
- Thread safety issues
- Shared mutable state
- **File system race conditions** (read-modify-write without locking)
- **Stale closure captures** in React useCallback/useMemo

### Resource Management
- Memory leaks
- File handle leaks
- Connection pool exhaustion
- Unclosed resources
- **Promise leaks** (stored promises never resolved/rejected on error)
- **Web Worker crashes** leaving pending callbacks orphaned

### Error Handling
- Swallowed exceptions
- Generic catch blocks
- Missing error paths
- Incomplete rollback on failure
- **Silent failures** returning null without distinguishing "not found" vs "error"
- JSON.parse without schema validation (type assertion bypasses TypeScript)

### Async/Worker Patterns
- **Timeout via Promise.race doesn't cancel underlying operation**
- Worker onerror not cleaning up pending state
- Init failure not preventing subsequent calls
- Status checks captured in closures becoming stale
- Missing timeout on validation/secondary operations

### Version & Dependency Issues
- **CDN version mismatch** with package.json declaration
- Dynamic require/import without structure validation
- Build artifacts out of sync with source (manifest files)

### Parsing & Transform Pipelines
- Whitespace splitting breaking quoted values
- Escaped quotes in regex patterns
- Empty values after split (need filter(Boolean))
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
- **Timeout patterns that don't actually stop execution**

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
