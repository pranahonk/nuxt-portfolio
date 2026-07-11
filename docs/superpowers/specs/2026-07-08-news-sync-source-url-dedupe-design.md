# News Sync Source URL Dedupe Design

**Date:** 2026-07-08  
**Status:** Draft approved in conversation; pending user review  
**Scope:** `server/api/news/sync.post.ts`

## Problem

The scheduled GitHub Actions workflow succeeds, but the production sync endpoint returns `budgetExhausted: true` before adding any new articles.

Observed run results:

- 2026-07-07: `{"added":0,"skipped":0,"total":37,"budgetExhausted":true}`
- 2026-07-08: `{"added":0,"skipped":0,"total":40,"budgetExhausted":true}`
- 2026-07-08: `{"added":0,"skipped":0,"total":38,"budgetExhausted":true}`

Root cause: `server/api/news/sync.post.ts` uses a single 8-second deadline for the entire request, and spends too much of that budget scanning the existing Notion database by title before attempting any inserts.

## Goal

Keep the current sync behavior, but remove the full-database pre-scan bottleneck so new articles can still be created as the Notion database grows.

## Non-goals

- No changes to the GitHub Actions workflow
- No changes to front-end routes or rendering
- No changes to `news/enrich` behavior
- No repo rebuild or static generation redesign
- No permanent reliance on title-only dedupe

## Chosen approach

Use the source article URL as the canonical dedupe key.

Instead of scanning all Notion pages and building a full set of normalized titles, the sync endpoint will read existing source URLs from Notion and compare against `article.url` for each candidate article.

The code must support both Notion property names:

- `source_url`
- `Source URL`

Title-based fallback remains only as a temporary migration guard for legacy rows that do not yet have a source URL property populated.

## Design details

### 1. Canonical dedupe key

Use `article.url` as the primary uniqueness signal.

Reasoning:

- URLs are already available in the sync payload
- URLs are more stable and less ambiguous than titles
- Dedupe by URL scales better than full title scans as the database grows

### 2. Notion property handling

When reading from Notion, the sync code must recognize either:

- `source_url`
- `Source URL`

When writing a new page, the sync code should populate the source URL field using whichever of those property names the database supports.

If both names exist, prefer `source_url` for writes and continue reading both for resilience.

If neither property exists, the endpoint should fail clearly rather than silently pretending the durable fix is active.

### 3. Transitional migration guard

Some old Notion rows may not yet have a populated source URL.

During the transition:

- if a row has `source_url` or `Source URL`, dedupe by URL
- if a row has neither, allow a temporary normalized-title fallback for that row only

This fallback is not the long-term primary strategy. It exists only to avoid accidental duplication while legacy rows are gradually replaced or backfilled.

### 4. Endpoint contract

The endpoint response must remain unchanged:

```json
{
  "added": 0,
  "skipped": 0,
  "total": 0,
  "budgetExhausted": false
}
```

This avoids any workflow or monitoring changes.

### 5. Expected code changes

Primary file:

- `server/api/news/sync.post.ts`

Expected edits:

1. Replace `getExistingTitles(...)` with a function that reads existing source URL values from Notion.
2. Add helpers to:
   - extract a source URL value from either `source_url` or `Source URL`
   - detect which writable property name exists
3. Update `createNotionPage(...)` to write the source URL property.
4. Keep normalized-title fallback only for legacy rows without source URL.
5. Preserve budget handling and response shape.

## Error handling

### Missing source URL property in Notion schema

If neither `source_url` nor `Source URL` exists, return a clear error instead of silently proceeding with the old brittle behavior.

This makes schema drift visible and prevents false confidence.

### Notion API failures

Keep the current behavior of logging item-level create failures and continuing where possible.

### Legacy rows without source URL

Treat title matching only as a temporary compatibility path.

## Testing / verification plan

Minimum verification after implementation:

1. Trigger sync against a database that contains existing rows with populated source URLs.
2. Confirm duplicate source URLs are counted as skipped.
3. Confirm a new article with a new source URL is added before budget exhaustion.
4. Confirm legacy rows without source URL still avoid duplication through temporary title fallback.
5. Confirm the endpoint still returns:
   - `added`
   - `skipped`
   - `total`
   - `budgetExhausted`

## Trade-offs

### Benefits

- Removes the main full-database title-scan bottleneck
- Uses a semantically better dedupe key
- Keeps the workflow contract unchanged
- Small, localized code change

### Costs

- Requires the Notion database to expose a usable source URL property
- Adds short-term dual-path logic while legacy rows exist

## Follow-up

Once legacy rows are backfilled or naturally phased out, remove the temporary title fallback entirely so dedupe is URL-only.