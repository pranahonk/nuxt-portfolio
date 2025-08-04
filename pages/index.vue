<script setup lang="ts">
const config = useRuntimeConfig();
const { $notion } = useNuxtApp();
const { data } = await useAsyncData("notion-index", async () => {
  const table = await $notion.getPageTable(config.public.notionTableId);
  return JSON.parse(JSON.stringify(table));
});
const projects = data; // Use the same data for projects
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <Hero/>
    </div>

    <Blogs :posts="data" title="Featured blogs"/>
    <Projects :projects="projects"/>
  </div>
</template>
