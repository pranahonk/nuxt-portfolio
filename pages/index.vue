<script setup lang="ts">
// Use static blog data to prevent hydration issues
const data = ref([
  {
    slug: '5-program-menarik-python-dengan-contoh',
    title: '5 Program Menarik Python dengan Contoh',
    description: 'Explore 5 interesting Python programs with practical examples that demonstrate the power and versatility of Python programming.',
    created_at: '2024-01-15',
    tags: ['python', 'programming', 'tutorial'],
    thumbnail: [{ url: '/logo.png' }]
  }
]);
// Projects component now fetches its own data
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <Hero/>
    </div>

    <Blogs :posts="data" title="Featured blogs"/>
    <Projects/>
  </div>
</template>
