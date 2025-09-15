<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation Header -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/cms"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to Articles
            </NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ isEditing ? 'Edit Article' : 'New Article' }}
            </h1>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="saveAsDraft"
              :disabled="saving"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save Draft' }}
            </button>
            <button
              @click="publishArticle"
              :disabled="saving || !canPublish"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving ? 'Publishing...' : (article.published ? 'Update' : 'Publish') }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="space-y-6">
        <!-- Article Metadata -->
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                id="title"
                v-model="article.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter article title"
              >
            </div>
            <div>
              <label for="slug" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                id="slug"
                v-model="article.slug"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="article-slug"
              >
            </div>
            <div class="md:col-span-2">
              <label for="excerpt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                v-model="article.excerpt"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Brief description of the article"
              ></textarea>
            </div>
            <div>
              <label for="featuredImage" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Featured Image URL
              </label>
              <input
                id="featuredImage"
                v-model="article.featuredImage"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/image.jpg"
              >
            </div>
            <div>
              <label for="tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                v-model="tagsInput"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="javascript, vue, nuxt"
              >
            </div>
          </div>
        </div>

        <!-- Article Content -->
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Content *
          </label>
          <WysiwygEditor v-model="article.content" />
        </div>

        <!-- Article Preview -->
        <div v-if="article.content" class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Preview</h3>
          <div
            class="prose prose-lg dark:prose-invert max-w-none"
            v-html="article.content"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'cms-auth',
  layout: false
})

// Add robots meta tag
useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet' }
  ]
})

const route = useRoute()
const isEditing = computed(() => route.params.id !== 'new')

const article = ref({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  featuredImage: '',
  tags: [] as string[],
  published: false
})

const tagsInput = ref('')
const saving = ref(false)

// Load article if editing
if (isEditing.value) {
  try {
    const { data } = await $fetch(`/api/cms/articles/${route.params.id}`)
    article.value = { ...data }
    tagsInput.value = data.tags?.join(', ') || ''
  } catch (error) {
    console.error('Failed to load article:', error)
    await navigateTo('/cms')
  }
}

// Auto-generate slug from title
watch(() => article.value.title, (newTitle) => {
  if (!isEditing.value && newTitle && !article.value.slug) {
    article.value.slug = generateSlug(newTitle)
  }
})

// Update tags array when tags input changes
watch(tagsInput, (newTags) => {
  article.value.tags = newTags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
})

const canPublish = computed(() => {
  return article.value.title.trim() && article.value.slug.trim() && article.value.content.trim()
})

const saveAsDraft = async () => {
  await saveArticle(false)
}

const publishArticle = async () => {
  await saveArticle(true)
}

const saveArticle = async (publish: boolean) => {
  if (!canPublish.value) {
    alert('Please fill in all required fields (title, slug, and content)')
    return
  }

  saving.value = true

  try {
    const articleData = {
      ...article.value,
      published: publish
    }

    let savedArticle
    if (isEditing.value) {
      savedArticle = await $fetch(`/api/cms/articles/${route.params.id}`, {
        method: 'PUT',
        body: articleData
      })
    } else {
      savedArticle = await $fetch('/api/cms/articles', {
        method: 'POST',
        body: articleData
      })
    }

    article.value = savedArticle

    // Redirect to edit page if this was a new article
    if (!isEditing.value) {
      await navigateTo(`/cms/articles/${savedArticle.id}`)
    }

    // Show success message
    alert(publish ? 'Article published successfully!' : 'Draft saved successfully!')
  } catch (error: any) {
    console.error('Save failed:', error)
    alert(error.data?.message || 'Failed to save article')
  } finally {
    saving.value = false
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '')
}
</script>
