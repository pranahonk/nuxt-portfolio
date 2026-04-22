<script setup lang="ts">
const config = useRuntimeConfig()

const toolkit = [
  { category: 'Web Development', items: ['React', 'Vue', 'Svelte'] },
  { category: 'Mobile Development', items: ['React Native', 'SwiftUI'] },
  { category: 'Backend Development', items: ['Node.js'] },
]

const stack = [
  { label: 'Environment', items: 'Git, GitHub, pip, Agile (Scrum), JIRA, CI, CircleCI and Test Driven Development' },
  { label: 'Code', items: 'Python, Django Framework, Flask, Celery' },
  { label: 'Data', items: 'PostgreSQL, Redis, MySQL, SQL Server and SQLite' },
  { label: 'Deployment', items: 'Docker, Amazon Web Services (AWS), Heroku, Nginx, Celery and RabbitMQ' },
]
</script>

<template>
  <div class="wrapper-small md:px-10">

    <!-- Bio Section -->
    <div class="mt-16">
      <div class="flex justify-center items-center text-base font-semibold text-gray-600 dark:text-gray-300">
        <h2 class="text-center">A bit about me</h2>
        <IconDoubleDown class="h-4 w-4" />
      </div>

      <div class="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          A digital coder based in 🇮🇩 Indonesia
        </h1>
        <p class="text-purple-600 font-semibold mb-5">
          🚀 Versatile Software Engineer | Tech Polyglot | Industry Innovator
        </p>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          As a dedicated Software Engineer with 6 years of diverse experience, I bring a potent mix of
          development skills and industry insights to the table. My expertise in React Native, Swift, and
          Node.js has propelled platforms like Axiata's Boost Kedai, where I enhanced front-end
          functionalities to amplify transactions and enrich digital experiences. I'm committed to
          delivering code that resonates with users and elevates business metrics.
        </p>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          Passionate about leveraging technology to drive innovation, I'm on a relentless quest to solve
          real-world problems through software. Let's connect and create something extraordinary together!
        </p>
      </div>
    </div>

    <!-- Technical Toolkit -->
    <div class="mt-16">
      <div class="flex justify-center items-center text-base font-semibold text-gray-600 dark:text-gray-300">
        <h2 class="text-center">Technical Toolkit</h2>
        <IconDoubleDown class="h-4 w-4" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        <div
          v-for="tool in toolkit"
          :key="tool.category"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 transition-colors">
            {{ tool.category }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="item in tool.items"
              :key="item"
              class="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- What will I do? -->
    <div class="mt-16">
      <div class="flex justify-center items-center text-base font-semibold text-gray-600 dark:text-gray-300">
        <h2 class="text-center">What will I do?</h2>
        <IconDoubleDown class="h-4 w-4" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div
          v-for="item in stack"
          :key="item.label"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🚀 {{ item.label }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {{ item.items }}
          </p>
        </div>
      </div>
    </div>

    <!-- Get In Touch -->
    <div class="mt-16 mb-10">
      <div class="flex justify-center items-center text-base font-semibold text-gray-600 dark:text-gray-300">
        <h2 class="text-center">Get In Touch</h2>
        <IconDoubleDown class="h-4 w-4" />
      </div>

      <div class="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <p class="text-gray-600 dark:text-gray-300 mb-6">Feel free to reach out:</p>
        <div class="flex flex-col sm:flex-row gap-4">
          <a
            :href="config.public.devTwitterLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
          >
            <IconTwitter class="h-4 w-4" />
            DM me on Twitter ⚡
          </a>
          <a
            href="mailto:pranajobs@hotmail.com"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
          >
            <span>📧</span>
            pranajobs@hotmail.com
          </a>
        </div>
      </div>
    </div>

  </div>
</template>
