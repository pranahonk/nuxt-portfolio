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

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  visibleCount.value += PAGE_SIZE
  await nextTick()
  isLoading.value = false
  // If the sentinel is still in the viewport after DOM update, keep loading
  if (hasMore.value && sentinel.value) {
    const rect = sentinel.value.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      await loadMore()
    }
  }
}

const { pause, resume } = useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting) loadMore()
  },
  { threshold: 0 },
)

watch(pending, (isPending) => {
  if (isPending) pause()
  else resume()
}, { immediate: true })
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">All Blog Posts</h1>
    </div>

    <div v-if="pending" class="wrapper-small md:px-10">
      <SkeletonBlogCard v-for="n in 3" :key="n" />
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
