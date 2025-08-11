<script setup lang="ts">
const config = useRuntimeConfig()
const logoSrc = computed(() => config.public.devLogo || '/logo.png')
const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
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
            <!-- Desktop Navigation -->
            <div class="hidden sm:flex space-x-4">
              <nuxt-link class="nav-link" to="/">Home</nuxt-link>
              <nuxt-link class="nav-link" to="/posts">Blog</nuxt-link>
              <nuxt-link class="nav-link" to="/about">About</nuxt-link>
              <nuxt-link class="nav-link" to="/projects">Projects</nuxt-link>
            </div>
            
            <!-- Mobile Menu Button -->
            <button
              @click="toggleMobileMenu"
              class="sm:hidden mobile-menu-button"
              aria-label="Toggle mobile menu"
            >
              <svg v-if="!mobileMenuOpen" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <ColorSwitcher/>
          </div>
        </div>
        
        <!-- Mobile Navigation Menu -->
        <div v-if="mobileMenuOpen" class="sm:hidden">
          <div class="pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <nuxt-link 
              class="mobile-nav-link" 
              to="/" 
              @click="closeMobileMenu"
            >
              Home
            </nuxt-link>
            <nuxt-link 
              class="mobile-nav-link" 
              to="/posts" 
              @click="closeMobileMenu"
            >
              Blog
            </nuxt-link>
            <nuxt-link 
              class="mobile-nav-link" 
              to="/about" 
              @click="closeMobileMenu"
            >
              About
            </nuxt-link>
            <nuxt-link 
              class="mobile-nav-link" 
              to="/projects" 
              @click="closeMobileMenu"
            >
              Projects
            </nuxt-link>
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

/* Mobile navigation links */
.mobile-nav-link {
  display: block;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.5rem;
  color: #374151;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.mobile-nav-link:hover {
  color: #2563eb;
  background-color: #f9fafb;
}

.dark .mobile-nav-link {
  color: #e5e7eb;
}

.dark .mobile-nav-link:hover {
  color: #60a5fa;
  background-color: #374151;
}

.mobile-nav-link.router-link-active {
  color: #2563eb;
  background-color: #eff6ff;
  border-right: 3px solid #2563eb;
}

.dark .mobile-nav-link.router-link-active {
  color: #60a5fa;
  background-color: #1e3a8a;
  border-right: 3px solid #60a5fa;
}
</style>
