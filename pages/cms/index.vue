<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Content Management System</h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="importFromNotion"
              :disabled="importing"
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {{ importing ? 'Importing...' : 'Import from Notion' }}
            </button>
            <NuxtLink
              to="/cms/articles/new"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              New Article
            </NuxtLink>
            <button
              @click="handleLogout"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-2 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Articles</h2>
          <p class="text-gray-600 dark:text-gray-400">Manage your blog articles</p>
        </div>

        <!-- Articles List -->
        <div v-if="pending" class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">Loading articles...</div>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <div class="text-red-600 dark:text-red-400">Error loading articles: {{ error }}</div>
        </div>

        <div v-else class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div v-if="!articles || articles.length === 0" class="p-8 text-center">
            <div class="text-gray-500 dark:text-gray-400 mb-4">No articles yet</div>
            <NuxtLink
              to="/cms/articles/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create your first article
            </NuxtLink>
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="article in articles"
              :key="article.id"
              class="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      {{ article.title }}
                    </h3>
                    <span
                      :class="article.published ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ article.published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {{ article.excerpt || 'No excerpt available' }}
                  </p>
                  <div class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <span>Created: {{ formatDate(article.createdAt) }}</span>
                    <span>Updated: {{ formatDate(article.updatedAt) }}</span>
                    <span>Slug: /posts/{{ article.slug }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <NuxtLink
                    :to="`/cms/articles/${article.id}`"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                  >
                    Edit
                  </NuxtLink>
                  <button
                    @click="deleteArticle(article)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
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

const { data: articles, pending, error, refresh } = await useFetch('/api/cms/articles')

const importing = ref(false)

const importFromNotion = async () => {
  if (!confirm('Import articles from Notion? Existing articles with the same slug will be skipped.')) {
    return
  }

  importing.value = true

  try {
    const result = await $fetch('/api/cms/import-notion', { method: 'POST' })

    let message = `Import completed!\n\nImported: ${result.imported}\nSkipped: ${result.skipped}`
    if (result.errors > 0) {
      message += `\nErrors: ${result.errors}`
    }

    alert(message)
    refresh()
  } catch (err: any) {
    alert(`Import failed: ${err.data?.message || err.message || 'Unknown error'}`)
  } finally {
    importing.value = false
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/cms/auth/logout', { method: 'POST' })
    await navigateTo('/cms/login')
  } catch (err) {
    console.error('Logout failed:', err)
  }
}

const deleteArticle = async (article: any) => {
  if (!confirm(`Are you sure you want to delete "${article.title}"?`)) {
    return
  }

  try {
    await $fetch(`/api/cms/articles/${article.id}`, { method: 'DELETE' })
    refresh()
  } catch (err) {
    alert('Failed to delete article')
    console.error('Delete failed:', err)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
