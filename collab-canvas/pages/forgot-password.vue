<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      <UCard class="mt-8">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900">Password reset</h3>
        </template>

        <UForm 
          :state="formState" 
          :schema="schema" 
          @submit="handleSubmit"
          class="space-y-6"
        >
          <UFormField label="Email address" name="email" required>
            <UInput
              v-model="formState.email"
              type="email"
              autocomplete="email"
              placeholder="Enter your email"
              :disabled="loading"
            />
          </UFormField>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-red-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
            <div class="flex">
              <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-green-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">Success</h3>
                <div class="mt-2 text-sm text-green-700">
                  {{ successMessage }}
                </div>
              </div>
            </div>
          </div>

          <div>
            <UButton
              type="submit"
              :loading="loading"
              :disabled="loading"
              class="w-full"
              size="lg"
            >
              {{ loading ? 'Sending reset link...' : 'Send reset link' }}
            </UButton>
          </div>
        </UForm>
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
import { z } from 'zod'

// Define page meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Form validation schema
const schema = z.object({
  email: z.string().email('Please enter a valid email address')
})

// Form state
const formState = reactive({
  email: ''
})

// Auth composable
const { resetPassword, loading, error } = useAuth()

// Local state
const successMessage = ref('')

// Handle form submission
const handleSubmit = async (event) => {
  const { email } = event.data
  
  const { error: resetError } = await resetPassword(email)
  
  if (resetError) {
    // Error is handled by the composable
    return
  }
  
  successMessage.value = 'Password reset link sent! Check your email for instructions.'
}

// Clear error when form changes
watch(formState, () => {
  if (error.value) {
    error.value = null
  }
  if (successMessage.value) {
    successMessage.value = ''
  }
})
</script>
