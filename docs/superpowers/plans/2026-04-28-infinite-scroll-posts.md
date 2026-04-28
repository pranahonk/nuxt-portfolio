# Infinite Scroll Posts Listing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show 10 articles on initial load, then append 10 more each time the user scrolls to the bottom of the list (unlimited infinite scroll).

**Architecture:** All posts are fetched in one request from `/api/posts`. Client-side, a `visibleCount` ref controls how many are sliced from the sorted array. A sentinel `<div>` at the bottom of the list is watched by `useIntersectionObserver` (auto-imported from `@vueuse/nuxt`) — when it enters the viewport, `visibleCount` increments by 10.

**Tech Stack:** Nuxt 3, `@vueuse/nuxt` (`useIntersectionObserver`), `Blogs.vue` component (unchanged)

---

## Files to Change

| File | Action | Reason |
|------|--------|--------|
| `pages/posts/index.vue` | Rewrite | Add `visibleCount`, sentinel ref, `useIntersectionObserver`, update template |

`Blogs.vue` is **not modified** — it already accepts any `posts` array and renders it.

---

### Task 1: Rewrite `pages/posts/index.vue` with infinite scroll

**Files:**
- Modify: `pages/posts/index.vue` (full rewrite)

- [ ] **Step 1: Replace the file contents**

Overwrite `pages/posts/index.vue` with:

```vue
<script setup lang="ts">
const PAGE_SIZE = 10

const { data, pending, error } = useLazyFetch('/api/posts')

const allPosts = computed(() => {
  const list = (data.value as any[]) || []
  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const visibleCount = ref(PAGE_SIZE)
const visiblePosts = computed(() => allPosts.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < allPosts.value.length)

const sentinel = ref<HTMLElement | null>(null)

useIntersectionObserver(sentinel, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value) {
    visibleCount.value += PAGE_SIZE
  }
})
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">All Blog Posts</h1>
    </div>

    <div v-if="pending" class="text-center py-8">
      <div class="text-gray-500 dark:text-gray-400">Loading posts...</div>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400">Error loading posts. Try refreshing.</div>
    </div>

    <div v-else-if="!allPosts.length" class="text-center py-16">
      <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">No posts yet</h2>
      <p class="text-gray-500 dark:text-gray-400">Check back soon for new content!</p>
    </div>

    <template v-else>
      <Blogs :posts="visiblePosts" title="All Posts"/>
      <div ref="sentinel" class="py-10 text-center">
        <span v-if="hasMore" class="text-gray-400 dark:text-gray-500 text-sm">Loading more...</span>
        <span v-else class="text-gray-400 dark:text-gray-500 text-sm">
          You've reached the end · {{ allPosts.length }} posts total
        </span>
      </div>
    </template>
  </div>
</template>
```

Key points:
- `useLazyFetch('/api/posts')` — no trailing slash (also fixes the URL bug from the companion fix plan)
- `allPosts` = full sorted list; `visiblePosts` = first `visibleCount` items
- `sentinel` ref is the div below the last card; when it enters the viewport `visibleCount += 10`
- `useIntersectionObserver` is auto-imported by `@vueuse/nuxt` — no explicit import needed

- [ ] **Step 2: Verify the key identifiers are present**

Run: `grep -c "useIntersectionObserver\|visibleCount\|sentinel\|PAGE_SIZE" pages/posts/index.vue`
Expected: `4`

- [ ] **Step 3: Start dev server and test manually**

```bash
yarn dev
```

Open `http://localhost:3000/posts` in a browser.

Manual checks (do each in order):
1. Page loads → exactly 10 posts visible (or fewer if total < 10)
2. Scroll to the bottom → `visibleCount` becomes 20, 10 more cards appear below
3. Keep scrolling → 10 more append each time the sentinel enters the viewport
4. After all posts are visible → sentinel shows "You've reached the end · N posts total"
5. No `console.error` entries in browser DevTools

- [ ] **Step 4: Commit**

```bash
git add pages/posts/index.vue
git commit -m "feat(posts): infinite scroll — show 10 articles, load 10 more on scroll"
```

---

### Task 2: Deploy and verify in production

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Netlify deploy (~2 min)**

Watch: Netlify dashboard → Deploys → wait for "Published" status.

- [ ] **Step 3: Verify on production**

Open `https://prana-wijaya.netlify.app/posts` in a browser.

Expected:
- 10 posts visible on first load
- Scrolling to the bottom smoothly appends 10 more without a page reload or layout jump
- "You've reached the end" message appears once all posts are shown
- Works on mobile (touch scroll) as well as desktop

---

## Out of Scope

- Server-side cursor pagination — not needed since total post count is small and all posts are fetched once
- "Back to top" button
- URL params for page number (`/posts?page=2`)

## Risks

- `useIntersectionObserver` may fire immediately on mount if the sentinel is already in the viewport (e.g. very tall screen, only a few posts). This is intentional — it means all posts load right away, which is fine.
- The sentinel is only rendered inside `<template v-else>`, so it is absent while `pending` is true and cannot trigger spurious loads during the initial fetch.
