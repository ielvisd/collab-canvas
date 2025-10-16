export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) {
    return
  }

  // Use a simpler approach that's more reliable
  try {
    const { isAuthenticated, loading } = useAuth()
    
    // If auth is already loaded and user is authenticated, redirect from login
    if (!loading.value && isAuthenticated.value && to.path === '/login') {
      return navigateTo('/canvas')
    }
    
    // If auth is still loading, wait a bit and check again
    if (loading.value && to.path === '/login') {
      setTimeout(() => {
        try {
          const { isAuthenticated: authCheck, loading: loadingCheck } = useAuth()
          if (!loadingCheck.value && authCheck.value) {
            navigateTo('/canvas')
          }
        } catch (error) {
          console.error('Auth check error:', error)
          // Don't redirect on error for guest middleware
        }
      }, 500)
    }
  } catch (error) {
    console.error('Guest middleware error:', error)
    // If there's an error, don't redirect - let the user stay on the page
  }
})
