export default defineNuxtRouteMiddleware((to) => {
  // Skip auth check on server side during build
  if (process.server) return

  // Skip if already on login page
  if (to.path === '/cms/login') return

  const token = useCookie('cms-token')

  // Check if accessing CMS routes (except login)
  if (to.path.startsWith('/cms')) {
    if (!token.value) {
      return navigateTo('/cms/login')
    }
  }
})
