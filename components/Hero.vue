<script setup lang='ts'>
import { useRuntimeConfig } from '#imports' // Import from Nuxt 3 plugin
import avatar from '~/assets/image/avatar-transparent.png'

const config = useRuntimeConfig();

</script>

<template>
  <div class="flex h-full text-center text-gray-700 dark:text-gray-200 m-8">
    <div class="m-auto">
      <h2 class="text-xl md:text-2xl lg:text-3xl font-semibold">
        <section class="hero container max-w-screen-lg mx-auto flex justify-center">
          <img
            class="grid place-items-center rounded-full h-56 w-56"
            :src="avatar"
            alt="Avatar"
            width="224"
            height="224"
            loading="lazy"
          />
        </section>
        <span class="font-normal dark:text-gray-300">Hey, I am </span>
        {{ config.public.devName }}
      </h2>
      <h3 class="font-bold text-primary dark:text-primary text-2xl md:text-3xl lg:text-4xl">
        a happy {{ config.public.devRole }}
      </h3>
      <p class="text-lg lg:text-xl font-semibold">{{ config.public.devDescription }}</p>
      <div class="mt-5">
        <TechStack />
      </div>
    </div>
  </div>
</template>
