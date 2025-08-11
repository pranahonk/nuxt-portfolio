<script setup lang="ts">
const config = useRuntimeConfig()
const logoSrc = computed(() => config.public.devLogo || '/logo.png')
</script>

<template>
  <div class="dark:bg-gray-900">
    <div class="wrapper">
      <nav class="py-4 sm:py-6 px-4 sm:px-6">
        <div class="flex justify-between items-center">
          <div class="logo flex-shrink-0">
            <nuxt-link to="/" class="block">
              <NuxtImg
                class="h-12 w-auto sm:h-16"
                :src="logoSrc"
                alt="Logo"
                width="96"
                height="96"
                loading="lazy"
                sizes="(max-width: 640px) 48px, 64px"
              />
            </nuxt-link>
          </div>

          <div class="flex items-center space-x-2 sm:space-x-4">
            <div class="hidden sm:flex space-x-4">
              <nuxt-link class="nav-link" to="/">Home</nuxt-link>
              <nuxt-link class="nav-link" to="/posts">Blog</nuxt-link>
              <nuxt-link class="nav-link" to="/about">About</nuxt-link>
              <nuxt-link class="nav-link" to="/projects">Projects</nuxt-link>
            </div>
            <ColorSwitcher/>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>


<style scoped>
/* Navigation links */
.nav-link {
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.5rem;
  color: #374151;
  margin: 0 0.5rem;
  padding: 0.5rem 0.25rem;
  transition: color 0.2s ease-in-out;
}

@media (min-width: 640px) {
  .nav-link {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
}

.dark .nav-link {
  color: #e5e7eb;
}

.nav-link:hover {
  color: #2563eb;
}

.dark .nav-link:hover {
  color: #60a5fa;
}

/* Logo container */
.logo {
  max-width: 100%;
  height: auto;
}

/* Mobile menu button (if added later) */
.mobile-menu-button {
  display: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  color: #6b7280;
  transition: color 0.2s ease-in-out;
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.mobile-menu-button:hover {
  color: #4b5563;
}

.dark .mobile-menu-button {
  color: #9ca3af;
}

.dark .mobile-menu-button:hover {
  color: #d1d5db;
}

.mobile-menu-button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, #3b82f6);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

@media (max-width: 639px) {
  .mobile-menu-button {
    display: block;
  }
}
</style>
