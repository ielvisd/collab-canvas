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

export const usePresence = () => {
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
  const maxRetries = 3
  
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
    
    // Wait a bit for auth state to be fully ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // Create presence channel
      const channelName = `canvas-presence-${getCanvasId()}`
      console.log('🔗 Creating presence channel:', channelName)
      console.log('👤 User info:', {
        id: user.value.id,
        email: user.value.email,
        metadata: user.value.user_metadata
      })
      
      console.log('🔗 Supabase client before channel creation:', $supabase)
      console.log('🔗 Supabase auth state:', $supabase.auth.getSession())
      
      presenceChannel = $supabase.channel(channelName, {
        config: {
          presence: {
            key: user.value.id
          }
        }
      })
      
      console.log('🔗 Presence channel created:', presenceChannel)
      
      // Track presence changes
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          console.log('👥 Presence sync event:', state)
          console.log('👥 Presence state keys:', Object.keys(state))
          // If we're receiving presence events, we're connected
          if (!isConnected.value) {
            console.log('📡 Setting isConnected to true based on presence sync event')
            isConnected.value = true
            error.value = null
          }
          updateOnlineUsers(state)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string, newPresences: any[] }) => {
          console.log('👋 User joined:', key, newPresences)
          // If we're receiving presence events, we're connected
          if (!isConnected.value) {
            console.log('📡 Setting isConnected to true based on user join event')
            isConnected.value = true
            error.value = null
          }
          updateOnlineUsers(presenceChannel.presenceState())
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string, leftPresences: any[] }) => {
          console.log('👋 User left:', key, leftPresences)
          // If we're receiving presence events, we're connected
          if (!isConnected.value) {
            console.log('📡 Setting isConnected to true based on user leave event')
            isConnected.value = true
            error.value = null
          }
          updateOnlineUsers(presenceChannel.presenceState())
        })
      
      // Subscribe to channel
      console.log('📡 Subscribing to presence channel...')
      console.log('📡 Supabase client:', $supabase)
      console.log('📡 Channel name:', channelName)
      
      const response = await presenceChannel.subscribe(async (status: string) => {
        console.log('📡 Presence channel status:', status)
        console.log('📡 Response object:', response)
        console.log('📡 Current isConnected state before update:', isConnected.value)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to presence channel')
          isConnected.value = true
          error.value = null
          console.log('📡 isConnected set to true')
          
          // Get user display name
          const userName = user.value!.user_metadata?.full_name || 
                          user.value!.user_metadata?.name || 
                          user.value!.email?.split('@')[0] || 
                          'Anonymous'
          
          console.log('👤 Tracking user as online:', {
            user_id: user.value!.id,
            user_name: userName,
            user_avatar: user.value!.user_metadata?.avatar_url
          })
          
          try {
            // Track this user as online
            await presenceChannel.track({
              user_id: user.value!.id,
              user_name: userName,
              user_avatar: user.value!.user_metadata?.avatar_url,
              last_seen: new Date().toISOString(),
              online: true
            })
            
            console.log('✅ User presence tracked successfully')
            // Ensure we're marked as connected after successful tracking
            isConnected.value = true
            console.log('📡 isConnected confirmed as true after tracking')
          } catch (trackError) {
            console.error('❌ Error tracking presence:', trackError)
            error.value = 'Failed to track user presence'
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Presence channel error')
          error.value = 'Failed to connect to presence channel'
          isConnected.value = false
          scheduleRetry()
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Presence channel timed out')
          error.value = 'Presence channel connection timed out'
          isConnected.value = false
          scheduleRetry()
        } else if (status === 'CLOSED') {
          console.error('❌ Presence channel closed')
          error.value = 'Presence channel connection closed'
          isConnected.value = false
          scheduleRetry()
        } else {
          console.warn('⚠️ Unknown presence channel status:', status)
        }
      })
      
      console.log('📡 Subscription response:', response)
      
      // Set a timeout to detect if subscription is hanging
      setTimeout(() => {
        if (!isConnected.value) {
          console.error('❌ Presence subscription timeout - not connected after 10 seconds')
          error.value = 'Presence subscription timed out'
          scheduleRetry()
        }
      }, 10000)
      
    } catch (err) {
      console.error('❌ Error starting presence:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error'
      scheduleRetry()
    }
  }
  
  // Schedule retry with exponential backoff
  const scheduleRetry = () => {
    if (retryCount >= maxRetries) {
      console.error('❌ Max retry attempts reached for presence connection')
      error.value = 'Failed to connect to presence after multiple attempts'
      return
    }
    
    retryCount++
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000) // Exponential backoff, max 10s
    
    console.log(`🔄 Scheduling presence retry ${retryCount}/${maxRetries} in ${delay}ms`)
    
    retryTimeout = setTimeout(async () => {
      console.log(`🔄 Retrying presence connection (attempt ${retryCount}/${maxRetries})`)
      await startPresence()
    }, delay)
  }
  
  // Stop presence tracking
  const stopPresence = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
    
    if (presenceChannel) {
      presenceChannel.unsubscribe()
      presenceChannel = null
    }
    isConnected.value = false
    onlineUsers.value = []
    retryCount = 0
  }
  
  // Update online users list
  const updateOnlineUsers = (presenceState: any) => {
    console.log('🔄 Updating online users from presence state:', presenceState)
    const users: OnlineUser[] = []
    
    // Handle different presence state formats
    if (presenceState && typeof presenceState === 'object') {
      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        console.log(`👤 Processing presences for key ${key}:`, presences)
        
        if (Array.isArray(presences)) {
          presences.forEach((presence: any) => {
            console.log('👤 Processing presence:', presence)
            console.log('👤 Presence online status:', presence?.online)
            console.log('👤 Presence user_id:', presence?.user_id)
            console.log('👤 Current user_id:', user.value?.id)
            console.log('👤 Is different user:', presence?.user_id !== user.value?.id)
            console.log('👤 User ID comparison:', {
              presenceUserId: presence?.user_id,
              currentUserId: user.value?.id,
              areEqual: presence?.user_id === user.value?.id,
              areDifferent: presence?.user_id !== user.value?.id
            })
            
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
              console.log('✅ Added online user:', onlineUser)
            } else {
              console.log('❌ Skipped presence (not online or same user):', {
                online: presence?.online,
                isDifferentUser: presence?.user_id !== user.value?.id,
                presenceUserId: presence?.user_id,
                currentUserId: user.value?.id
              })
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
          console.log('✅ Added online user (single):', onlineUser)
        }
      })
    }
    
    console.log('👥 Final online users list:', users)
    console.log('👥 Setting onlineUsers.value to:', users)
    onlineUsers.value = users
    console.log('👥 onlineUsers.value after setting:', onlineUsers.value)
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
      console.log('🔄 Manually refreshing presence state...')
      const state = presenceChannel.presenceState()
      console.log('🔄 Current presence state:', state)
      updateOnlineUsers(state)
    }
  }
  
  // Test function to manually add a fake user for testing
  const testPresence = () => {
    console.log('🧪 Testing presence with fake user...')
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
    console.log('Online users:', onlineUsers.value)
    console.log('Is connected:', isConnected.value)
    console.log('Error:', error.value)
    if (presenceChannel) {
      console.log('Presence channel state:', presenceChannel.presenceState())
      console.log('Presence channel subscribed:', presenceChannel.state)
    }
    console.log('Supabase client:', $supabase)
    console.log('Canvas ID:', getCanvasId())
  }
  
  // Force set connected state (for debugging)
  const forceSetConnected = (connected: boolean) => {
    console.log(`🔧 Force setting isConnected to: ${connected}`)
    isConnected.value = connected
  }
  
  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('🧪 Testing Supabase connection...')
      const { data, error } = await $supabase.from('canvas_objects').select('count').limit(1)
      if (error) {
        console.error('❌ Supabase connection error:', error)
        return false
      } else {
        console.log('✅ Supabase connection successful:', data)
        return true
      }
    } catch (err) {
      console.error('❌ Supabase connection test failed:', err)
      return false
    }
  }
  
  // Retry presence connection
  const retryPresence = async () => {
    console.log('🔄 Manually retrying presence connection...')
    stopPresence()
    retryCount = 0 // Reset retry count for manual retry
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await startPresence()
  }
  
  // Auto-start presence when user becomes authenticated
  const autoStartPresence = () => {
    if (process.client) {
      // Watch for user authentication changes
      watch(user, async (newUser, oldUser) => {
        if (newUser && !oldUser) {
          // User just logged in
          console.log('👤 User authenticated, starting presence...')
          await startPresence()
        } else if (!newUser && oldUser) {
          // User just logged out
          console.log('👤 User logged out, stopping presence...')
          stopPresence()
        }
      }, { immediate: true })
    }
  }
  
  // Initialize auto-start
  autoStartPresence()
  
  // Cleanup on unmount
  onUnmounted(() => {
    stopPresence()
  })
  
  return {
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
    forceSetConnected
  }
}
