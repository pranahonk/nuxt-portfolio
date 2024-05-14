<script setup lang="ts">
import { useProps } from '~/composables/useProps'

const { $notion } = useNuxtApp();
const { data } = await useAsyncData("notion-index", () => $notion.getPageTable("f906db55071f471eb418879a2d0b3c7f"));

console.log(data)
const { mapPageUrl, pageLinkOptions } = useProps();
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <Hero/>
    </div>

    <Blogs :posts="posts" title="Featured blogs"/>
    <Projects :projects="projects"/>
  </div>
</template>
