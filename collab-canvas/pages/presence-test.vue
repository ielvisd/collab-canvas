<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">🔗 Presence System Test</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Debug Info -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">🐛 Debug Information</h2>
          </template>
          
          <div class="space-y-4">
            <div>
              <strong>User ID:</strong> {{ user?.id || 'Not authenticated' }}
            </div>
            <div>
              <strong>Email:</strong> {{ user?.email || 'Not available' }}
            </div>
            <div>
              <strong>Connected:</strong> 
              <span :class="isConnected ? 'text-green-600' : 'text-red-600'">
                {{ isConnected ? 'Yes' : 'No' }}
              </span>
            </div>
            <div>
              <strong>Online Users:</strong> {{ onlineUsers.length }}
            </div>
            <div v-if="error" class="text-red-600">
              <strong>Error:</strong> {{ error }}
            </div>
          </div>
          
          <div class="mt-6 space-x-2">
            <UButton @click="refreshPresence" :disabled="!isConnected" size="sm">
              Refresh Presence
            </UButton>
            <UButton @click="retryPresence" size="sm" variant="outline">
              Retry Connection
            </UButton>
            <UButton @click="testPresence" size="sm" variant="outline">
              Test Fake User
            </UButton>
            <UButton @click="handleTestSupabase" size="sm" variant="outline">
              Test Supabase
            </UButton>
            <UButton @click="debugPresence" size="sm" variant="outline">
              Debug Console
            </UButton>
          </div>
        </UCard>
        
        <!-- Online Users -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">👥 Online Users ({{ onlineUsers.length }})</h2>
          </template>
          
          <div v-if="onlineUsers.length === 0" class="text-gray-500 py-8 text-center">
            No other users online
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="user in onlineUsers" 
              :key="user.id"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                :style="{ backgroundColor: user.color }"
              >
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="font-medium">{{ user.name }}</div>
                <div class="text-sm text-gray-500">Online now</div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
      
      <!-- Instructions -->
      <UCard class="mt-6">
        <template #header>
          <h2 class="text-xl font-semibold">📋 Testing Instructions</h2>
        </template>
        
        <div class="space-y-4">
          <ol class="list-decimal list-inside space-y-2">
            <li>Open this page in multiple browser tabs/windows</li>
            <li>Log in with different accounts in each tab</li>
            <li>Check if other users appear in the "Online Users" section</li>
            <li>Use the debug buttons to test the presence system</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
          
          <div class="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-semibold text-blue-900">Console Commands:</h3>
            <div class="mt-2 font-mono text-sm space-y-1">
              <div><code>debugPresence()</code> - Show current presence state</div>
              <div><code>testPresence()</code> - Test with fake user</div>
              <div><code>refreshPresence()</code> - Refresh presence state</div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Define page meta
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { 
  onlineUsers, 
  isConnected, 
  error, 
  refreshPresence, 
  testPresence, 
  testSupabaseConnection,
  debugPresence,
  retryPresence
} = usePresence()

// Wrapper function for Supabase test
const handleTestSupabase = async () => {
  await testSupabaseConnection()
}
</script>
