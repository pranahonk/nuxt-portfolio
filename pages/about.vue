<script setup lang="ts">
const config = useRuntimeConfig();
const { $notion } = useNuxtApp();
const { data, error } = await useAsyncData("notion-about", () => $notion.getPageBlocks(config.public.notionAboutPageId));
</script>


<template>
  <div class="wrapper-small my-5">
    <div v-if="error" class="text-red-500">
      <h2>Error loading about page</h2>
      <p>{{ error }}</p>
      <p>notionAboutPageId: {{ config.public.notionAboutPageId || 'Not set' }}</p>
    </div>
    <NotionRenderer v-else-if="data" :block-map="data" full-page prism/>
    <div v-else>Loading about page...</div>
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
