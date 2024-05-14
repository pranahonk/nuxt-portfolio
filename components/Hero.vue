<template>
  <div class="flex h-full text-center text-gray-700 dark:text-gray-200 m-8">
    <div class="m-auto">
      <h2 class="text-xl md:text-2xl lg:text-3xl font-semibold">
        <section class="hero container max-w-screen-lg mx-auto flex justify-center">
          <img class="grid place-items-center rounded-full h-56 w-56" src='~/assets/image/avatar-transparent.png' alt='Avatars'>
        </section>
        <span class="font-normal dark:text-gray-300">
          Hey, I am </span>{{ $config.devName}}
      </h2>
      <div class='text-center'>
        <vue-typed-js
          :type-speed='100'
          :loop='true'
          :strings="['Software Engineer', 'Front End Developer',
          'Mobile Apps Developer']">
          <h3 class="font-bold text-primary dark:text-primary text-2xl md:text-3xl lg:text-4xl">
            a happy <span class="typing"></span>
          </h3>
        </vue-typed-js>
      </div>



      <p class="text-lg lg:text-xl font-semibold">
        {{ $config.devDescription}}
      </p>
      <div class="mt-5">
        <TechStack/>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  computed: {
    /**
     * Returns the selected color mode value.
     * @returns {string} The color mode as "light" or "dark".
     */
    getSelectedTheme() {
      return this.$colorMode.value
    },
  },
}
</script>
