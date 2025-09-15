<template>
  <div class="wysiwyg-editor">
    <div v-if="editor" class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <!-- Toolbar -->
      <div class="toolbar bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 p-3 flex flex-wrap gap-2">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('bold') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Bold
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('italic') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Italic
        </button>
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('strike') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Strike
        </button>

        <div class="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('heading', { level: 1 }) }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          H1
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('heading', { level: 2 }) }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          H2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('heading', { level: 3 }) }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          H3
        </button>

        <div class="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('bulletList') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Bullet List
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('orderedList') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Ordered List
        </button>

        <div class="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          @click="addLink"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Link
        </button>
        <button
          @click="addImage"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Image
        </button>

        <div class="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('codeBlock') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Code Block
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('blockquote') }"
          class="px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Quote
        </button>
      </div>

      <!-- Editor Content -->
      <div
        class="prose prose-lg dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none"
        ref="editorElement"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editorElement = ref<HTMLElement>()
const editor = ref<Editor>()

onMounted(() => {
  editor.value = new Editor({
    element: editorElement.value,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: props.modelValue,
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none',
      },
    },
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue)
  }
})

const addLink = () => {
  const url = window.prompt('Enter URL:')
  if (url && editor.value) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

const addImage = () => {
  const url = window.prompt('Enter image URL:')
  if (url && editor.value) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}
</script>

<style scoped>
.toolbar button {
  @apply text-gray-700 dark:text-gray-300;
}

.toolbar button:hover {
  @apply text-gray-900 dark:text-gray-100;
}

:deep(.ProseMirror) {
  outline: none !important;
}

:deep(.ProseMirror h1) {
  @apply text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100;
}

:deep(.ProseMirror h2) {
  @apply text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100;
}

:deep(.ProseMirror h3) {
  @apply text-xl font-bold mb-2 text-gray-900 dark:text-gray-100;
}

:deep(.ProseMirror p) {
  @apply mb-3 text-gray-800 dark:text-gray-200;
}

:deep(.ProseMirror ul), :deep(.ProseMirror ol) {
  @apply mb-3 pl-6;
}

:deep(.ProseMirror blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-3;
}

:deep(.ProseMirror pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-3 overflow-x-auto;
}

:deep(.ProseMirror code) {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm;
}
</style>

