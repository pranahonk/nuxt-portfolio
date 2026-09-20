export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp.$router
  let prevPath: string | null = null

  router.beforeEach((to, from) => {
    if (from.path && from.path !== to.path) prevPath = from.path
    return true
  })

  nuxtApp.provide('prevPath', () => prevPath)
})