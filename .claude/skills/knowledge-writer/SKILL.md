---
name: knowledge-writer
description: Write comprehensive technical knowledge base notes for Obsidian vault with research, Obsidian formatting, and progressive depth from basics to senior level
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
---

# Knowledge Writer

Writes comprehensive technical knowledge base articles for the Obsidian vault. Researches the topic via web, structures content like professional learning resources (metanit, roadmap.sh, official docs), and uses all Obsidian features.

## Usage

```bash
/knowledge-writer <topic>                    # Write a full note on a technology
/knowledge-writer <topic> --update           # Review and update an existing note
/knowledge-writer <topic> --level=senior     # Focus on senior-level depth
/knowledge-writer <topic> --level=beginner   # Focus on fundamentals only
```

## Examples

```bash
/knowledge-writer Docker
/knowledge-writer PostgreSQL
/knowledge-writer "React Hooks" --level=senior
/knowledge-writer Kubernetes --update
```

## What It Does

1. Checks if a note already exists in `base/` via Glob
2. Researches the topic via WebSearch and WebFetch (official docs, metanit, roadmap.sh, interview questions)
3. Builds a comprehensive outline from fundamentals to advanced topics
4. Writes the note in Russian with production-quality code examples
5. Formats with Obsidian features: callouts, frontmatter tags, wikilinks, syntax-highlighted code blocks
6. Places the file in the correct `base/` subdirectory
7. Updates the parent topic index if needed

## Arguments

- `<topic>` (required) - technology or concept to write about (e.g., Docker, PostgreSQL, React Hooks)
- `--update` - review and fill gaps in an existing note instead of writing from scratch
- `--level=senior|beginner` - control depth (default: full coverage from basics to senior)

ARGUMENTS: $ARGUMENTS

## Instructions

You are an expert technical knowledge base author. Write all content in Russian. Follow CLAUDE.md style rules strictly.

### Mandatory Style Rules

1. No em-dash (---) or double dash (--) - use regular hyphen with spaces ( - )
2. Minimal bold - max 1-2 per section, only for definitions
3. No CAPS for emphasis
4. Use Obsidian callouts (`> [!info]`, `> [!important]`, `> [!summary]`) for emphasis
5. No TOC in individual notes - only root index pages have TOC

### Note Structure

Every note follows this structure (adapt sections to the topic):

```markdown
---
tags:
  - primary-topic
  - secondary-topic
---

## Введение
[What, why, key features list]

### Философия и принципы
[Core design decisions]

---

## Установка и настройка

---

## Основы
[Fundamentals with code examples]

---

## [Intermediate Topics]
[Multiple sections, practical examples]

---

## [Advanced Topics]  
[Senior-level: internals, performance, edge cases]

---

## [Ecosystem / Tools]

---

## Production Best Practices
```

### Research Workflow

1. `Glob("base/**/<Topic>*")` - check if note exists
2. `WebSearch("<topic> tutorial structure topics 2025")` - research coverage
3. `WebFetch` on 2-3 top resources to analyze their structure
4. Build outline covering fundamentals through advanced
5. Write each section with code examples, progressive complexity
6. Verify no gaps for target audience

### Directory Placement

Place notes in the correct `base/` subdirectory:
- `base/frontend/` - React, Vue, Angular, CSS
- `base/backend/` - Go, Node.js, Python
- `base/database/` - PostgreSQL, MongoDB, Redis
- `base/devops/` - Docker, Kubernetes, CI/CD
- `base/cs/` - Algorithms, data structures, networking
- `base/architecture/` - System design, patterns
- `base/tools/` - Git, bundlers, IDE
- `base/testing/` - Testing strategies
- `base/ai/` - ML, LLMs, AI tools

### Code Examples

- Syntactically correct and runnable
- Realistic variable names (not foo/bar)
- Complete, self-contained where possible
- Include imports when non-obvious
- Comments only where code isn't self-explanatory

### Quality Checklist

Before finishing:
- [ ] Frontmatter with relevant tags
- [ ] Introduction explains what, why, key features
- [ ] Code examples are correct
- [ ] No em-dash or double dash
- [ ] Bold used sparingly
- [ ] Callouts for important info
- [ ] Progressive depth: basics -> intermediate -> advanced
- [ ] No obvious topic gaps
