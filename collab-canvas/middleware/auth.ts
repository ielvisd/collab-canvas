export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) {
    return
  }

  // Use nextTick to ensure the composable is available
  nextTick(() => {
    const { isAuthenticated, loading } = useAuth()
    
    // Check auth state after a short delay to ensure it's initialized
    setTimeout(() => {
      if (!loading.value && !isAuthenticated.value) {
        // Only redirect if we're not already on the login page
        if (to.path !== '/login') {
          navigateTo('/login')
        }
      }
    }, 100)
  })
})
