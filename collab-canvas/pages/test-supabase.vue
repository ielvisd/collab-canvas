<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Supabase Connection Test</h1>
    
    <div v-if="loading" class="text-blue-600">
      Testing Supabase connection...
    </div>
    
    <div v-else-if="error" class="text-red-600">
      <p class="font-semibold">Connection Error:</p>
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="success" class="text-green-600">
      <p class="font-semibold">✅ Supabase Connected Successfully!</p>
      <p>URL: {{ supabaseUrl }}</p>
      <p>Key Type: {{ keyType }}</p>
      <p>Key: {{ keyValue ? 'Set' : 'Not set' }}</p>
      <p v-if="supabaseSecretKey" class="text-sm text-gray-600">Secret Key: Set (for server-side operations)</p>
    </div>
    
    <div class="mt-4">
      <UButton @click="testConnection" :loading="loading">
        Test Connection
      </UButton>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
const error = ref(null)
const success = ref(false)

const config = useRuntimeConfig()
const supabaseUrl = config.public.supabaseUrl
const supabasePublishableKey = config.public.supabasePublishableKey
const supabaseAnonKey = config.public.supabaseAnonKey
const supabaseSecretKey = config.public.supabaseSecretKey

// Determine which key type is being used
const keyType = supabasePublishableKey ? 'Publishable (New)' : supabaseAnonKey ? 'Anon (Legacy)' : 'None'
const keyValue = supabasePublishableKey || supabaseAnonKey

const testConnection = async () => {
  loading.value = true
  error.value = null
  success.value = false
  
  try {
    if (!supabaseUrl || !keyValue) {
      throw new Error('Missing Supabase environment variables. Please check your .env file.')
    }
    
    const { $supabase } = useNuxtApp()
    
    if (!$supabase) {
      throw new Error('Supabase client not available')
    }
    
    // Test basic connection
    const { data, error: testError } = await $supabase
      .from('canvas_objects')
      .select('count')
      .limit(1)
    
    if (testError) {
      throw testError
    }
    
    success.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Auto-test on mount
onMounted(() => {
  testConnection()
})
</script>
