# Fix Posts Images and Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two UX regressions on `/posts`: all thumbnails show `/logo.png` (Notion articles have no cover images / S3 signed URLs expire after 1 hour), and infinite scroll loads all 81 posts at once instead of 10 at a time.

**Architecture:** Replace the broken `<img>` fallback with a styled gradient placeholder in `Blogs.vue` (no image = beautiful card, not a broken logo). Fix infinite scroll in `pages/posts/index.vue` by adding an `isLoading` guard that prevents the observer from firing again while a batch is still rendering, and by pausing the observer while data is still fetching.

**Tech Stack:** Nuxt 3, Vue 3 `<script setup>`, VueUse `useIntersectionObserver`, Tailwind CSS v3.

---

## Files to Modify

| File | Change |
|------|--------|
| `components/Blogs.vue` | Replace `<img :src="getImage(...)">` with conditional: real `<img>` when thumbnail URL exists, styled gradient `<div>` placeholder otherwise |
| `pages/posts/index.vue` | Add `isLoading` flag + pause/resume observer to prevent rapid-fire batch loads |

---

### Task 1: Fix image placeholder in `components/Blogs.vue`

**Files:**
- Modify: `components/Blogs.vue`

**Problem:** `getImage(thumbnail)` returns `/logo.png` when `thumbnail` is null (Notion articles with no cover image set). `handleImageError` also falls back to `/logo.png` when a URL exists but fails to load (e.g. expired Notion S3 signed URLs with `X-Amz-Expires=3600`). The live API already confirms `thumbnail: null` for all current posts.

**Fix:** When `thumbnail` is null/empty, render a gradient `<div>` with the post title's first letter. When a URL exists, render a real `<img>` (may still succeed for non-S3 sources). If the `<img>` fails to load (`@error`), set `post.thumbnail = null` to swap to the gradient div.

- [ ] **Step 1: Replace the image block in the template**

Open `components/Blogs.vue`. Replace the `<div class="img ...">` block (lines 16–25) with:

```html
<div class="img max-w-lg md:max-w-sm mx-auto m-2">
  <nuxt-link :to="`/posts/${post.slug}`">
    <img
      v-if="getImage(post.thumbnail)"
      :alt="post.title"
      :src="getImage(post.thumbnail)"
      class="rounded-xl h-44 w-96 object-cover object-center"
      loading="lazy"
      @error="handleImageError($event, post)"
    />
    <div
      v-else
      :class="gradientClass(post.title)"
      class="rounded-xl h-44 w-96 flex items-center justify-center"
    >
      <span class="text-white text-4xl font-bold select-none drop-shadow">
        {{ post.title?.[0]?.toUpperCase() ?? '?' }}
      </span>
    </div>
  </nuxt-link>
</div>
```

- [ ] **Step 2: Update `getImage` to return `null` (not `/logo.png`) when no thumbnail**

In the `<script>` block, replace the `getImage` method:

```js
getImage(thumbnail) {
  return thumbnail?.[0]?.url || null
},
```

- [ ] **Step 3: Update `handleImageError` to swap broken image to gradient placeholder**

Replace the `handleImageError` method:

```js
handleImageError(event, post) {
  post.thumbnail = null
},
```

This sets `post.thumbnail = null` on the array item, causing Vue's `v-if="getImage(post.thumbnail)"` to become false and show the gradient `<div>` instead. The mutation is safe here because `posts` is derived from a reactive API fetch (not a Vuex/Pinia store) and the change is purely presentational.

- [ ] **Step 4: Add the `gradientClass` method**

Add this method after `handleImageError` in the `methods` object:

```js
gradientClass(title) {
  const gradients = [
    'bg-gradient-to-br from-blue-500 to-purple-600',
    'bg-gradient-to-br from-green-400 to-teal-600',
    'bg-gradient-to-br from-orange-400 to-red-500',
    'bg-gradient-to-br from-pink-500 to-purple-500',
    'bg-gradient-to-br from-yellow-400 to-orange-500',
    'bg-gradient-to-br from-teal-400 to-cyan-600',
    'bg-gradient-to-br from-indigo-500 to-blue-600',
    'bg-gradient-to-br from-rose-400 to-pink-600',
  ]
  const idx = (title?.charCodeAt(0) ?? 0) % gradients.length
  return gradients[idx]
},
```

- [ ] **Step 5: Verify visually in dev server**

```bash
yarn dev
```

Open `http://localhost:3000/posts`. All posts without thumbnails should now show a colored gradient card with the first letter of the title. Two posts starting with the same letter will share the same gradient. If any post has a valid non-expired image URL, it renders as a real image.

Expected: no `/logo.png` anywhere on the page.

- [ ] **Step 6: Commit**

```bash
git add components/Blogs.vue
git commit -m "fix(posts): gradient letter placeholder replaces /logo.png fallback for articles without thumbnails"
```

---

### Task 2: Fix infinite scroll in `pages/posts/index.vue`

**Files:**
- Modify: `pages/posts/index.vue`

**Problem:** `useIntersectionObserver` fires the callback every time the sentinel enters the viewport. When 10 posts don't fill the screen height, the sentinel is immediately visible after data loads. Each `visibleCount += PAGE_SIZE` triggers a DOM re-render; the page reflow can briefly scroll the sentinel out then back in, causing the observer to fire again — loading all 81 posts in rapid succession.

**Fix:** Add an `isLoading` ref. In the callback, bail early if `isLoading.value` is true. Set it to `true` before incrementing, then reset to `false` after `nextTick()` (once Vue has flushed the DOM update and the new posts are rendered). Also pause the observer while `pending` is true so it never fires before data is ready.

- [ ] **Step 1: Rewrite the `<script setup>` block**

Replace the entire `<script setup lang="ts">` block in `pages/posts/index.vue`:

```ts
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
const isLoading = ref(false)

const { pause, resume } = useIntersectionObserver(
  sentinel,
  async ([entry]) => {
    if (!entry?.isIntersecting || !hasMore.value || isLoading.value) return
    isLoading.value = true
    visibleCount.value += PAGE_SIZE
    await nextTick()
    isLoading.value = false
  },
  { threshold: 0.1 },
)

// Pause observer while data is still fetching; resume once posts are available
watch(pending, (isPending) => {
  if (isPending) pause()
  else resume()
}, { immediate: true })
</script>
```

- [ ] **Step 2: Verify pagination in dev server**

```bash
yarn dev
```

Open `http://localhost:3000/posts`. Confirm:
1. Initial load shows exactly 10 posts with "Loading more..." at the bottom.
2. Scrolling to the bottom loads exactly 10 more (now 20 total).
3. Scrolling to the bottom again loads 10 more (30 total). Continue until "You've reached the end · 81 posts total".
4. Rapidly scrolling to the bottom does NOT load all posts at once.

- [ ] **Step 3: Commit**

```bash
git add pages/posts/index.vue
git commit -m "fix(posts): prevent rapid-fire infinite scroll with isLoading guard and pause-while-fetching"
```

---

## Self-Review

**Spec coverage:**
- ✅ Images: gradient placeholder instead of `/logo.png` for null thumbnails
- ✅ Images: `handleImageError` swaps broken image URLs to gradient placeholder
- ✅ Pagination: `isLoading` guard prevents concurrent observer callbacks
- ✅ Pagination: `pause`/`resume` prevents the observer firing before data is ready

**Placeholder scan:** All code blocks are complete. No TBDs.

**Type consistency:** `getImage` returns `string | null`. `v-if="getImage(post.thumbnail)"` correctly hides the `<img>` when null. `handleImageError(event, post)` signature matches `@error="handleImageError($event, post)"`. `gradientClass(title)` returns a `string` of Tailwind classes.

**Risk:** Mutating `post.thumbnail = null` in `handleImageError` mutates a prop array item. Vue 3 allows this but may warn in strict mode. If a warning appears, the alternative is to track failed URLs in a `Set` ref local to the component:
```js
// In data():
failedUrls: new Set(),
// In getImage():
getImage(thumbnail) {
  const url = thumbnail?.[0]?.url
  return (url && !this.failedUrls.has(url)) ? url : null
},
// In handleImageError():
handleImageError(event, post) {
  const url = post.thumbnail?.[0]?.url
  if (url) this.failedUrls.add(url)
},
```
