export default defineNuxtRouteMiddleware((to) => {
  // Skip auth check on server side during build
  if (process.server) return

  const { $router } = useNuxtApp()
  const token = useCookie('cms-token', {
    default: () => null,
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  })

  // Check if accessing CMS routes
  if (to.path.startsWith('/cms')) {
    if (!token.value) {
      return navigateTo('/cms/login')
    }

    // Verify token validity (you can enhance this with JWT verification)
    try {
      // Simple token validation - enhance this in production
      if (!token.value || token.value === 'invalid') {
        throw new Error('Invalid token')
      }
    } catch (error) {
      // Clear invalid token
      token.value = null
      return navigateTo('/cms/login')
    }
  }
})
