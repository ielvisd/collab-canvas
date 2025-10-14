import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl
  // Try new publishable key first, fallback to legacy anon key
  const supabaseKey = config.public.supabasePublishableKey || config.public.supabaseAnonKey

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY')
    return
  }

  const supabase = createClient(supabaseUrl as string, supabaseKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return {
    provide: {
      supabase
    }
  }
})
