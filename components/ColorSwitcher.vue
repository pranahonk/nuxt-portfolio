<template>
  <div
    class="rounded-full cursor-pointer ml-5 bg-gray-100 p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    @click="switchTheme"
  >
    <IconSun v-if="$colorMode.value === 'light'" class="h-5 w-5"/>
    <IconMoon v-else class="h-5 w-5"/>
  </div>
</template>

<script setup>
import IconSun from '~/components/Icon/Sun.vue'
import IconMoon from '~/components/Icon/Moon.vue'

const colorMode = useColorMode()

const switchTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
