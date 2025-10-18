<template>
  <div class="presence-sidebar w-full h-full">
    <!-- Connection Status -->
    <div class="flex items-center justify-end gap-2 mb-4">
      <div 
        class="w-2 h-2 rounded-full"
        :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
      ></div>
      <span class="text-xs text-pink-300">
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>
    
    <div class="presence-users">
      <div v-if="onlineUsers.length === 0" class="text-gray-300 text-xs sm:text-sm py-4">
        No other users online
        <div class="mt-2 text-xs text-gray-400 hidden sm:block">
          Debug: {{ onlineUsers.length }} users in array
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
  </div>
</template>

<script setup lang="ts">
const { onlineUsers, isConnected, error, refreshPresence, retryPresence, debugPresence } = usePresence()
</script>

<style scoped>
.presence-sidebar {
  overflow-y: auto;
  height: 100%;
  background-color: transparent; /* Let slideover handle background */
}

.presence-users {
  flex: 1;
  overflow-y: auto;
}
</style>
