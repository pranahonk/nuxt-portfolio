<template>
  <div>
    <nav class="wrapper py-6 dark:bg-gray-900">
      <div class="px-10 flex justify-between items-center">
        <div class="logo">
          <nuxt-link to="/">

            <img class="h-full w-full max-h-24" :src='config.public.devLogo' />
          </nuxt-link>
        </div>

        <div class="flex flex-row">
          <nuxt-link class="nav-link" to="/posts">Blog</nuxt-link>
          <nuxt-link class="nav-link" to="/about">About</nuxt-link>
          <nuxt-link class="nav-link" to="/portfolio">Portfolio</nuxt-link>
          <ColorSwitcher/>
        </div>
      </div>
    </nav>
  </div>
</template>


<script setup>
import { useRuntimeConfig } from '#imports' // Import from Nuxt 3 plugin

const config = useRuntimeConfig();
</script>

<style lang='css'>
.mobile-link {
  @apply block px-3 py-2 text-lg text-gray-900 rounded-md text-white font-medium text-center;
}

.nav-link {
  @apply ml-5 font-medium text-center text-lg text-gray-700 dark:text-gray-200 dark:hover:text-blue-400 hover:text-blue-600 m-auto;
}
</style>
