<script setup lang="ts">
const { $notion } = useNuxtApp();
const { data } = await useAsyncData("notion-index", () => $notion.getPageTable("f906db55071f471eb418879a2d0b3c7f"));
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
