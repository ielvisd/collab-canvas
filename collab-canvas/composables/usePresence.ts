import type { Ref } from 'vue'
import { watch } from 'vue'

export interface OnlineUser {
  id: string
  name: string
  avatar?: string
  color: string
  lastSeen: Date
  cursor?: {
    x: number
    y: number
    timestamp: number
  }
}

export interface PresenceState {
  onlineUsers: Ref<OnlineUser[]>
  isConnected: Ref<boolean>
  error: Ref<string | null>
}

export interface PresenceActions {
  startPresence: () => Promise<void>
  stopPresence: () => void
  updateUserStatus: (status: any) => void
}

// Generate a random color for user cursors/avatars
const generateUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length] || '#FF6B6B'
}

// Singleton instance
let presenceInstance: any = null
let autoStartInitialized = false
let isInitializing = false

export const usePresence = () => {
  // Return existing instance if it exists
  if (presenceInstance) {
    return presenceInstance
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Return a temporary instance while initializing
    return {
      onlineUsers: ref([]),
      isConnected: ref(false),
      error: ref('Initializing...'),
      startPresence: () => Promise.resolve(),
      stopPresence: () => {},
      updateUserStatus: () => {},
      refreshPresence: () => {},
      testPresence: () => {},
      debugPresence: () => {},
      testSupabaseConnection: () => Promise.resolve(false),
      retryPresence: () => Promise.resolve(),
      forceSetConnected: () => {},
      checkConnectionHealth: () => {},
      cleanup: () => {}
    }
  }

  isInitializing = true

  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  
  // State
  const onlineUsers = ref<OnlineUser[]>([])
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  
  // Presence channel
  let presenceChannel: any = null
  let retryTimeout: any = null
  let retryCount = 0
  const maxRetries = 5
  let isConnecting = false
  let connectionTimeout: any = null
  let lastConnectionAttempt = 0
  const minConnectionInterval = 2000 // Minimum 2 seconds between connection attempts
  
  // Get canvas ID (same as other composables)
  const getCanvasId = (): string => {
    return '550e8400-e29b-41d4-a716-446655440000'
  }
  
  // Start presence tracking
  const startPresence = async () => {
    if (!user.value) {
      error.value = 'User not authenticated'
      console.error('❌ No user authenticated for presence tracking')
      return
    }
    
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      return
    }
    
    // If already connected, don't start again
    if (isConnected.value && presenceChannel) {
      return
    }
    
    // Rate limiting: prevent too frequent connection attempts
    const now = Date.now()
    if (now - lastConnectionAttempt < minConnectionInterval) {
      return
    }
    lastConnectionAttempt = now
    
    // Clean up any existing connection
    if (presenceChannel) {
      presenceChannel.unsubscribe()
      presenceChannel = null
    }
    
    isConnecting = true
    error.value = null
    
    // Wait a bit for auth state to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      // Create presence channel
      const channelName = `canvas-presence-${getCanvasId()}`
      
      presenceChannel = $supabase.channel(channelName, {
        config: {
          presence: {
            key: user.value.id
          }
        }
      })
      
      // Track presence changes
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          // If we're receiving presence events, we're connected
          if (!isConnected.value) {
            isConnected.value = true
            error.value = null
          }
          updateOnlineUsers(state)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string, newPresences: any[] }) => {
          // If we're receiving presence events, we're connected
          if (!isConnected.value) {
            isConnected.value = true
            error.value = null
          }
          updateOnlineUsers(presenceChannel.presenceState())
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string, leftPresences: any[] }) => {
          // If we're receiving presence events, we're connected
          if (!isConnected.value) {
            isConnected.value = true
            error.value = null
          }
          updateOnlineUsers(presenceChannel.presenceState())
        })
      
      // Subscribe to channel
      const response = await presenceChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          isConnected.value = true
          error.value = null
          isConnecting = false
          
          // Clear any existing connection timeout
          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
            connectionTimeout = null
          }
          
          // Get user display name
          const userName = user.value!.user_metadata?.full_name || 
                          user.value!.user_metadata?.name || 
                          user.value!.email?.split('@')[0] || 
                          'Anonymous'
          
          try {
            // Track this user as online
            await presenceChannel.track({
              user_id: user.value!.id,
              user_name: userName,
              user_avatar: user.value!.user_metadata?.avatar_url,
              last_seen: new Date().toISOString(),
              online: true
            })
            
            // Ensure we're marked as connected after successful tracking
            isConnected.value = true
          } catch (trackError) {
            console.error('❌ Error tracking presence:', trackError)
            error.value = 'Failed to track user presence'
            isConnecting = false
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Presence connection failed')
          error.value = 'Failed to connect to presence channel'
          isConnected.value = false
          isConnecting = false
          scheduleRetry()
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Presence connection timed out')
          error.value = 'Presence channel connection timed out'
          isConnected.value = false
          isConnecting = false
          scheduleRetry()
        } else if (status === 'CLOSED') {
          console.error('❌ Presence connection closed')
          error.value = 'Presence channel connection closed'
          isConnected.value = false
          isConnecting = false
          scheduleRetry()
        } else {
          isConnecting = false
        }
      })
      
      // Set a timeout to detect if subscription is hanging
      connectionTimeout = setTimeout(() => {
        if (!isConnected.value && isConnecting) {
          console.error('❌ Presence connection timeout')
          error.value = 'Presence subscription timed out'
          isConnecting = false
          scheduleRetry()
        }
      }, 15000)
      
    } catch (err) {
      console.error('❌ Error starting presence:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error'
      isConnecting = false
      scheduleRetry()
    }
  }
  
  // Schedule retry with exponential backoff
  const scheduleRetry = () => {
    if (retryCount >= maxRetries) {
      console.error('❌ Max retry attempts reached for presence connection')
      error.value = 'Failed to connect to presence after multiple attempts'
      isConnecting = false
      return
    }
    
    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
    
    retryCount++
    const delay = Math.min(5000 * Math.pow(2, retryCount - 1), 60000) // Exponential backoff, min 5s, max 60s
    
    retryTimeout = setTimeout(async () => {
      if (!isConnecting && !isConnected.value) {
        await startPresence()
      }
    }, delay)
  }
  
  // Stop presence tracking
  const stopPresence = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
    
    if (connectionTimeout) {
      clearTimeout(connectionTimeout)
      connectionTimeout = null
    }
    
    if (presenceChannel) {
      presenceChannel.unsubscribe()
      presenceChannel = null
    }
    
    isConnected.value = false
    isConnecting = false
    onlineUsers.value = []
    retryCount = 0
    error.value = null
  }
  
  // Update online users list
  const updateOnlineUsers = (presenceState: any) => {
    const users: OnlineUser[] = []
    
    // Handle different presence state formats
    if (presenceState && typeof presenceState === 'object') {
      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        if (Array.isArray(presences)) {
          presences.forEach((presence: any) => {
            
            if (presence && presence.online && presence.user_id !== user.value?.id) {
              const onlineUser: OnlineUser = {
                id: presence.user_id,
                name: presence.user_name || 'Anonymous',
                avatar: presence.user_avatar,
                color: generateUserColor(presence.user_id),
                lastSeen: new Date(presence.last_seen),
                cursor: presence.cursor ? {
                  x: presence.cursor.x,
                  y: presence.cursor.y,
                  timestamp: presence.cursor.timestamp
                } : undefined
              }
              users.push(onlineUser)
            }
          })
        } else if (presences && typeof presences === 'object' && presences.online && presences.user_id !== user.value?.id) {
          const onlineUser: OnlineUser = {
            id: presences.user_id,
            name: presences.user_name || 'Anonymous',
            avatar: presences.user_avatar,
            color: generateUserColor(presences.user_id),
            lastSeen: new Date(presences.last_seen),
            cursor: presences.cursor ? {
              x: presences.cursor.x,
              y: presences.cursor.y,
              timestamp: presences.cursor.timestamp
            } : undefined
          }
          users.push(onlineUser)
        }
      })
    }
    
    onlineUsers.value = users
  }
  
  // Update user status (for cursor tracking, etc.)
  const updateUserStatus = async (status: any) => {
    if (presenceChannel && isConnected.value) {
      const userName = user.value!.user_metadata?.full_name || 
                      user.value!.user_metadata?.name || 
                      user.value!.email?.split('@')[0] || 
                      'Anonymous'
      
      await presenceChannel.track({
        user_id: user.value!.id,
        user_name: userName,
        user_avatar: user.value!.user_metadata?.avatar_url,
        last_seen: new Date().toISOString(),
        online: true,
        ...status
      })
    }
  }
  
  // Force refresh presence state
  const refreshPresence = () => {
    if (presenceChannel && isConnected.value) {
      const state = presenceChannel.presenceState()
      updateOnlineUsers(state)
    }
  }
  
  // Test function to manually add a fake user for testing
  const testPresence = () => {
    const fakePresenceState = {
      'test-user-123': [{
        user_id: 'test-user-123',
        user_name: 'Test User',
        user_avatar: null,
        last_seen: new Date().toISOString(),
        online: true
      }]
    }
    updateOnlineUsers(fakePresenceState)
  }
  
  // Debug function for console access
  const debugPresence = () => {
    console.log('🐛 Debug Presence State:')
    console.log('Current user:', user.value?.id)
    console.log('Online users:', onlineUsers.value.length)
    console.log('Is connected:', isConnected.value)
    console.log('Error:', error.value)
    if (presenceChannel) {
      console.log('Presence channel state:', presenceChannel.presenceState())
    }
  }
  
  // Force set connected state (for debugging)
  const forceSetConnected = (connected: boolean) => {
    isConnected.value = connected
  }
  
  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await $supabase.from('canvas_objects').select('count').limit(1)
      if (error) {
        console.error('❌ Supabase connection error:', error)
        return false
      } else {
        console.log('✅ Supabase connection successful')
        return true
      }
    } catch (err) {
      console.error('❌ Supabase connection test failed:', err)
      return false
    }
  }
  
  // Retry presence connection
  const retryPresence = async () => {
    console.log('🔄 Manual presence retry requested...')
    stopPresence()
    retryCount = 0 // Reset retry count for manual retry
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    await startPresence()
  }
  
  // Connection health check
  const checkConnectionHealth = () => {
    if (presenceChannel && isConnected.value && !isConnecting) {
      // Test if channel is still responsive
      try {
        const state = presenceChannel.presenceState()
        if (!state) {
          console.warn('⚠️ Presence channel appears unresponsive, will reconnect on next activity...')
          // Don't immediately reconnect, just mark as disconnected
          isConnected.value = false
        }
      } catch (err) {
        console.warn('⚠️ Presence channel health check failed, will reconnect on next activity...', err)
        // Don't immediately reconnect, just mark as disconnected
        isConnected.value = false
      }
    }
  }

  // Auto-start presence when user becomes authenticated
  const autoStartPresence = () => {
    if (process.client && !autoStartInitialized) {
      // Watch for user authentication changes
      watch(user, async (newUser, oldUser) => {
        if (newUser && !oldUser) {
          // User just logged in
          await startPresence()
        } else if (!newUser && oldUser) {
          // User just logged out
          stopPresence()
        }
      }, { immediate: true })
      
      // Periodic health check every 60 seconds
      setInterval(checkConnectionHealth, 60000)
      
      autoStartInitialized = true
    }
  }
  
  // Initialize auto-start (only once)
  if (process.client) {
    autoStartPresence()
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    stopPresence()
  })
  
  // Create the instance object
  const instance = {
    // State
    onlineUsers: readonly(onlineUsers),
    isConnected: readonly(isConnected),
    error: readonly(error),
    
    // Actions
    startPresence,
    stopPresence,
    updateUserStatus,
    refreshPresence,
    testPresence,
    debugPresence,
    testSupabaseConnection,
    retryPresence,
    forceSetConnected,
    checkConnectionHealth,
    
    // Cleanup function to reset singleton
    cleanup: () => {
      stopPresence()
      presenceInstance = null
      autoStartInitialized = false
      isInitializing = false
    }
  }
  
  // Store the instance
  presenceInstance = instance
  isInitializing = false
  
  return instance
}

// Global reset function for testing
export const resetPresenceSingleton = () => {
  if (presenceInstance) {
    presenceInstance.cleanup()
  }
  presenceInstance = null
  autoStartInitialized = false
  isInitializing = false
}
