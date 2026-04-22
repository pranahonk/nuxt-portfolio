<script setup lang="ts">
import { onMounted, watch } from 'vue'

const route = useRoute()
const { data: post, pending, error } = await useFetch(`/api/posts/${route.params.slug}`)

// Handle broken images in post content
const setupContentImageHandlers = () => {
  const contentEl = document.querySelector('.prose')
  if (contentEl) {
    const images = contentEl.querySelectorAll('img')
    images.forEach((img) => {
      img.onerror = () => {
        img.src = '/logo.png'
        img.classList.add('image-fallback')
      }
      // Add background color while loading
      img.classList.add('bg-gray-200', 'dark:bg-gray-700')
    })
  }
}

onMounted(() => {
  setupContentImageHandlers()
})

watch(post, () => {
  // Re-setup handlers when post data changes
  nextTick(() => {
    setupContentImageHandlers()
  })
})

useHead({
  title: () => post.value?.title ? `${post.value.title} - Blog` : 'Blog Post'
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/logo.png'
}
</script>

<template>
  <div class="wrapper-small my-8">
    <!-- Loading State -->
    <div v-if="pending" class="text-center py-16">
      <div class="text-gray-500 dark:text-gray-400">Loading post...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-16">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
      <NuxtLink
        to="/posts"
        class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Posts
      </NuxtLink>
    </div>

    <!-- Post Content -->
    <article v-else-if="post" class="max-w-3xl mx-auto">
      <!-- Post Header -->
      <header class="mb-8">
        <!-- Back Link -->
        <NuxtLink
          to="/posts"
          class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Posts
        </NuxtLink>

        <!-- Featured Image -->
        <div v-if="post.thumbnail?.[0]?.url" class="mb-6 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            :src="post.thumbnail[0].url"
            :alt="post.title"
            class="w-full h-64 md:h-80 object-cover"
            @error="handleImageError"
          />
        </div>

        <!-- Title -->
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ post.title }}
        </h1>

        <!-- Meta -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <time :datetime="post.created_at">
            {{ formatDate(post.created_at) }}
          </time>
          <span v-if="post.updated_at !== post.created_at" class="text-gray-400 dark:text-gray-500">
            (Updated: {{ formatDate(post.updated_at) }})
          </span>
        </div>

        <!-- Tags -->
        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
          >
            #{{ tag }}
          </span>
        </div>
      </header>

      <!-- Post Body -->
      <div
        class="prose prose-lg dark:prose-invert max-w-none prose-a:text-purple-600 prose-pre:bg-gray-900"
        v-html="post.content"
      />

      <!-- Post Footer -->
      <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <NuxtLink
          to="/posts"
          class="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          View all posts
        </NuxtLink>
      </footer>
    </article>
  </div>
</template>

<style>
/* Prose overrides */
.prose img {
  border-radius: 0.5rem;
  background-color: rgb(229 231 235);
}
.dark .prose img { background-color: rgb(55 65 81); }
.prose img.image-fallback { object-fit: contain; padding: 2rem; }
.prose pre { border-radius: 0.5rem; }
.prose blockquote { border-left-color: #9333ea; }
.dark .prose blockquote { border-left-color: #c084fc; }

/* ── Dev.to code block wrapper ───────────────────────────────────── */
.prose .highlight,
.prose div.highlight {
  background: #282c34;
  border-radius: 0.5rem;
  overflow: hidden;
  margin: 1.25rem 0;
}

.prose .highlight pre,
.prose pre.highlight {
  background: #282c34 !important;
  color: #abb2bf;
  margin: 0;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.7;
  border-radius: 0;
}

.prose .highlight code {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: inherit;
}

/* Hide Dev.to fullscreen panel */
.prose .highlight__panel { display: none; }

/* ── Rouge / Pygments token colours (OneDark palette) ────────────── */
.prose .highlight .k,
.prose .highlight .kd,
.prose .highlight .kn,
.prose .highlight .kr,
.prose .highlight .kt { color: #c678dd; } /* keywords – purple */

.prose .highlight .nf,
.prose .highlight .fm { color: #61afef; } /* function names – blue */

.prose .highlight .s,
.prose .highlight .s1,
.prose .highlight .s2,
.prose .highlight .sb,
.prose .highlight .sc,
.prose .highlight .sd,
.prose .highlight .se,
.prose .highlight .si,
.prose .highlight .sx { color: #98c379; } /* strings – green */

.prose .highlight .mi,
.prose .highlight .mf,
.prose .highlight .mh,
.prose .highlight .mo,
.prose .highlight .il { color: #d19a66; } /* numbers – orange */

.prose .highlight .c,
.prose .highlight .c1,
.prose .highlight .cm,
.prose .highlight .cs,
.prose .highlight .cp { color: #5c6370; font-style: italic; } /* comments */

.prose .highlight .o,
.prose .highlight .ow { color: #56b6c2; } /* operators – cyan */

.prose .highlight .n,
.prose .highlight .na,
.prose .highlight .nb,
.prose .highlight .nc,
.prose .highlight .nd,
.prose .highlight .ne,
.prose .highlight .ni,
.prose .highlight .nl,
.prose .highlight .nn,
.prose .highlight .no,
.prose .highlight .nt,
.prose .highlight .nv,
.prose .highlight .nx { color: #e06c75; } /* names/identifiers – red */

.prose .highlight .p,
.prose .highlight .pi,
.prose .highlight .pn { color: #abb2bf; } /* punctuation – default */

.prose .highlight .gd { color: #e06c75; } /* diff deleted */
.prose .highlight .gi { color: #98c379; } /* diff inserted */
.prose .highlight .gh { color: #61afef; font-weight: bold; }
</style>
