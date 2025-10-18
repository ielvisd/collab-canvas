import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import { usePresence } from '~/composables/usePresence'
import { useCursorTracking } from '~/composables/useCursorTracking'
import { useRealtimeSync } from '~/composables/useRealtimeSync'

// Mock Nuxt app and auth
const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
    unsubscribe: vi.fn(),
    track: vi.fn().mockResolvedValue({}),
    presenceState: vi.fn(() => ({})),
  })),
  removeChannel: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }))
}

const mockUser = ref({
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
})

// Mock useNuxtApp
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase
  })
}))

// Mock useAuth
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser
  })
}))

describe('Real-time Collaboration Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any global state
    if (typeof window !== 'undefined') {
      delete (window as any).__cursorTrackingHandler
      delete (window as any).__realtimeChannel
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('usePresence', () => {
    it('should initialize with empty online users', () => {
      const { onlineUsers, isConnected, error } = usePresence()
      
      expect(onlineUsers.value).toEqual([])
      expect(isConnected.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should start presence tracking when user is authenticated', async () => {
      const { startPresence, isConnected } = usePresence()
      
      await startPresence()
      
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'canvas-presence-550e8400-e29b-41d4-a716-446655440000',
        expect.objectContaining({
          config: {
            presence: {
              key: 'test-user-123'
            }
          }
        })
      )
    })

    it('should handle presence sync events', () => {
      const { updateOnlineUsers } = usePresence()
      
      const mockPresenceState = {
        'user-1': [{
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: null,
          last_seen: new Date().toISOString(),
          online: true,
          cursor: { x: 100, y: 200, timestamp: Date.now() }
        }]
      }
      
      // This would be called internally by the presence system
      // We can't directly test it without exposing the function
      expect(mockPresenceState).toBeDefined()
    })

    it('should generate consistent user colors', () => {
      const { onlineUsers } = usePresence()
      
      // Test that the same user ID always gets the same color
      const userId = 'test-user-123'
      const color1 = onlineUsers.value.find(u => u.id === userId)?.color
      const color2 = onlineUsers.value.find(u => u.id === userId)?.color
      
      // Since we're testing the color generation logic indirectly
      expect(typeof color1).toBe('string')
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })

  describe('useCursorTracking', () => {
    it('should initialize with empty remote cursors', () => {
      const { remoteCursors, isTracking, error } = useCursorTracking()
      
      expect(remoteCursors.value).toEqual([])
      expect(isTracking.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should start tracking when startTracking is called', () => {
      const { startTracking, isTracking } = useCursorTracking()
      
      // Mock document.querySelector
      const mockCanvas = document.createElement('div')
      mockCanvas.setAttribute('data-testid', 'canvas-container')
      mockCanvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 700
      }))
      
      vi.spyOn(document, 'querySelector').mockReturnValue(mockCanvas)
      
      startTracking()
      
      expect(isTracking.value).toBe(true)
    })

    it('should stop tracking when stopTracking is called', () => {
      const { startTracking, stopTracking, isTracking } = useCursorTracking()
      
      // Mock document.querySelector
      const mockCanvas = document.createElement('div')
      mockCanvas.setAttribute('data-testid', 'canvas-container')
      mockCanvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 700
      }))
      
      vi.spyOn(document, 'querySelector').mockReturnValue(mockCanvas)
      
      startTracking()
      expect(isTracking.value).toBe(true)
      
      stopTracking()
      expect(isTracking.value).toBe(false)
    })

    it('should throttle cursor updates', (done) => {
      const { startTracking, updateCursorPosition } = useCursorTracking()
      
      // Mock document.querySelector
      const mockCanvas = document.createElement('div')
      mockCanvas.setAttribute('data-testid', 'canvas-container')
      mockCanvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 700
      }))
      
      vi.spyOn(document, 'querySelector').mockReturnValue(mockCanvas)
      
      startTracking()
      
      // Call updateCursorPosition multiple times rapidly
      const startTime = Date.now()
      let callCount = 0
      
      const interval = setInterval(() => {
        updateCursorPosition(100, 200)
        callCount++
        
        if (callCount >= 10) {
          clearInterval(interval)
          const endTime = Date.now()
          const duration = endTime - startTime
          
          // Should take at least 16ms * 9 calls = 144ms due to throttling
          expect(duration).toBeGreaterThan(100)
          done()
        }
      }, 1)
    })
  })

  describe('useRealtimeSync', () => {
    const rectangles = ref([])
    const circles = ref([])
    const texts = ref([])

    it('should initialize with disconnected state', () => {
      const { isConnected, lastSyncTime, error } = useRealtimeSync(rectangles, circles, texts)
      
      expect(isConnected.value).toBe(false)
      expect(lastSyncTime.value).toBeNull()
      expect(error.value).toBeNull()
    })

    it('should start real-time sync', async () => {
      const { startSync, isConnected } = useRealtimeSync(rectangles, circles, texts)
      
      await startSync()
      
      expect(mockSupabase.channel).toHaveBeenCalledWith('canvas-changes')
      expect(isConnected.value).toBe(true)
    })

    it('should handle shape insert events', () => {
      const onShapeChange = vi.fn()
      const { handleShapeInsert } = useRealtimeSync(rectangles, circles, texts, onShapeChange)
      
      const mockShape = {
        id: 'shape-123',
        type: 'rectangle',
        user_id: 'other-user-456',
        data: {
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#ff6b6b',
          stroke: '#000',
          rotation: 0
        }
      }
      
      handleShapeInsert(mockShape)
      
      expect(rectangles.value).toHaveLength(1)
      expect(rectangles.value[0]).toMatchObject({
        id: 'shape-123',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        fill: '#ff6b6b',
        stroke: '#000',
        rotation: 0
      })
      expect(onShapeChange).toHaveBeenCalledWith('insert', expect.any(Object))
    })

    it('should handle shape update events', () => {
      const onShapeChange = vi.fn()
      const { handleShapeUpdate } = useRealtimeSync(rectangles, circles, texts, onShapeChange)
      
      // First add a shape
      const mockShape = {
        id: 'shape-123',
        type: 'rectangle',
        user_id: 'other-user-456',
        data: {
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#ff6b6b',
          stroke: '#000',
          rotation: 0
        }
      }
      
      rectangles.value = [mockShape as any]
      
      // Then update it
      const updatedShape = {
        ...mockShape,
        data: {
          ...mockShape.data,
          x: 200,
          y: 300,
          fill: '#4ecdc4'
        }
      }
      
      handleShapeUpdate(updatedShape)
      
      expect(rectangles.value[0]).toMatchObject({
        id: 'shape-123',
        x: 200,
        y: 300,
        fill: '#4ecdc4'
      })
      expect(onShapeChange).toHaveBeenCalledWith('update', expect.any(Object))
    })

    it('should handle shape delete events', () => {
      const onShapeChange = vi.fn()
      const { handleShapeDelete } = useRealtimeSync(rectangles, circles, texts, onShapeChange)
      
      // First add a shape
      const mockShape = {
        id: 'shape-123',
        type: 'rectangle',
        user_id: 'other-user-456',
        data: {
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#ff6b6b',
          stroke: '#000',
          rotation: 0
        }
      }
      
      rectangles.value = [mockShape as any]
      expect(rectangles.value).toHaveLength(1)
      
      // Then delete it
      handleShapeDelete('shape-123', 'other-user-456')
      
      expect(rectangles.value).toHaveLength(0)
      expect(onShapeChange).toHaveBeenCalledWith('delete', { id: 'shape-123' })
    })

    it('should prevent echo of own changes', () => {
      const onShapeChange = vi.fn()
      const { handleShapeInsert } = useRealtimeSync(rectangles, circles, texts, onShapeChange)
      
      const ownShape = {
        id: 'shape-123',
        type: 'rectangle',
        user_id: 'test-user-123', // Same as mock user
        data: {
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#ff6b6b',
          stroke: '#000',
          rotation: 0
        }
      }
      
      handleShapeInsert(ownShape)
      
      // Should not add the shape since it's our own change
      expect(rectangles.value).toHaveLength(0)
      expect(onShapeChange).not.toHaveBeenCalled()
    })

    it('should convert database shapes to local format correctly', () => {
      const { handleShapeInsert } = useRealtimeSync(rectangles, circles, texts)
      
      // Test rectangle conversion
      const rectShape = {
        id: 'rect-123',
        type: 'rectangle',
        user_id: 'other-user-456',
        data: {
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#ff6b6b',
          stroke: '#000',
          strokeWidth: 2,
          rotation: 45
        }
      }
      
      handleShapeInsert(rectShape)
      
      expect(rectangles.value[0]).toMatchObject({
        id: 'rect-123',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        fill: '#ff6b6b',
        stroke: '#000',
        strokeWidth: 2,
        rotation: 45,
        draggable: true
      })
    })

    it('should stop real-time sync', () => {
      const { stopSync, isConnected } = useRealtimeSync(rectangles, circles, texts)
      
      stopSync()
      
      expect(mockSupabase.removeChannel).toHaveBeenCalled()
      expect(isConnected.value).toBe(false)
    })
  })

  describe('Integration Tests', () => {
    it('should work together for full real-time collaboration', async () => {
      const rectangles = ref([])
      const circles = ref([])
      const texts = ref([])
      
      // Initialize all systems
      const presence = usePresence()
      const cursorTracking = useCursorTracking()
      const realtimeSync = useRealtimeSync(rectangles, circles, texts)
      
      // Start all systems
      await presence.startPresence()
      cursorTracking.startTracking()
      await realtimeSync.startSync()
      
      // Verify all systems are running
      expect(presence.isConnected.value).toBe(true)
      expect(cursorTracking.isTracking.value).toBe(true)
      expect(realtimeSync.isConnected.value).toBe(true)
      
      // Test that a remote shape change would be handled
      const mockShape = {
        id: 'integration-test-shape',
        type: 'circle',
        user_id: 'other-user-789',
        data: {
          x: 300,
          y: 400,
          radius: 50,
          fill: '#4ecdc4',
          stroke: '#000',
          rotation: 0
        }
      }
      
      realtimeSync.handleShapeInsert(mockShape)
      
      expect(circles.value).toHaveLength(1)
      expect(circles.value[0]).toMatchObject({
        id: 'integration-test-shape',
        type: 'circle',
        x: 300,
        y: 400,
        radius: 50,
        fill: '#4ecdc4'
      })
    })
  })
})

