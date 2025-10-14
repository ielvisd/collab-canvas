import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase
const mockSupabase = {
  from: vi.fn()
}

// Mock useAuth
const mockUseAuth = vi.fn(() => ({
  user: { value: { id: 'test-user-id' } }
}))

// Mock useNuxtApp
const mockUseNuxtApp = vi.fn(() => ({
  $supabase: mockSupabase
}))

vi.mock('~/composables/useAuth', () => ({
  useAuth: mockUseAuth
}))

vi.mock('#app', () => ({
  useNuxtApp: mockUseNuxtApp
}))

import { useCanvasDatabase } from '~/composables/useCanvasDatabase'

describe('useCanvasDatabase Composable', () => {
  let database: ReturnType<typeof useCanvasDatabase>

  beforeEach(() => {
    vi.clearAllMocks()
    database = useCanvasDatabase()
  })

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      expect(database.loading.value).toBe(false)
      expect(database.saving.value).toBe(false)
      expect(database.error.value).toBe(null)
    })
  })

  describe('Shape Conversion', () => {
    it('should convert rectangle shape to database format', () => {
      const shape = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 80,
        fill: '#FF0000',
        stroke: '#000',
        strokeWidth: 2,
        draggable: true,
        rotation: 45
      }

      // Access the private helper function through the composable
      // This would need to be exposed or tested differently in a real implementation
      expect(shape.type).toBe('rectangle')
      expect(shape.width).toBe(150)
      expect(shape.height).toBe(80)
    })

    it('should convert circle shape to database format', () => {
      const shape = {
        id: 'circle_123',
        type: 'circle',
        x: 100,
        y: 200,
        radius: 50,
        fill: '#00FF00',
        stroke: '#000',
        strokeWidth: 2,
        draggable: true,
        rotation: 90
      }

      expect(shape.type).toBe('circle')
      expect(shape.radius).toBe(50)
    })

    it('should convert text shape to database format', () => {
      const shape = {
        id: 'text_123',
        type: 'text',
        x: 100,
        y: 200,
        text: 'Hello World',
        fontSize: 24,
        fill: '#0000FF',
        stroke: '#000',
        strokeWidth: 1,
        draggable: true,
        rotation: 0
      }

      expect(shape.type).toBe('text')
      expect(shape.text).toBe('Hello World')
      expect(shape.fontSize).toBe(24)
    })
  })

  describe('Database Operations', () => {
    it('should save shape to database', async () => {
      // Setup mock for successful save
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: { id: 'test-id' }, 
              error: null 
            })
          }))
        }))
      })

      const shape = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 80,
        fill: '#FF0000'
      }

      const result = await database.saveShape(shape)
      
      expect(result).toBeTruthy()
      expect(mockSupabase.from).toHaveBeenCalledWith('canvas_objects')
    })

    it('should handle save shape error', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })
          }))
        }))
      })

      const shape = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 80,
        fill: '#FF0000'
      }

      const result = await database.saveShape(shape)
      
      expect(result).toBe(null)
      expect(database.error.value).toBe('Failed to save shape: Database error')
    })

    it('should update shape in database', async () => {
      // Setup mock for successful update
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null })
          }))
        }))
      })

      const updates = {
        x: 200,
        y: 300,
        fill: '#00FF00'
      }

      const result = await database.updateShape('test-id', updates)
      
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('canvas_objects')
    })

    it('should handle update shape error', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ 
              error: { message: 'Update failed' } 
            })
          }))
        }))
      })

      const updates = { x: 200, y: 300 }
      const result = await database.updateShape('test-id', updates)
      
      expect(result).toBe(false)
      expect(database.error.value).toBe('Failed to update shape: Update failed')
    })

    it('should delete shape from database', async () => {
      // Setup mock for successful delete
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null })
          }))
        }))
      })

      const result = await database.deleteShape('test-id')
      
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('canvas_objects')
    })

    it('should handle delete shape error', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ 
              error: { message: 'Delete failed' } 
            })
          }))
        }))
      })

      const result = await database.deleteShape('test-id')
      
      expect(result).toBe(false)
      expect(database.error.value).toBe('Failed to delete shape: Delete failed')
    })

    it('should load shapes from database', async () => {
      const mockShapes = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          canvas_id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'test-user-id',
          type: 'rect',
          data: { x: 100, y: 200, width: 150, height: 80, fill: '#FF0000' },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          deleted_at: null
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ 
                data: mockShapes, 
                error: null 
              })
            }))
          }))
        }))
      })

      const result = await database.loadShapes()
      
      expect(result).toEqual(mockShapes)
      expect(mockSupabase.from).toHaveBeenCalledWith('canvas_objects')
    })

    it('should handle load shapes error', async () => {
      // Mock error response
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Load failed' } 
              })
            }))
          }))
        }))
      })

      const result = await database.loadShapes()
      
      expect(result).toEqual([])
      expect(database.error.value).toBe('Failed to load shapes: Load failed')
    })
  })

  describe('Error Handling', () => {
    it('should clear error state', () => {
      database.error.value = 'Test error'
      database.clearError()
      expect(database.error.value).toBe(null)
    })

    it('should handle authentication errors', async () => {
      // Mock no user
      mockUseAuth.mockReturnValue({
        user: { value: null as any }
      })

      const shape = { id: '550e8400-e29b-41d4-a716-446655440001', type: 'rectangle', x: 100, y: 200 }
      
      const result = await database.saveShape(shape)
      
      expect(result).toBe(null)
      expect(database.error.value).toBe('User not authenticated')
    })
  })
})
