<script setup lang="ts">
// Fetch latest published posts from CMS
const { data } = await useFetch('/api/posts', {
  transform: (posts: any[]) => posts?.slice(0, 3) || [] // Show max 3 featured posts
})
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <Hero/>
    </div>

    <Blogs v-if="data && data.length > 0" :posts="data" title="Featured blogs"/>
    <Projects/>
  </div>
</template>
