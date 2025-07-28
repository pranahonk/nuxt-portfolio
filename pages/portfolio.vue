<script setup lang="ts">

const { $notion } = useNuxtApp();
const { data } = await useAsyncData("notion-index", () => $notion.getPageBlocks("f906db55071f471eb418879a2d0b3c7f"));

</script>

<template>
  <NotionRenderer v-if='data' :block-map="data" class='wrapper-small my-5' full-page prism/>
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
