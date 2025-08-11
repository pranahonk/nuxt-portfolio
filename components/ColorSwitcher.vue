<template>
  <button
    type="button"
    :aria-label="$colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    class="rounded-full cursor-pointer ml-3 sm:ml-5 p-2 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
    @click="switchTheme"
  >
    <IconSun v-if="$colorMode.value === 'light'" class="h-5 w-5" />
    <IconMoon v-else class="h-5 w-5" />
  </button>
</template>

<script setup>
import IconSun from '~/components/Icon/Sun.vue'
import IconMoon from '~/components/Icon/Moon.vue'

const colorMode = useColorMode()

const switchTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
