import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock environment variables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      supabaseUrl: 'https://test.supabase.co',
      supabasePublishableKey: 'test-key'
    }
  })
}))

// Mock Vue composables
const mockUser = ref<any>(null)
const mockAuth = {
  user: mockUser
}

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => mockAuth
}))

// Mock Supabase client
const mockPresenceChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue({}),
  unsubscribe: vi.fn(),
  track: vi.fn().mockResolvedValue({}),
  presenceState: vi.fn().mockReturnValue({}),
  state: 'SUBSCRIBED'
}

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockPresenceChannel),
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  })
}

vi.mock('~/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase
}))

// Mock Nuxt app
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase
  })
}))

// Mock Vue lifecycle hooks
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onUnmounted: vi.fn(),
    watch: vi.fn(),
    readonly: vi.fn((val) => val)
  }
})

describe('usePresence Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.value = null
    // Reset timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with empty state', async () => {
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      expect(presence.onlineUsers.value).toEqual([])
      expect(presence.isConnected.value).toBe(false)
      expect(presence.error.value).toBe(null)
    })

    it('should have all required methods', async () => {
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      expect(typeof presence.startPresence).toBe('function')
      expect(typeof presence.stopPresence).toBe('function')
      expect(typeof presence.updateUserStatus).toBe('function')
      expect(typeof presence.refreshPresence).toBe('function')
      expect(typeof presence.testPresence).toBe('function')
      expect(typeof presence.debugPresence).toBe('function')
      expect(typeof presence.testSupabaseConnection).toBe('function')
      expect(typeof presence.retryPresence).toBe('function')
      expect(typeof presence.forceSetConnected).toBe('function')
    })
  })

  describe('startPresence', () => {
    it('should handle unauthenticated user', async () => {
      mockUser.value = null
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      await presence.startPresence()
      
      expect(presence.error.value).toBe('User not authenticated')
      expect(presence.isConnected.value).toBe(false)
    })

    it('should create presence channel with correct name', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock successful subscription
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 100)
        return Promise.resolve({})
      })
      
      await presence.startPresence()
      
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'canvas-presence-550e8400-e29b-41d4-a716-446655440000',
        expect.objectContaining({
          config: {
            presence: {
              key: 'user-123'
            }
          }
        })
      )
    })

    it('should handle successful subscription', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock successful subscription
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 100)
        return Promise.resolve({})
      })
      
      await presence.startPresence()
      
      // Fast-forward timers to trigger subscription callback
      vi.advanceTimersByTime(100)
      
      expect(presence.isConnected.value).toBe(true)
      expect(presence.error.value).toBe(null)
      expect(mockPresenceChannel.track).toHaveBeenCalledWith({
        user_id: 'user-123',
        user_name: 'Test User',
        user_avatar: undefined,
        last_seen: expect.any(String),
        online: true
      })
    })

    it('should handle subscription errors', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock subscription error
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('CHANNEL_ERROR'), 100)
        return Promise.resolve({})
      })
      
      await presence.startPresence()
      
      // Fast-forward timers to trigger subscription callback
      vi.advanceTimersByTime(100)
      
      expect(presence.isConnected.value).toBe(false)
      expect(presence.error.value).toBe('Failed to connect to presence channel')
    })

    it('should handle timeout errors', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock subscription timeout
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        // Don't call callback, let it timeout
        return Promise.resolve({})
      })
      
      await presence.startPresence()
      
      // Fast-forward past timeout (10 seconds)
      vi.advanceTimersByTime(10000)
      
      expect(presence.isConnected.value).toBe(false)
      expect(presence.error.value).toBe('Presence subscription timed out')
    })
  })

  describe('stopPresence', () => {
    it('should clean up presence channel and reset state', async () => {
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Start presence first
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 100)
        return Promise.resolve({})
      })
      
      await presence.startPresence()
      vi.advanceTimersByTime(100)
      
      // Now stop presence
      presence.stopPresence()
      
      expect(mockPresenceChannel.unsubscribe).toHaveBeenCalled()
      expect(presence.isConnected.value).toBe(false)
      expect(presence.onlineUsers.value).toEqual([])
    })
  })

  describe('updateOnlineUsers', () => {
    it('should process presence state and update online users', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock presence state with other users
      const mockPresenceState = {
        'other-user-456': [{
          user_id: 'other-user-456',
          user_name: 'Other User',
          user_avatar: 'avatar.jpg',
          last_seen: new Date().toISOString(),
          online: true,
          cursor: {
            x: 100,
            y: 200,
            timestamp: Date.now()
          }
        }],
        'user-123': [{
          user_id: 'user-123',
          user_name: 'Test User',
          last_seen: new Date().toISOString(),
          online: true
        }]
      }
      
      mockPresenceChannel.presenceState.mockReturnValue(mockPresenceState)
      
      // Simulate presence sync event
      const syncCallback = mockPresenceChannel.on.mock.calls
        .find(call => call[0] === 'presence' && call[1].event === 'sync')?.[2]
      
      if (syncCallback) {
        syncCallback()
      }
      
      expect(presence.onlineUsers.value).toHaveLength(1)
      expect(presence.onlineUsers.value[0]).toMatchObject({
        id: 'other-user-456',
        name: 'Other User',
        avatar: 'avatar.jpg',
        color: expect.any(String),
        lastSeen: expect.any(Date),
        cursor: {
          x: 100,
          y: 200,
          timestamp: expect.any(Number)
        }
      })
    })

    it('should filter out current user from online users', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock presence state with current user
      const mockPresenceState = {
        'user-123': [{
          user_id: 'user-123',
          user_name: 'Test User',
          last_seen: new Date().toISOString(),
          online: true
        }]
      }
      
      mockPresenceChannel.presenceState.mockReturnValue(mockPresenceState)
      
      // Simulate presence sync event
      const syncCallback = mockPresenceChannel.on.mock.calls
        .find(call => call[0] === 'presence' && call[1].event === 'sync')?.[2]
      
      if (syncCallback) {
        syncCallback()
      }
      
      expect(presence.onlineUsers.value).toHaveLength(0)
    })

    it('should handle offline users', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock presence state with offline user
      const mockPresenceState = {
        'other-user-456': [{
          user_id: 'other-user-456',
          user_name: 'Other User',
          last_seen: new Date().toISOString(),
          online: false
        }]
      }
      
      mockPresenceChannel.presenceState.mockReturnValue(mockPresenceState)
      
      // Simulate presence sync event
      const syncCallback = mockPresenceChannel.on.mock.calls
        .find(call => call[0] === 'presence' && call[1].event === 'sync')?.[2]
      
      if (syncCallback) {
        syncCallback()
      }
      
      expect(presence.onlineUsers.value).toHaveLength(0)
    })
  })

  describe('updateUserStatus', () => {
    it('should update user status when connected', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Start presence and connect
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 100)
        return Promise.resolve({})
      })
      
      await presence.startPresence()
      vi.advanceTimersByTime(100)
      
      // Update user status
      const status = { cursor: { x: 100, y: 200 } }
      await presence.updateUserStatus(status)
      
      expect(mockPresenceChannel.track).toHaveBeenCalledWith({
        user_id: 'user-123',
        user_name: 'Test User',
        user_avatar: undefined,
        last_seen: expect.any(String),
        online: true,
        cursor: { x: 100, y: 200 }
      })
    })

    it('should not update status when not connected', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Don't start presence (not connected)
      const status = { cursor: { x: 100, y: 200 } }
      await presence.updateUserStatus(status)
      
      expect(mockPresenceChannel.track).not.toHaveBeenCalled()
    })
  })

  describe('testPresence', () => {
    it('should add fake user for testing', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      presence.testPresence()
      
      expect(presence.onlineUsers.value).toHaveLength(1)
      expect(presence.onlineUsers.value[0]).toMatchObject({
        id: 'test-user-123',
        name: 'Test User',
        online: true
      })
    })
  })

  describe('testSupabaseConnection', () => {
    it('should test Supabase connection successfully', async () => {
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      const result = await presence.testSupabaseConnection()
      
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('canvas_objects')
    })

    it('should handle Supabase connection error', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
        })
      })
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      const result = await presence.testSupabaseConnection()
      
      expect(result).toBe(false)
    })
  })

  describe('retryPresence', () => {
    it('should retry presence connection', async () => {
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Mock successful retry
      mockPresenceChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 100)
        return Promise.resolve({})
      })
      
      await presence.retryPresence()
      
      expect(mockPresenceChannel.unsubscribe).toHaveBeenCalled()
      expect(mockSupabase.channel).toHaveBeenCalled()
    })
  })

  describe('forceSetConnected', () => {
    it('should force set connected state', async () => {
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      presence.forceSetConnected(true)
      expect(presence.isConnected.value).toBe(true)
      
      presence.forceSetConnected(false)
      expect(presence.isConnected.value).toBe(false)
    })
  })

  describe('User Color Generation', () => {
    it('should generate consistent colors for same user ID', async () => {
      const { usePresence } = await import('~/composables/usePresence')
      const presence = usePresence()
      
      // Test with fake presence state to trigger color generation
      const mockPresenceState = {
        'user-456': [{
          user_id: 'user-456',
          user_name: 'Test User',
          last_seen: new Date().toISOString(),
          online: true
        }]
      }
      
      mockPresenceChannel.presenceState.mockReturnValue(mockPresenceState)
      
      // Simulate presence sync event
      const syncCallback = mockPresenceChannel.on.mock.calls
        .find(call => call[0] === 'presence' && call[1].event === 'sync')?.[2]
      
      if (syncCallback) {
        syncCallback()
      }
      
      const color1 = presence.onlineUsers.value[0]?.color
      
      // Reset and test again by triggering another sync event
      if (syncCallback) {
        syncCallback()
      }
      
      const color2 = presence.onlineUsers.value[0]?.color
      
      expect(color1).toBe(color2)
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })
})
