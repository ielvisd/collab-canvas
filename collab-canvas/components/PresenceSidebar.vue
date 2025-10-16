<template>
  <UCard class="presence-sidebar w-full sm:w-64 h-full">
    <template #header>
      <div class="presence-header">
        <h3 class="text-base sm:text-lg font-semibold text-white">Online Users</h3>
        <div class="flex items-center gap-1 sm:gap-2">
          <div 
            class="w-2 h-2 rounded-full"
            :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <span class="text-xs sm:text-sm text-white">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
      </div>
    </template>
    
    <div class="presence-users">
      <div v-if="onlineUsers.length === 0" class="text-gray-300 text-xs sm:text-sm py-4">
        No other users online
        <div class="mt-2 text-xs text-gray-400 hidden sm:block">
          Debug: {{ onlineUsers.length }} users in array
        </div>
        <div class="mt-2 text-xs text-gray-400 hidden sm:block space-y-1">
          <div>
            <UButton size="xs" color="neutral" @click="debugPresence">Debug Presence</UButton>
          </div>
          <div>
            <UButton size="xs" color="primary" @click="testPresence">Test Fake User</UButton>
          </div>
          <div>
            <UButton size="xs" color="success" @click="testRealPresence">Test Real Users</UButton>
          </div>
          <div>
            <UButton size="xs" color="warning" @click="retryPresence">Retry Connection</UButton>
          </div>
        </div>
      </div>
      
      <div v-else class="space-y-1 sm:space-y-2">
        <div 
          v-for="user in onlineUsers" 
          :key="user.id"
          class="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <!-- User Avatar -->
          <div 
            class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium"
            :style="{ backgroundColor: user.color }"
          >
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
          
          <!-- User Info -->
          <div class="flex-1 min-w-0">
            <div class="text-xs sm:text-sm font-medium text-white truncate">
              {{ user.name }}
            </div>
            <div class="text-xs text-gray-300 hidden sm:block">
              Online now
            </div>
          </div>
          
          <!-- Online Indicator -->
          <div 
            class="w-2 h-2 rounded-full bg-pink-500"
            title="Online"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500" />
        <span class="text-sm text-red-700">{{ error }}</span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// Import the composable
const { onlineUsers, isConnected, error, refreshPresence, retryPresence, debugPresence, testPresence, testRealPresence } = usePresence()
</script>

<style scoped>
.presence-sidebar {
  border-right: 1px solid #ff1493;
  overflow-y: auto;
  height: 100%;
  background-color: #2a2a2a;
}

.presence-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ff1493;
}

.presence-users {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 640px) {
  .presence-sidebar {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .presence-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
  }
}
</style>
