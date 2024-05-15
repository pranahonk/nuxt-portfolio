<script setup lang="ts">
import projects from '~/components/Projects.vue'

const { $notion } = useNuxtApp();
const { data } = await useAsyncData("notion-index", () => $notion.getPageTable("f906db55071f471eb418879a2d0b3c7f"));
</script>

<template>
  <div class="wrapper-small md:px-10">
<!--    <NotionRenderer :blockMap="data" fullPage prism katex :mapPageUrl="mapPageUrl" :pageLinkOptions="pageLinkOptions" />-->
    <div class="mt-5">
      <Hero/>
    </div>

    <Blogs :posts="data" title="Featured blogs"/>
    <Projects :projects="projects"/>
  </div>
</template>
