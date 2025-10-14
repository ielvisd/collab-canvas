import type { Ref } from 'vue'

export interface CursorPosition {
  x: number
  y: number
  timestamp: number
}

export interface RemoteCursor {
  userId: string
  userName: string
  color: string
  position: CursorPosition
  isActive: boolean
}

export interface CursorTrackingState {
  remoteCursors: Ref<RemoteCursor[]>
  isTracking: Ref<boolean>
  error: Ref<string | null>
}

export interface CursorTrackingActions {
  startTracking: () => void
  stopTracking: () => void
  updateCursorPosition: (x: number, y: number) => void
}

// Throttle function to limit cursor updates to 60fps
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  return (...args: any[]) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

export const useCursorTracking = () => {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  const { updateUserStatus } = usePresence()
  
  // State
  const remoteCursors = ref<RemoteCursor[]>([])
  const isTracking = ref(false)
  const error = ref<string | null>(null)
  
  // Throttled cursor update function (60fps = ~16ms)
  const throttledCursorUpdate = throttle((x: number, y: number) => {
    if (isTracking.value && user.value) {
      updateUserStatus({
        cursor: {
          x: Math.round(x),
          y: Math.round(y),
          timestamp: Date.now()
        }
      })
    }
  }, 16)
  
  // Start cursor tracking
  const startTracking = () => {
    if (!user.value) {
      error.value = 'User not authenticated'
      return
    }
    
    isTracking.value = true
    error.value = null
    
    // Listen for mouse movement on the canvas
    const handleMouseMove = (event: MouseEvent) => {
      const canvasContainer = document.querySelector('[data-testid="canvas-container"]')
      if (!canvasContainer) return
      
      const rect = canvasContainer.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Only track if mouse is within canvas bounds
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        throttledCursorUpdate(x, y)
      }
    }
    
    // Add event listener
    document.addEventListener('mousemove', handleMouseMove)
    
    // Store the handler for cleanup
    ;(window as any).__cursorTrackingHandler = handleMouseMove
  }
  
  // Stop cursor tracking
  const stopTracking = () => {
    isTracking.value = false
    
    // Remove event listener
    const handler = (window as any).__cursorTrackingHandler
    if (handler) {
      document.removeEventListener('mousemove', handler)
      delete (window as any).__cursorTrackingHandler
    }
  }
  
  // Update cursor position (called by throttled function)
  const updateCursorPosition = (x: number, y: number) => {
    throttledCursorUpdate(x, y)
  }
  
  // Listen for remote cursor updates from presence
  const { onlineUsers } = usePresence()
  
  // Watch for changes in online users to update cursor data
  watch(onlineUsers, (users) => {
    // Update remote cursors based on presence data
    const cursors: RemoteCursor[] = []
    
    users.forEach(user => {
      const hasCursor = user.cursor && user.cursor.timestamp > 0
      const isRecent = hasCursor && (Date.now() - user.cursor.timestamp) < 5000 // 5 seconds
      
      cursors.push({
        userId: user.id,
        userName: user.name,
        color: user.color,
        position: user.cursor || { x: 0, y: 0, timestamp: 0 },
        isActive: Boolean(isRecent)
      })
    })
    
    remoteCursors.value = cursors
  }, { immediate: true })
  
  // Cleanup on unmount
  onUnmounted(() => {
    stopTracking()
  })
  
  return {
    // State
    remoteCursors: readonly(remoteCursors),
    isTracking: readonly(isTracking),
    error: readonly(error),
    
    // Actions
    startTracking,
    stopTracking,
    updateCursorPosition
  }
}
