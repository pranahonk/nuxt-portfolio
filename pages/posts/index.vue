<script setup lang="ts">
const config = useRuntimeConfig();
const { $notion } = useNuxtApp();
const { data } = await useAsyncData("notion-posts", () => $notion.getPageTable(config.public.notionTableId));
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">All Blog Posts</h1>
    </div>
    <Blogs :posts="data" title="All Posts"/>
  </div>
</template>