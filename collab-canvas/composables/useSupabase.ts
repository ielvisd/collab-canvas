export const useSupabase = () => {
  const { $supabase } = useNuxtApp()
  
  if (!$supabase) {
    throw new Error('Supabase client not available. Make sure the Supabase plugin is properly configured.')
  }
  
  return $supabase
}

