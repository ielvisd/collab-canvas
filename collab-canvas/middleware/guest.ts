export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) {
    return
  }

  const { isAuthenticated, loading } = useAuth()

  // Wait for auth to initialize
  if (loading.value) {
    return
  }

  // If authenticated, redirect to canvas
  if (isAuthenticated.value) {
    return navigateTo('/canvas')
  }
})
