<template>
  <div class="mt-16">
    <div
      class="flex justify-center items-center text-base font-semibold text-gray-600 dark:text-gray-300"
    >
      <h2 class="text-center">{{ title }}</h2>
      <IconDoubleDown class="h-4 w-4" />
    </div>

    <div class="wrapper-small my-5">
      <div
        v-for="post of posts"
        :key="post.slug"
        class="project-card md:flex mt-10"
      >
        <div class="img max-w-lg md:max-w-sm mx-auto m-2">
          <nuxt-link :to="`/posts/${post.slug}`">
            <img
              v-if="getImage(post.thumbnail)"
              :alt="post.title"
              :src="getImage(post.thumbnail)"
              class="rounded-xl h-44 w-96 object-cover object-center"
              loading="lazy"
              @error="handleImageError($event, post)"
            />
            <div
              v-else
              :class="gradientClass(post.title)"
              class="rounded-xl h-44 w-96 flex items-center justify-center"
            >
              <span class="text-white text-4xl font-bold select-none drop-shadow">
                {{ post.title?.[0]?.toUpperCase() ?? '?' }}
              </span>
            </div>
          </nuxt-link>
        </div>
        <div class="flex flex-col justify-between max-w-lg mx-auto">
          <div class="txt md:px-5 lg:px-0">
            <nuxt-link :to="`/posts/${post.slug}`">
              <h2
                class="text-xl mt-1 md:mt-0 font-semibold text-gray-800 dark:text-gray-100"
              >
                {{ post.title }}
              </h2>
            </nuxt-link>
            <p class="font-semibold mt-1 md:mt-0 text-gray-600 dark:text-gray-300 text-sm">
              {{ formatDate(post.created_at) }}
            </p>
            <div class="flex flex-wrap gap-1 mt-1 mb-1">
              <span
                v-for="tag of post.tags"
                :key="tag"
                class="font-semibold text-gray-600 bg-opacity-25 dark:bg-opacity-40 dark:text-gray-300 text-sm rounded bg-gray-200 dark:bg-primary px-1"
              >#{{ tag }}</span>
            </div>
            <p class="text-base text-gray-700 dark:text-gray-200 my-1 ">
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
  methods: {
    formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(date).toLocaleDateString('en', options)
    },
    getImage(thumbnail) {
      return thumbnail?.[0]?.url || null
    },
    handleImageError(event, post) {
      post.thumbnail = null
    },
    gradientClass(title) {
      const gradients = [
        'bg-gradient-to-br from-blue-500 to-purple-600',
        'bg-gradient-to-br from-green-400 to-teal-600',
        'bg-gradient-to-br from-orange-400 to-red-500',
        'bg-gradient-to-br from-pink-500 to-purple-500',
        'bg-gradient-to-br from-yellow-400 to-orange-500',
        'bg-gradient-to-br from-teal-400 to-cyan-600',
        'bg-gradient-to-br from-indigo-500 to-blue-600',
        'bg-gradient-to-br from-rose-400 to-pink-600',
      ]
      const idx = (title?.charCodeAt(0) ?? 0) % gradients.length
      return gradients[idx]
    },
  },
}
</script>
