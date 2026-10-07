---
name: architecture-doc
description: Generate architecture documentation for a codebase. Manual only: /architecture-doc.
disable-model-invocation: true
---

# Architecture Documentation Playbook

Generate architecture documentation for the codebase. Done means every component, path, and compliance row cites a file path that exists in the repo.

## Process

### Step 1: Locate the Spec
Find and read the specification document (SpecDoc.md or similar). This is your source of truth.

### Step 2: Map the Codebase
Explore systematically:
1. Entry points (`main.py`, `app.py`, CLI commands)
2. Directory structure and module boundaries
3. Configuration files (`config.py`, `.env`, `settings.*`)
4. Data flow: input → processing → output
5. External dependencies and integrations

### Step 3: Document

Save to `ARCHITECTURE.md` in this format:

```markdown
# Architecture Overview

## System Purpose
[One paragraph summarizing what this system does, derived from spec]

## High-Level Architecture
[Diagram or description of major components and their relationships]

## Data Flow
1. [Input source] →
2. [Processing step] →
3. [Output/storage]

## Directory Structure
src/
├── module/     # Purpose
├── module/     # Purpose
└── module/     # Purpose

## Key Components

### [Component Name]
- **Location**: `src/path/`
- **Purpose**: [What it does]
- **Inputs**: [What it receives]
- **Outputs**: [What it produces]
- **Dependencies**: [What it relies on]

[Repeat for each major component]

## Configuration
| Setting | Location | Purpose |
|---------|----------|---------|
| ... | ... | ... |

## Critical Paths
1. **[Path Name]**: [Description of the flow for critical operations]

## Integration Points
- **External APIs**: [List and purpose]
- **Databases**: [What and where]
- **File I/O**: [What files are read/written]

## Spec Compliance Matrix
| Spec Requirement | Implementation Location | Status |
|------------------|------------------------|--------|
| [Requirement 1] | `src/path/file.py:func` | Implemented / Missing / Partial |

## Architectural Concerns
[Any issues, tech debt, or recommendations discovered during analysis]
```
