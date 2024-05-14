<script>
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-shell-session'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-graphql'
import 'prismjs/components/prism-javascript'

export default {
  async asyncData({ $notion, params, error, $config: { notionTableId } }) {
    const pageTable = await $notion.getPageTable(notionTableId);
    console.log(pageTable);
    const page = pageTable.find(
      (item) => item.public && item.slug === params.slug
    )
    const blockMap = await $notion.getPageBlocks(page ? page.id : params.slug)
    if (!blockMap || blockMap.error) {
      return error({ statusCode: 404, message: "Post not found" })
    }
    return { blockMap, page}
  },
  data() {
    return {
      pageLinkOptions: { component: "NuxtLink", href: "to" },
    }
  },
  head() {
    const post = this.page
    const title = post?.title
    const description = post?.description || process.env.DEV_DESCRIPTION
    const image = post?.thumbnail[0].url || null
    const tags = post.tags || title
    const href = process.env.BASE_URL + `/posts/${post.slug}`
    const meta = this.$prepareMeta(
      {title, description, image, keywords: `${tags}`, url: href},
      [{name: "article:published-time", content: post?.created_at || null},]
    )
    return {
      title,
      link: [{rel: "canonical", href}],
      meta,
    }
  }
}
</script>


<template>
  <div>
    <NotionRenderer :block-map="blockMap" :page-link-options="pageLinkOptions" full-page prism/>
    <div class="container mx-auto xl:px-40 px-2">
      <Disqus />
    </div>
  </div>
</template>


<style>
@import "vue-notion/src/styles.css";

/* Apply dark mode styles using media queries (recommended) */
@media (prefers-color-scheme: dark) {
  .notion-title,
  .notion-text,
  .notion-list,
  .notion-callout-text,
  p,
  h1,
  h2,
  h3,
  h4,
  span {
    color: white; /* Base color for dark mode */
  }

  .notion-link:hover {
    background-color: red; /* Adjust shade as needed */
  }
}
</style>
