# Posts Skeleton Loading + Projects Slug SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Replace the plain "Loading posts..." text on `/posts` with animated skeleton cards that match the actual card layout; (2) Replace numeric `/projects/2` URLs with meaningful slugs like `/projects/myboost-kedai-merchant-platform` for better SEO; (3) Add proper `og:*` meta tags to project pages; (4) Open GitHub issues to track both improvements.

**Architecture:** Skeleton: a new `SkeletonBlogCard.vue` component mirrors the `Blogs.vue` card layout with `animate-pulse` placeholders — `pages/posts/index.vue` renders 3 of them while `pending` is true. Projects SEO: add a `slug` field to every entry in `server/data/portfolioData.ts`, rename `pages/projects/[id].vue` → `pages/projects/[slug].vue` and update the lookup, update `pages/projects/index.vue` links, and add `og:title/description/image/url` to `useHead` on both project pages. GitHub issues are opened via `gh issue create`.

**Tech Stack:** Nuxt 3 / Vue 3 `<script setup>`, Tailwind CSS v3 `animate-pulse`, GitHub CLI (`gh`).

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `components/SkeletonBlogCard.vue` | Create — animated pulse placeholder matching the Blogs.vue card |
| `pages/posts/index.vue` | Modify — replace text loader with `<SkeletonBlogCard>` × 3 |
| `server/data/portfolioData.ts` | Modify — add `slug` field to all 24 project objects |
| `pages/projects/[slug].vue` | Create — copy of `[id].vue` but looks up by `slug`, adds full og: meta |
| `pages/projects/[id].vue` | Delete — replaced by `[slug].vue` |
| `pages/projects/index.vue` | Modify — change link from `/projects/${project.id}` to `/projects/${project.slug}`, add og: meta |

---

### Task 1: Open GitHub issues

**Files:** none (CLI only)

- [ ] **Step 1: Create issue for skeleton loading**

```bash
gh issue create \
  --repo pranahonk/nuxt-portfolio \
  --title "feat(posts): add skeleton loading to /posts list page" \
  --body "## Problem
The /posts page shows a plain text 'Loading posts...' while the API fetches data. This creates a layout shift and poor perceived performance.

## Solution
Add animated skeleton cards (Tailwind animate-pulse) that match the real Blogs.vue card layout — shown while \`pending\` is true."
```

- [ ] **Step 2: Create issue for projects SEO**

```bash
gh issue create \
  --repo pranahonk/nuxt-portfolio \
  --title "fix(projects): replace numeric /projects/2 URLs with slug-based routes for SEO" \
  --body "## Problem
Project detail pages use numeric IDs (/projects/2) which are meaningless to search engines and users.

## Solution
1. Add \`slug\` field to every project in \`portfolioData.ts\` (e.g. \`myboost-kedai-merchant-platform\`)
2. Rename \`pages/projects/[id].vue\` → \`pages/projects/[slug].vue\`, update lookup to match by slug
3. Update \`pages/projects/index.vue\` links
4. Add og:title, og:description, og:image, og:url to \`useHead\` on project pages"
```

- [ ] **Step 3: Note the issue numbers**

```bash
gh issue list --repo pranahonk/nuxt-portfolio --limit 5
```

No commit needed — CLI only.

---

### Task 2: Posts skeleton loading

**Files:**
- Create: `components/SkeletonBlogCard.vue`
- Modify: `pages/posts/index.vue` (lines 55–57 only)

- [ ] **Step 1: Create `components/SkeletonBlogCard.vue`**

```vue
<template>
  <div class="project-card md:flex mt-10 animate-pulse">
    <div class="img max-w-lg md:max-w-sm mx-auto md:mx-0 m-2 md:mr-4">
      <div class="rounded-xl h-44 w-96 bg-gray-200 dark:bg-gray-700"></div>
    </div>
    <div class="flex flex-col justify-between max-w-lg mx-auto md:flex-1 md:mx-0">
      <div class="txt md:px-5 lg:px-0">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-1 md:mt-0"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2"></div>
        <div class="flex gap-1 mt-2">
          <div class="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div class="space-y-2 mt-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-3"></div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace the text loader in `pages/posts/index.vue`**

Change lines 55–57 from:

```html
    <div v-if="pending" class="text-center py-8">
      <div class="text-gray-500 dark:text-gray-400">Loading posts...</div>
    </div>
```

to:

```html
    <div v-if="pending" class="wrapper-small md:px-10">
      <SkeletonBlogCard v-for="n in 3" :key="n" />
    </div>
```

- [ ] **Step 3: Verify locally**

```bash
yarn dev
```

Open http://localhost:3000/posts and hard-refresh. Expected: 3 animated grey skeleton cards appear for ~1-2 seconds while the API call completes, then real posts replace them with no layout shift.

- [ ] **Step 4: Commit**

```bash
git add components/SkeletonBlogCard.vue pages/posts/index.vue
git commit -m "feat(posts): replace text loader with animated skeleton cards"
```

---

### Task 3: Projects slug URLs + og: meta

**Files:**
- Modify: `server/data/portfolioData.ts` (add `slug` to all 24 objects)
- Create: `pages/projects/[slug].vue`
- Delete: `pages/projects/[id].vue`
- Modify: `pages/projects/index.vue` (link + og: meta)

- [ ] **Step 1: Add `slug` to every project in `portfolioData.ts`**

In `server/data/portfolioData.ts`, add a `slug` field immediately after each `id` field. Complete mapping:

```
id: '1'   → slug: 'occumed-job-analysis-portal'
id: '2'   → slug: 'myboost-kedai-merchant-platform'
id: '3'   → slug: 'rcti-plus-streaming-platform'
id: '4'   → slug: 'telunjuk-shopping-search-engine'
id: '5'   → slug: 'blanja-ecommerce-marketplace'
id: '6'   → slug: 'indoesports-media-platform'
id: '7'   → slug: 'compas-business-intelligence'
id: '8'   → slug: 'sakoo-sales-management-platform'
id: '9'   → slug: 'xetia-ai-platform'
id: '10'  → slug: 'brilian-muda-health-cms'
id: '11'  → slug: 'bilby-faith-bible-app'
id: '12'  → slug: 'dicty-ios-dictionary-app'
id: '13'  → slug: 'pemuda-huang-community-platform'
id: '14'  → slug: 'rcti-plus-graphql-gateway'
id: '15'  → slug: 'rcti-plus-core-identity-provider'
id: '16'  → slug: 'rcti-plus-video-live-api'
id: '17'  → slug: 'rcti-plus-video-content-api'
id: '18'  → slug: 'rcti-plus-ugc-vote-service'
id: '19'  → slug: 'rcti-plus-ugc-rule-engine'
id: '20'  → slug: 'rcti-plus-ugc-monetization-service'
id: '21'  → slug: 'rcti-plus-sitemap-generator'
id: '22'  → slug: 'roov-mono-api'
id: '23'  → slug: 'rcti-plus-android-tv-app'
id: '24'  → slug: 'mole-open-source'
```

Example — project 1 before:
```ts
    {
      id: '1',
      title: 'OccuMed Job Analysis Portal',
```

After:
```ts
    {
      id: '1',
      slug: 'occumed-job-analysis-portal',
      title: 'OccuMed Job Analysis Portal',
```

Apply this pattern to all 24 project objects using Edit.

- [ ] **Step 2: Update the `Project` interface in `pages/projects/index.vue`**

Change:

```ts
interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string;
  codeUrl: string;
  openSource?: boolean;
  coverImage?: string;
  gradient: string;
}
```

to:

```ts
interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string;
  codeUrl: string;
  openSource?: boolean;
  coverImage?: string;
  gradient: string;
}
```

- [ ] **Step 3: Update the project card link in `pages/projects/index.vue`**

Change line 17:

```html
          :to="`/projects/${project.id}`"
```

to:

```html
          :to="`/projects/${project.slug}`"
```

- [ ] **Step 4: Add `og:` meta to `pages/projects/index.vue`**

Replace the `useHead` call:

```ts
useHead({
  title: 'Projects - My Portfolio',
  meta: [
    { name: 'description', content: 'Explore my portfolio of projects, from web applications to mobile apps and everything in between.' }
  ]
});
```

with:

```ts
useHead({
  title: 'Projects - Prana Wijaya Portfolio',
  meta: [
    { name: 'description', content: 'Explore my portfolio of projects, from web applications to mobile apps and everything in between.' },
    { property: 'og:title', content: 'Projects - Prana Wijaya Portfolio' },
    { property: 'og:description', content: 'Explore my portfolio of projects, from web applications to mobile apps and everything in between.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.pwijaya.com/projects' },
  ]
});
```

- [ ] **Step 5: Create `pages/projects/[slug].vue`**

Create this file — it is a full replacement of `[id].vue` with: (a) `route.params.slug` instead of `route.params.id`, (b) lookup by `slug`, (c) enriched `useHead` with og: meta + canonical. Template is identical to the current `[id].vue`.

```vue
<template>
  <div class="wrapper-small">
    <!-- Loading State -->
    <div v-if="pending" class="py-16">
      <div class="text-center">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-300">Loading project details...</p>
      </div>
    </div>

    <!-- Project Content -->
    <div v-else-if="project" class="py-16">
      <div class="mb-12">
        <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <img
            v-if="project?.coverImage"
            :src="project?.coverImage"
            :alt="project?.title"
            class="w-full h-full object-cover"
            width="1024"
            height="320"
            loading="eager"
          />
          <div :class="`absolute inset-0 bg-gradient-to-br ${project?.gradient} opacity-40`"></div>
          <div class="absolute inset-0 bg-black bg-opacity-60"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <h1 class="text-4xl md:text-6xl font-bold text-white text-center px-4 drop-shadow-2xl">
              {{ project?.title }}
            </h1>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 justify-center mb-8">
          <a
            :href="project?.liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <IconExternalLink class="w-5 h-5" />
            Live Demo
          </a>
          <a
            v-if="project?.openSource"
            :href="project?.codeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-medium rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            View Code
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2">
          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Project Overview</h2>
            <div class="prose prose-lg dark:prose-invert max-w-none">
              <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ project?.fullDescription }}</p>
            </div>
          </section>

          <section v-if="project?.images && project.images.length > 0" class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Project Screenshots</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="(image, index) in project.images"
                :key="index"
                class="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                @click="openImageModal(image, index)"
              >
                <img
                  :src="image"
                  :alt="`${project.title} screenshot ${index + 1}`"
                  class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  width="400"
                  height="256"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Key Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="(feature, index) in project?.features || []"
                :key="index"
                class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div class="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-gray-700 dark:text-gray-300">{{ feature }}</p>
              </div>
            </div>
          </section>

          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Challenges & Solutions</h2>
            <div class="space-y-4">
              <div
                v-for="(challenge, index) in project?.challenges || []"
                :key="index"
                class="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-r-lg"
              >
                <p class="text-gray-700 dark:text-gray-300">{{ challenge }}</p>
              </div>
            </div>
          </section>

          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">What I Learned</h2>
            <div class="space-y-4">
              <div
                v-for="(learning, index) in project?.learnings || []"
                :key="index"
                class="p-6 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r-lg"
              >
                <p class="text-gray-700 dark:text-gray-300">{{ learning }}</p>
              </div>
            </div>
          </section>
        </div>

        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technology Stack</h3>
            <div class="space-y-3">
              <div
                v-for="tech in project?.techStack || []"
                :key="tech"
                class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div class="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span class="text-gray-700 dark:text-gray-300 font-medium">{{ tech }}</span>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <a
                :href="project?.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                View Live Site
              </a>
              <a
                v-if="project?.openSource"
                :href="project?.codeUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
              >
                View Source Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="py-16">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h1>
        <p class="text-gray-600 dark:text-gray-300 mb-8">The project you're looking for doesn't exist or has been moved.</p>
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </NuxtLink>
      </div>
    </div>

    <!-- Image Modal -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
        @click="closeImageModal"
      >
        <button @click="closeImageModal" class="fixed top-4 right-4 z-[10000] text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3" aria-label="Close image">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[10000] text-white text-sm bg-black/50 px-4 py-2 rounded-full">
          {{ selectedImageIndex + 1 }} / {{ project?.images?.length || 0 }}
        </div>
        <button v-if="project?.images && selectedImageIndex > 0" @click.stop="prevImage" class="fixed left-4 top-1/2 transform -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3" aria-label="Previous image">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button v-if="project?.images && selectedImageIndex < project.images.length - 1" @click.stop="nextImage" class="fixed right-4 top-1/2 transform -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3" aria-label="Next image">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div class="w-full h-full flex items-center justify-center p-4 md:p-16" @click.stop>
          <img :src="selectedImage" :alt="`${project?.title} screenshot ${selectedImageIndex + 1}`" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { getPortfolioProjects } from '~/server/data/portfolioData'

const route = useRoute()
const projectSlug = route.params.slug as string

const projects = getPortfolioProjects()
const project = ref(projects.find(p => (p as any).slug === projectSlug))
const pending = ref(false)

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project Not Found' })
}

const selectedImage = ref<string>('')
const selectedImageIndex = ref<number>(0)
const isModalOpen = ref<boolean>(false)

const openImageModal = (image: string, index: number) => {
  selectedImage.value = image
  selectedImageIndex.value = index
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
}
const closeImageModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = 'auto'
}
const nextImage = () => {
  if (project.value?.images && selectedImageIndex.value < project.value.images.length - 1) {
    selectedImageIndex.value++
    selectedImage.value = project.value.images[selectedImageIndex.value]
  }
}
const prevImage = () => {
  if (project.value?.images && selectedImageIndex.value > 0) {
    selectedImageIndex.value--
    selectedImage.value = project.value.images[selectedImageIndex.value]
  }
}
const handleKeydown = (event: KeyboardEvent) => {
  if (!isModalOpen.value) return
  switch (event.key) {
    case 'Escape': closeImageModal(); break
    case 'ArrowRight': nextImage(); break
    case 'ArrowLeft': prevImage(); break
  }
}
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'auto'
})

const canonicalUrl = `https://www.pwijaya.com/projects/${projectSlug}`
useHead({
  title: `${project.value?.title} - Prana Wijaya Portfolio`,
  meta: [
    { name: 'description', content: project.value?.description || 'Project details' },
    { property: 'og:title', content: `${project.value?.title} - Prana Wijaya Portfolio` },
    { property: 'og:description', content: project.value?.description || 'Project details' },
    { property: 'og:image', content: project.value?.coverImage || 'https://www.pwijaya.com/logo.png' },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>

<style scoped>
.prose { max-width: none; }
</style>
```

- [ ] **Step 6: Delete `pages/projects/[id].vue`**

```bash
rm pages/projects/\[id\].vue
```

Nuxt's file-based router stops generating `/projects/:id`. The new `/projects/:slug` route takes its place.

- [ ] **Step 7: Verify locally**

```bash
yarn dev
```

1. Open http://localhost:3000/projects — confirm all cards link to slug URLs (e.g. `/projects/occumed-job-analysis-portal`)
2. Click a card — confirm detail page loads at the slug URL
3. Open http://localhost:3000/projects/myboost-kedai-merchant-platform — confirm "MyBoost Kedai Merchant Platform" renders
4. Open http://localhost:3000/projects/2 — confirm 404 (old numeric URL gone)
5. View page source — confirm `og:image`, `og:title`, `og:url`, `<link rel="canonical">` appear in `<head>`

- [ ] **Step 8: Commit**

```bash
git add server/data/portfolioData.ts pages/projects/index.vue pages/projects/\[slug\].vue
git rm pages/projects/\[id\].vue
git commit -m "fix(projects): replace numeric /projects/:id with slug-based routes and add og: meta tags"
```

---

## Success criteria

- [ ] `yarn build` passes with no TypeScript errors
- [ ] `/posts` shows 3 animated skeleton cards during loading
- [ ] `/projects` page links all use slug-based paths
- [ ] `/projects/myboost-kedai-merchant-platform` loads the correct project
- [ ] `/projects/2` returns 404
- [ ] Project detail pages have `og:title`, `og:description`, `og:image`, `og:url`, and `<link rel="canonical">` in `<head>`
