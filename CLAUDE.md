# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**See [AGENTS.md](./AGENTS.md) for the full operating guide.** It is the single source of truth for this repository: commands, environment variables, the three-tier post data flow, routing rules, security boundaries, and known operational conflicts.

Do not duplicate content from `AGENTS.md` here. Two copies drift, and a stale copy is worse than no copy.

## Quick orientation

- Nuxt 3 SSR, deployed to Netlify with the Nitro `netlify` preset.
- Blog posts resolve Blobs cache → local JSON → Notion. Notion is the source of truth; Blobs is only a cache.
- No test suite, no linter, no formatter. Do not invent those scripts.
- The article generator lives in a separate repository, `/Users/pranawijaya/JobAutomationApplied`. Read its `AGENTS.md` before changing how posts are produced.

## Before changing anything

- Post resolution or slugs: read the Post Data Flow and Content Hashing sections of `AGENTS.md` first.
- Redirects or API routing: read Routing And Redirects. Rule order is load-bearing and has broken the API before.
- Remote content fetching: read Security. Tier 3 fetches arbitrary URLs from Notion, so the SSRF guards are not optional.
- Publishing or scheduling: read Known Conflict: Duplicate Publishing. Two pipelines currently publish on the same schedule.
