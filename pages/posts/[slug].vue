<script setup lang="ts">
const route = useRoute()
const { $notion } = useNuxtApp()
const { data, pending, error } = useLazyAsyncData(`notion-post-${route.params.slug}`, () =>
  $notion.getPageBlocks(route.params.slug.toString())
)
</script>

<template>
  <div class="wrapper-small my-5">
    <div v-if="pending" class="notion">Loading...</div>
    <div v-else-if="error" class="text-red-500">
      <h2>Error loading blog post</h2>
      <p>{{ error }}</p>
      <p>Post slug: {{ route.params.slug }}</p>
    </div>
    <div v-else-if="data">
      <NotionRenderer :blockMap="data" fullPage prism katex />
    </div>
    <div v-else class="text-gray-500">
      <h2>Post not found</h2>
      <p>The blog post "{{ route.params.slug }}" could not be found.</p>
    </div>
  </div>
</template>

<style>
@import "vue3-notion/dist/style.css";

.notion-title, .notion-text, .notion-list, .notion-callout-text, p, h1, h2, h3, h4, span {
  @apply dark:text-white;
}

.notion-link {
  @apply dark:hover:bg-red-500;
}
</style>