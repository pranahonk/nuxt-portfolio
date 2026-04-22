<script setup lang='ts'>
import avatar from '~/assets/image/avatar-transparent.png'

const config = useRuntimeConfig();
</script>

<template>
  <div class="py-12 px-4 sm:px-8 text-center text-gray-700 dark:text-gray-200">
    <div class="max-w-2xl mx-auto">
      <!-- Avatar -->
      <div class="flex justify-center mb-6">
        <img
          class="rounded-full h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 ring-4 ring-primary/20 shadow-lg object-cover"
          :src="avatar"
          alt="Avatar"
          width="224"
          height="224"
          loading="lazy"
        />
      </div>

      <!-- Name -->
      <h1 class="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-2">
        <span class="font-normal dark:text-gray-300">Hey, I am </span>
        {{ config.public.devName }}
      </h1>

      <!-- Role with typewriter -->
      <h2 class="flex flex-wrap items-center justify-center gap-2 font-bold text-primary dark:text-primary text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4">
        <span>a happy</span>
        <span class="typewriter">{{ config.public.devRole.trim() }}</span>
      </h2>

      <!-- Description -->
      <p class="text-base sm:text-lg lg:text-xl font-semibold text-gray-600 dark:text-gray-300 mb-5">
        {{ config.public.devDescription }}
      </p>

      <!-- Social links -->
      <div class="flex justify-center mb-2">
        <Social />
      </div>

      <!-- Tech stack -->
      <TechStack />
    </div>
  </div>
</template>

<style scoped>
.typewriter {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid currentColor;
  vertical-align: middle;
  width: 0;
  animation:
    typing 2s steps(17, end) 0.5s forwards,
    blink 0.75s step-end infinite;
}

@keyframes typing {
  from { width: 0 }
  to   { width: 17ch }
}

@keyframes blink {
  50% { border-color: transparent }
}
</style>
