<template>
  <div class="wrapper-small">
    <!-- Loading State -->
    <div v-if="pending" class="py-16">
      <div class="text-center">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-300">Loading project details...</p>
      </div>
    </div>

    <!-- Project Content -->
    <div v-else-if="project" class="py-16">


      <!-- Project Hero Section -->
      <div class="mb-12">
        <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <NuxtImg
            v-if="project?.coverImage"
            :src="project?.coverImage"
            :alt="project?.title"
            class="w-full h-full object-cover"
            width="1024"
            height="320"
            format="webp"
            quality="80"
            loading="eager"
            fetchpriority="high"
            preload
          />
          <div :class="`absolute inset-0 bg-gradient-to-br ${project?.gradient} opacity-40`"></div>
          <div class="absolute inset-0 bg-black bg-opacity-60"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <h1 class="text-4xl md:text-6xl font-bold text-white text-center px-4 drop-shadow-2xl">
              {{ project?.title }}
            </h1>
          </div>
        </div>

        <!-- Project Meta Info -->
        <div class="flex flex-wrap gap-4 justify-center mb-8">
          <a
            :href="project?.liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <IconExternalLink class="w-5 h-5" />
            Live Demo
          </a>

          <a
            v-if="project?.openSource"
            :href="project?.codeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-medium rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            View Code
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2">
          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Project Overview</h2>
            <div class="prose prose-lg dark:prose-invert max-w-none">
              <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                {{ project?.fullDescription }}
              </p>
            </div>
          </section>

          <section v-if="project?.images && project.images.length > 0" class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Project Screenshots</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="(image, index) in project.images"
                :key="index"
                class="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                @click="openImageModal(image, index)"
              >
                <NuxtImg
                  :src="image"
                  :alt="`${project.title} screenshot ${index + 1}`"
                  class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  width="400"
                  height="256"
                format="webp"
                  quality="80"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Key Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="(feature, index) in project?.features || []"
                :key="index"
                class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div class="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-gray-700 dark:text-gray-300">{{ feature }}</p>
              </div>
            </div>
          </section>

          <!-- Challenges -->
          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Challenges & Solutions</h2>
            <div class="space-y-4">
              <div
                v-for="(challenge, index) in project?.challenges || []"
                :key="index"
                class="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-r-lg"
              >
                <p class="text-gray-700 dark:text-gray-300">{{ challenge }}</p>
              </div>
            </div>
          </section>

          <!-- Learnings -->
          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">What I Learned</h2>
            <div class="space-y-4">
              <div
                v-for="(learning, index) in project?.learnings || []"
                :key="index"
                class="p-6 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r-lg"
              >
                <p class="text-gray-700 dark:text-gray-300">{{ learning }}</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <!-- Tech Stack -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technology Stack</h3>
            <div class="space-y-3">
              <div
                v-for="tech in project?.techStack || []"
                :key="tech"
                class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div class="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span class="text-gray-700 dark:text-gray-300 font-medium">{{ tech }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <a
                :href="project?.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                View Live Site
              </a>
              <a
                v-if="project?.openSource"
                :href="project?.codeUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
              >
                View Source Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="py-16">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h1>
        <p class="text-gray-600 dark:text-gray-300 mb-8">The project you're looking for doesn't exist or has been moved.</p>
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </NuxtLink>
      </div>
    </div>

    <!-- Image Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      @click="closeImageModal"
    >
      <div class="relative max-w-4xl max-h-full" @click.stop>
        <!-- Close Button -->
        <button
          @click="closeImageModal"
          class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Navigation Buttons -->
        <button
          v-if="project?.images && selectedImageIndex > 0"
          @click="prevImage"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          v-if="project?.images && selectedImageIndex < project.images.length - 1"
          @click="nextImage"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <img
          :src="selectedImage"
          :alt="`${project?.title} screenshot ${selectedImageIndex + 1}`"
          class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />

        <!-- Image Counter -->
        <div class="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white text-sm">
          {{ selectedImageIndex + 1 }} / {{ project?.images?.length || 0 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { getPortfolioProjects } from '~/server/data/portfolioData';

const route = useRoute();
const projectId = route.params.id as string;

const projects = getPortfolioProjects();
const project = ref(projects.find(p => p.id === projectId));
const pending = ref(false);

if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project Not Found'
  });
}

// Image modal state
const selectedImage = ref<string>('');
const selectedImageIndex = ref<number>(0);
const isModalOpen = ref<boolean>(false);

// Image modal functions
const openImageModal = (image: string, index: number) => {
  selectedImage.value = image;
  selectedImageIndex.value = index;
  isModalOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeImageModal = () => {
  isModalOpen.value = false;
  document.body.style.overflow = 'auto';
};

const nextImage = () => {
  if (project.value?.images && selectedImageIndex.value < project.value.images.length - 1) {
    selectedImageIndex.value++;
    selectedImage.value = project.value.images[selectedImageIndex.value];
  }
};

const prevImage = () => {
  if (project.value?.images && selectedImageIndex.value > 0) {
    selectedImageIndex.value--;
    selectedImage.value = project.value.images[selectedImageIndex.value];
  }
};

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!isModalOpen.value) return;

  switch (event.key) {
    case 'Escape':
      closeImageModal();
      break;
    case 'ArrowRight':
      nextImage();
      break;
    case 'ArrowLeft':
      prevImage();
      break;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = 'auto';
});

useHead({
  title: `${project.value?.title} - Project Details`,
  meta: [
    { name: 'description', content: project.value?.description || 'Project details' }
  ]
});
</script>

<style scoped>
.prose {
  max-width: none;
}
</style>
