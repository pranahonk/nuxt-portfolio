<template>
  <div class="flex flex-col min-h-screen justify-between dark:bg-gray-900">
    <!-- Header -->
    <div class="dark:bg-gray-900">
      <Header />
    </div>

    <!-- Error Content -->
    <div class="flex-grow flex items-center justify-center dark:bg-gray-900">
      <div class="wrapper-small text-center py-16">
        <!-- Error Code -->
        <h1 class="text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#7F00FF] via-[#E100FF] to-[#7F00FF] bg-clip-text text-transparent mb-6">
          {{ error?.statusCode || 500 }}
        </h1>

        <!-- Error Title -->
        <h2 class="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ errorTitle }}
        </h2>

        <!-- Error Message -->
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-md mx-auto">
          {{ errorMessage }}
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="handleError"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </button>

          <button
            @click="goBack"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white font-medium rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="dark:bg-gray-900">
      <Footer />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{
  error: NuxtError;
}>();

const errorTitle = computed(() => {
  switch (props.error?.statusCode) {
    case 404:
      return 'Page Not Found';
    case 403:
      return 'Access Denied';
    case 500:
      return 'Server Error';
    default:
      return 'Something Went Wrong';
  }
});

const errorMessage = computed(() => {
  switch (props.error?.statusCode) {
    case 404:
      return "The page you're looking for doesn't exist or has been moved.";
    case 403:
      return "You don't have permission to access this page.";
    case 500:
      return 'An unexpected error occurred. Please try again later.';
    default:
      return props.error?.message || 'An unexpected error occurred.';
  }
});

const handleError = () => {
  clearError({ redirect: '/' });
};

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    clearError({ redirect: '/' });
  }
};

useHead({
  title: `${props.error?.statusCode || 'Error'} - ${errorTitle.value}`,
});
</script>

<style>
.wrapper-small {
  @apply max-w-screen-lg mx-auto px-6;
}
</style>
