<template>
  <div class="wrapper-small">
    <div class="py-16">
      <!-- Page Header -->
      <div class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-6">My Projects</h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Explore the projects I've built, from concept to completion. Each project represents a unique challenge and learning experience.
        </p>
      </div>

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="(project, index) in portfolioProjects"
          :key="project.id || index"
          class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
        >
          <!-- Project Image with Gradient Overlay -->
          <div class="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-900">
            <img
              v-if="project.coverImage"
              :src="project.coverImage"
              :alt="project.title"
              class="w-full h-full object-contain"
              loading="lazy"
            />
            <div :class="`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-30`"></div>
            <div class="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>

          <!-- Project Content -->
          <div class="p-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {{ project.title }}
            </h3>
            
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
              {{ project.description }}
            </p>

            <!-- Tech Stack -->
            <div class="mb-6">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tech stack:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tech in project.techStack"
                  :key="tech"
                  class="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                >
                  {{ tech }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 mb-4">
              <a
                :href="project.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <IconExternalLink class="w-4 h-4" />
                Live Preview
              </a>
              
              <a
                v-if="project.openSource"
                :href="project.codeUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <IconGithub class="w-4 h-4" />
                View Code
              </a>
            </div>

            <!-- View Details Button -->
            <NuxtLink 
              :to="`/projects/${project.id}`"
              class="w-full inline-block text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              View Details
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string;
  codeUrl: string;
  openSource?: boolean;
  coverImage?: string;
  gradient: string;
}

// Set page meta
useHead({
  title: 'Projects - My Portfolio',
  meta: [
    { name: 'description', content: 'Explore my portfolio of projects, from web applications to mobile apps and everything in between.' }
  ]
});

// Fetch portfolio projects from static API
const portfolioProjects: Project[] = await $fetch('/api/portfolio/projects') as Project[];
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>