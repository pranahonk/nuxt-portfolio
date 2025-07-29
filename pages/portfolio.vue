<script setup lang="ts">
const config = useRuntimeConfig();
const { $notion } = useNuxtApp();
const { data, error } = await useAsyncData("notion-portfolio", () => $notion.getPageBlocks(config.public.notionPortfolioPageId));
</script>

<template>
  <div class="wrapper-small my-5">
    <div v-if="error" class="text-red-500 dark:text-red-400">
      <h2 class="text-gray-900 dark:text-white">Error loading portfolio page</h2>
      <p class="text-gray-700 dark:text-gray-300">{{ error }}</p>
      <p class="text-gray-600 dark:text-gray-400">notionPortfolioPageId: {{ config.public.notionPortfolioPageId || 'Not set' }}</p>
    </div>
    <NotionRenderer v-else-if="data" :block-map="data" full-page prism/>
    <div v-else class="text-gray-700 dark:text-gray-300">Loading portfolio page...</div>
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
