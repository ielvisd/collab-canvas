<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your CollabCanvas account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
            sign in to your existing account
          </NuxtLink>
        </p>
      </div>
      
      <UCard class="mt-8">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900">Get started for free</h3>
        </template>

        <UForm 
          :state="formState" 
          :schema="schema" 
          @submit="handleSubmit"
          class="space-y-6"
        >
          <UFormField label="Full name" name="fullName">
            <UInput
              v-model="formState.fullName"
              type="text"
              autocomplete="name"
              placeholder="Enter your full name"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Email address" name="email" required>
            <UInput
              v-model="formState.email"
              type="email"
              autocomplete="email"
              placeholder="Enter your email"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput
              v-model="formState.password"
              type="password"
              autocomplete="new-password"
              placeholder="Create a password"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Confirm password" name="confirmPassword" required>
            <UInput
              v-model="formState.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Confirm your password"
              :disabled="loading"
            />
          </UFormField>

          <div class="flex items-center">
            <UCheckbox 
              v-model="formState.agreeToTerms" 
              :disabled="loading"
              required
            />
            <div class="ml-2 text-sm text-gray-600">
              I agree to the
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>
              and
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </div>
          </div>

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
              {{ loading ? 'Creating account...' : 'Create account' }}
            </UButton>
          </div>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div class="mt-6">
              <UButton
                @click="handleMagicLink"
                :loading="magicLinkLoading"
                :disabled="loading || magicLinkLoading"
                variant="outline"
                class="w-full"
                size="lg"
              >
                <UIcon name="i-heroicons-envelope" class="mr-2" />
                {{ magicLinkLoading ? 'Sending magic link...' : 'Sign up with magic link' }}
              </UButton>
            </div>
          </div>
        </UForm>
      </UCard>

      <div class="text-center">
        <p class="text-sm text-gray-600">
          Already have an account?
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
  fullName: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Form state
const formState = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

// Auth composable
const { signUp, signInWithMagicLink, loading, error } = useAuth()

// Local state
const magicLinkLoading = ref(false)
const successMessage = ref('')

// Handle form submission
const handleSubmit = async (event) => {
  const { email, password, fullName } = event.data
  
  const { error: signUpError } = await signUp(email, password)
  
  if (signUpError) {
    // Error is handled by the composable
    return
  }
  
  successMessage.value = 'Account created! Please check your email to verify your account.'
}

// Handle magic link
const handleMagicLink = async () => {
  if (!formState.email) {
    error.value = 'Please enter your email address first'
    return
  }
  
  magicLinkLoading.value = true
  successMessage.value = ''
  
  const { error: magicLinkError } = await signInWithMagicLink(formState.email)
  
  if (magicLinkError) {
    // Error is handled by the composable
    magicLinkLoading.value = false
    return
  }
  
  successMessage.value = 'Check your email for the magic link!'
  magicLinkLoading.value = false
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
