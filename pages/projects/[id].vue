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
      <!-- Back Button -->
      <div class="mb-8">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </NuxtLink>
      </div>

      <!-- Project Hero Section -->
      <div class="mb-12">
        <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <div :class="`absolute inset-0 bg-gradient-to-br ${project?.gradient} opacity-90`"></div>
          <img
            v-if="project?.coverImage"
            :src="project?.coverImage"
            :alt="project?.title"
            class="w-full h-full object-cover mix-blend-overlay"
          />
          <div class="absolute inset-0 bg-black bg-opacity-20"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <h1 class="text-4xl md:text-6xl font-bold text-white text-center px-4">
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
            :href="project?.codeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:text-white font-medium rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            View Code
          </a>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <!-- Project Details -->
        <div class="lg:col-span-2">
          <!-- Description -->
          <section class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Project Overview</h2>
            <div class="prose prose-lg dark:prose-invert max-w-none">
              <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                {{ project?.fullDescription }}
              </p>
            </div>
          </section>

          <!-- Features -->
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
  </div>
</template>

<script setup lang="ts">
interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  techStack: string[];
  liveUrl: string;
  codeUrl: string;
  coverImage?: string;
  gradient: string;
  features: string[];
  challenges: string[];
  learnings: string[];
}

const route = useRoute();
const projectId = route.params.id as string;

const { data: project, error, pending } = await useFetch<Project>(`/api/portfolio/projects/${projectId}`);

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
