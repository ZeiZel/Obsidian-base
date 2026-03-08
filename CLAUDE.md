# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal knowledge base repository covering software engineering and computer science topics. The content is written in Obsidian (markdown) and deployed as a static site using Quartz.

**Content location:** `base/` directory - contains all markdown knowledge base files organized by topic (frontend, backend, devops, cs, ai, architecture, etc.)

**Static site generator:** Quartz - lives in `quartz/` directory

## Commands

```bash
# Run local development server with hot reload
npm run docs

# Build static site (outputs to public/)
npx quartz build -d base

# Format code
npm run format

# Type check
npm run check

# Run tests
npm run test
```

## Architecture

- `base/` - Markdown knowledge base files (Obsidian vault)
  - `_png/` - Images referenced in markdown
  - `index.md` - Root page
  - Topic directories: `frontend/`, `backend/`, `devops/`, `cs/`, `ai/`, `architecture/`, `database/`, `tools/`, etc.
- `quartz/` - Quartz static site generator
  - `components/` - Preact UI components
  - `plugins/` - Transform, filter, and emit plugins for markdown processing
  - `styles/` - SCSS styles
  - `util/` - Helper utilities
- `quartz.config.ts` - Main Quartz configuration (theme, plugins, metadata)
- `quartz.layout.ts` - Page layout components configuration

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) automatically builds and deploys to GitHub Pages on push to main.

## Task Management

Use beads (`bd`) for task tracking:

```bash
bd list           # List issues
bd create "..."   # Create new issue
bd status         # Check status
```

# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

Use `bd` fro tasktracking.
