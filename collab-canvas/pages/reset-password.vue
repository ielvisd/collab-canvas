<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <UCard>
        <div class="p-6">
          <UForm :schema="formSchema" :state="formState" @submit="onSubmit" class="space-y-6">
            <UFormField label="New Password" name="password">
              <UInput 
                v-model="formState.password" 
                type="password" 
                placeholder="Enter your new password"
                :disabled="loading"
              />
            </UFormField>
            
            <UFormField label="Confirm Password" name="confirmPassword">
              <UInput 
                v-model="formState.confirmPassword" 
                type="password" 
                placeholder="Confirm your new password"
                :disabled="loading"
              />
            </UFormField>

            <div>
              <UButton 
                type="submit" 
                :loading="loading"
                :disabled="loading"
                class="w-full"
              >
                {{ loading ? 'Updating password...' : 'Update Password' }}
              </UButton>
            </div>
          </UForm>

          <div v-if="error" class="mt-4">
            <UAlert 
              :title="error" 
              color="red" 
              variant="soft"
            />
          </div>

          <div v-if="success" class="mt-4">
            <UAlert 
              title="Password updated successfully!" 
              description="You can now sign in with your new password."
              color="green" 
              variant="soft"
            />
            <div class="mt-4 text-center">
              <UButton @click="goToLogin" color="primary" variant="outline">
                Go to Login
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <div class="text-center">
        <p class="text-sm text-gray-600">
          Remember your password? 
          <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
            Sign in here
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { z } from 'zod'

// Define page meta
definePageMeta({
  layout: false
})

// Form schema for validation
const formSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Form state
const formState = reactive({
  password: '',
  confirmPassword: ''
})

// Component state
const loading = ref(false)
const error = ref(null)
const success = ref(false)

// Get access token from URL
const route = useRoute()
const accessToken = route.query.access_token

// Check if we have a valid access token
onMounted(() => {
  if (!accessToken) {
    error.value = 'Invalid or missing reset token. Please request a new password reset.'
  }
})

// Form submit handler
const onSubmit = async (event) => {
  if (!accessToken) {
    error.value = 'Invalid or missing reset token. Please request a new password reset.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const supabase = useSupabase()
    
    // Update password using the access token
    const { error: updateError } = await supabase.auth.updateUser({
      password: formState.password
    })

    if (updateError) {
      throw updateError
    }

    success.value = true
    formState.password = ''
    formState.confirmPassword = ''

  } catch (err) {
    error.value = err.message || 'Failed to update password. Please try again.'
    console.error('Password update error:', err)
  } finally {
    loading.value = false
  }
}

// Navigate to login
const goToLogin = () => {
  navigateTo('/login')
}
</script>
