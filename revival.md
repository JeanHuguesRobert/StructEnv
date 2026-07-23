---
title: "StructEnv Revival"
document_role: source
document_kind: working-note
visibility: public
lifecycle_state: active
status: planned
version: "0.1"
last_modified_at: 2026-07-23
related:
  - "https://github.com/JeanHuguesRobert/simpli/issues/1"
  - "JeanHuguesRobert/simpli (SimpliWiki Revival / SFCP)"
---

# StructEnv Revival

**Status:** planned (not started)  
**Analogy:** same class of work as the **Simpli / SimpliWiki revival** — bring a historically useful, partially generated surface back into a maintainable, corpus-aligned form without pretending the old code is production-ready as-is.

## Why revive

StructEnv sits in the **configuration / structured-env** niche: line-oriented `KEY=VALUE` with nesting, arrays, light type inference, and plugins — “dotenv meets JSON”. That is a natural home for **types and contracts as data** (alongside YAML / JSON Schema), which matches the workspace preference to **avoid TypeScript** and not invent an Inox type dialect.

The current tree is:

- an ambitious **RFC draft** in `README.md` (v1, March 2025);
- a small **JS + Python** reference parser;
- explicit framing as an **AI code-generation benchmark** — useful, but not a finished product;
- **CommonJS**, incomplete plugin plumbing, and uneven tests.

A revival is therefore a **refactor + re-grounding**, not a greenfield rewrite under a new name.

## Parallel with SimpliWiki revival

| Simpli / SimpliWiki | StructEnv |
|---------------------|-----------|
| Legacy wiki engine + SaaS identity | Legacy/draft config format + parsers |
| Revival issue tracks phases and deploy state | This note + GitHub issue for phases |
| New protocol layer (SFCP) where needed | Clean format surface + ESM package; optional later dialect hooks |
| Stay honest about what works | Separate **spec truth** from **implementation truth** |
| Federate into FractaVolta ops | Register in corpus; consume from cogentia / env tooling |

## Non-goals (for the revival)

- Do **not** convert StructEnv to TypeScript.
- Do **not** invent an Inox type dialect inside StructEnv (Inox remains postfix / no AST; schemas stay data).
- Do **not** silently expand scope into a full programming language.
- Do **not** mass-replace YAML elsewhere until the format is trustworthy.

## Goals

1. **Readable source of truth** — RFC vs code aligned; one entry document that is not a double-pasted draft.
2. **ESM-first package** — `"type": "module"`, `.js` entry (same policy as other JeanHuguesRobert tooling).
3. **Honest parser** — plugins that work or are explicitly stubbed; remove dead/broken paths.
4. **Tests as contract** — mocha (or equivalent) covering nesting, arrays, friendly inference, plugins.
5. **Corpus citizenship** — registered in `.cogentia.json`; `research/index.md` (or keep README as sole map) when the surface stabilizes; optional Views Store samples.
6. **Interoperability** — YAML/TOML plugins as bridges, not competitors; StructEnv as preferred **env-shaped** structured config.

## Proposed phases

### Phase 0 — Inventory (next)
- [ ] Audit `src/structenv.js` / `structenv.py` vs README RFC sections
- [ ] List working vs broken plugins
- [ ] Freeze a minimal v1 “must work” subset (`version`, nesting, arrays, friendly, include)
- [ ] Record decisions in this file

### Phase 1 — Spec hygiene
- [ ] Single frontmatter-aware README or split `README.md` + `docs/rfc.md`
- [ ] Explicit versioning (`version` plugin still gates features)
- [ ] Security notes for `shell` / `eval` plugins (strict by default)

### Phase 2 — Implementation revive
- [ ] ESM package layout
- [ ] Fix plugin call context (`env` / `argv` / `in`)
- [ ] Align JS and Python enough for the minimal subset (or mark Python experimental)
- [ ] Green test suite for the subset

### Phase 3 — Corpus & consumers
- [ ] Example `.env` / StructEnv files used by cogentia or operium (optional)
- [ ] Document relation to YAML / JSON Schema in workspace language policy
- [ ] Publish views (package sample, index) if useful on Views Store

### Phase 4 — Optional extensions (later)
- [ ] Schema / validation plugin (declarative, data-driven)
- [ ] Inox or other runtimes as *consumers* of StructEnv documents (not type-dialect hosts)

## Current registry

- **GitHub:** https://github.com/JeanHuguesRobert/StructEnv  
- **Local path:** `../StructEnv` from JeanHuguesRobert registry  
- **Corpus:** registered as `kind: tooling`, `public_role: structured_config_format`  
- **Lifecycle intent:** `revival_planned` until Phase 2 is green

## Tracking

- GitHub issue: *StructEnv Revival* (open on this repository when created)
- Sibling revival track: [simpli#1](https://github.com/JeanHuguesRobert/simpli/issues/1) (SimpliWiki / SFCP)

## Decision log

| Date | Decision |
|------|----------|
| 2026-07-23 | StructEnv registered in corpus; revival framed by analogy to SimpliWiki revival; no implementation work yet |
