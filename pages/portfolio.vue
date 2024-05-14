<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Blogs',
    },
    posts: {
      type: Array,
      default() {
        return []
      },
    },
  },
  async asyncData({$notion, $config: { notionPortfolioPageId }}) {
    const blockMap = await $notion.getPageTable(notionPortfolioPageId);
    const portfolios = blockMap.filter((page) => page.public);
    return {portfolios}
  },
  head: {
    title: "Portfolio"
  },
  methods: {
    getImage(thumbnail){
      if(thumbnail){
        return thumbnail[0]?.url
      }
      else{
        return "https://via.placeholder.com/1000x1000?text=Placeholder"
      }
    }
  },
}
</script>


<template>
  <div class="mt-16">
    <div class="wrapper-small my-5">
      <div
        v-for="post of portfolios"
        :key="post.slug"
        class="project-card md:flex mt-10"
      >
        <div class="img max-w-lg md:max-w-sm mx-auto m-2">
          <nuxt-link :to="`/posts/${post.slug}`">
            <img
              :alt="post.title"
              :src="getImage(post.thumbnail)"
              class="rounded-xl h-44 w-96 object-cover object-center"
            />
          </nuxt-link>
        </div>
        <div class="flex flex-col justify-between max-w-lg mx-auto">
          <div class="txt md:px-5 lg:px-0">
            <nuxt-link :to="`/posts/${post.slug}`">
              <h2
                class="text-xl font-semibold text-gray-800 dark:text-gray-100"
              >
                {{ post.title }}
              </h2>
            </nuxt-link>
            <div class="flex flex-col justify-between max-w-lg mx-auto"></div>
            <span
              v-for="tag of post.tags"
              :key="tag"
              class="font-semibold text-gray-600 bg-opacity-25 dark:bg-opacity-40 dark:text-gray-300 text-sm rounded bg-gray-200 dark:bg-primary mr-1 px-1"
            >
              #{{ tag }}
            </span>
            <p class="text-base text-gray-700 dark:text-gray-200 my-1">
              {{ post.description }}
            </p>
            <nuxt-link
              :to="`/posts/${post.slug}`"
              class="text-base font-semibold text-gray-700 dark:text-gray-200 my-3 hover:underline"
            >
              Read more >
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style lang='css'>
@import "vue-notion/src/styles.css";

.notion-title, .notion-text, .notion-list, .notion-callout-text, p, h1, h2, h3, h4, span {
  @apply dark:text-white;
}

.notion-link {
  @apply dark:hover:bg-red-500;
}
</style>
