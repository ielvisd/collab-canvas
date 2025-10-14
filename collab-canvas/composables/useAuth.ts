import type { User, Session, AuthError } from '@supabase/supabase-js'

export const useAuth = () => {
  // Only run on client side
  if (process.server) {
    return {
      user: ref(null),
      session: ref(null),
      loading: ref(true),
      error: ref(null),
      isAuthenticated: ref(false),
      userDisplayName: ref(''),
      userAvatarUrl: ref(null),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signInWithMagicLink: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPassword: () => Promise.resolve({ data: null, error: null }),
      initAuth: () => Promise.resolve()
    }
  }

  const supabase = useSupabase()
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let authSubscription: any = null

  // Initialize auth state
  const initAuth = async () => {
    try {
      loading.value = true
      error.value = null

      // Get initial session
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      session.value = initialSession
      user.value = initialSession?.user ?? null

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          session.value = newSession
          user.value = newSession?.user ?? null
          loading.value = false

          // Handle different auth events
          if (event === 'SIGNED_OUT') {
            await navigateTo('/login')
          } else if (event === 'SIGNED_IN' && newSession) {
            await navigateTo('/canvas')
          }
        }
      )

      // Store subscription for cleanup
      authSubscription = subscription

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication initialization failed'
      console.error('Auth init error:', err)
    } finally {
      loading.value = false
    }
  }

  // Cleanup subscription on unmount
  if (process.client) {
    onUnmounted(() => {
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    })
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/canvas`
        }
      })

      if (signUpError) {
        throw signUpError
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { data: null, error: authError }
    } finally {
      loading.value = false
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        throw signInError
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { data: null, error: authError }
    } finally {
      loading.value = false
    }
  }

  // Sign in with magic link
  const signInWithMagicLink = async (email: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/canvas`
        }
      })

      if (magicLinkError) {
        throw magicLinkError
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { data: null, error: authError }
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      loading.value = true
      error.value = null

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      // Clear local state
      user.value = null
      session.value = null

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { error: authError }
    } finally {
      loading.value = false
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) {
        throw resetError
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { data: null, error: authError }
    } finally {
      loading.value = false
    }
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value)

  // Get user display name
  const userDisplayName = computed(() => {
    if (!user.value) return ''
    return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'User'
  })

  // Get user avatar URL
  const userAvatarUrl = computed(() => {
    if (!user.value) return null
    return user.value.user_metadata?.avatar_url || null
  })

  // Initialize auth on composable creation
  initAuth()

  return {
    // State
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    isAuthenticated,
    userDisplayName,
    userAvatarUrl,
    
    // Methods
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
    initAuth
  }
}
