<script setup lang="ts">
interface Post {
  slug: string
  title: string
  description: string
  created_at: string
  tags: string[]
  thumbnail: { url: string }[] | null
}

const posts = ref<Post[]>([])
const pending = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<Post[]>('/api/posts')
    posts.value = (data || []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch {
    error.value = true
  } finally {
    pending.value = false
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
      <div class="text-red-600 dark:text-red-400">Error loading posts</div>
    </div>

    <div v-else-if="posts.length === 0" class="text-center py-16">
      <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">No posts yet</h2>
      <p class="text-gray-500 dark:text-gray-400">Check back soon for new content!</p>
    </div>

    <Blogs v-else :posts="posts" title="All Posts"/>
  </div>
</template>
