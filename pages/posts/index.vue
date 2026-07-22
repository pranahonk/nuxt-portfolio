<script setup lang="ts">
defineOptions({ name: 'posts-index' })

interface PostSummary {
  slug: string; title: string; description: string
  created_at: string; tags: string[]; thumbnail: Array<{ url: string }> | null
}
interface PostsResponse { posts: PostSummary[]; total: number; hasMore: boolean }

const PAGE_SIZE = 10
const page = ref(1)
const posts = ref<PostSummary[]>([])
const total = ref(0)
const hasMore = ref(true)
const isLoading = ref(false)
const error = ref<unknown>(null)
const initialPending = ref(true)

const sentinel = ref<HTMLElement | null>(null)

async function fetchPage(n: number) {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const res = await $fetch<PostsResponse>(`/api/posts?page=${n}&limit=${PAGE_SIZE}`)
    posts.value = n === 1 ? res.posts : [...posts.value, ...res.posts]
    total.value = res.total
    hasMore.value = res.hasMore
  } catch (e) {
    error.value = e
  } finally {
    isLoading.value = false
    initialPending.value = false
  }
}

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  page.value += 1
  await fetchPage(page.value)
}

// onActivated fires on both first mount and KeepAlive re-activation.
// Empty-state check handles initial load; back-nav revalidates.
onActivated(async () => {
  if (posts.value.length === 0) { await fetchPage(1); return }
  try {
    const res = await $fetch<PostsResponse>(`/api/posts?page=1&limit=${PAGE_SIZE}`)
    const known = new Set(posts.value.map(p => p.slug))
    const fresh = res.posts.filter(p => !known.has(p.slug))
    if (fresh.length) posts.value = [...fresh, ...posts.value]
    total.value = res.total
  } catch { /* keep existing list */ }
})

useIntersectionObserver(
  sentinel,
  ([entry]) => { if (entry?.isIntersecting) loadMore() },
  { threshold: 0 },
)
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">All Blog Posts</h1>
    </div>

    <div v-if="initialPending" class="wrapper-small md:px-10">
      <SkeletonBlogCard v-for="n in 3" :key="n" />
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400">Error loading posts. Try refreshing.</div>
    </div>

    <div v-else-if="!posts.length" class="text-center py-16">
      <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">No posts yet</h2>
      <p class="text-gray-500 dark:text-gray-400">Check back soon for new content!</p>
    </div>

    <template v-else>
      <Blogs :posts="posts" title="All Posts" />
      <div ref="sentinel" class="py-10 text-center">
        <span v-if="hasMore" class="text-gray-400 dark:text-gray-500 text-sm">Loading more...</span>
        <span v-else class="text-gray-400 dark:text-gray-500 text-sm">
          You've reached the end · {{ total }} posts total
        </span>
      </div>
    </template>
  </div>
</template>
