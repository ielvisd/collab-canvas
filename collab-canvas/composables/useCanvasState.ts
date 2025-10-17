/**
 * Optimized canvas state management using Nuxt best practices
 * Centralizes canvas state with performance optimizations
 */

import type { Ref } from 'vue'
import { generateId, getRandomColor, getRandomPosition, CANVAS_ID } from '~/utils/shapeUtils'

export interface CanvasState {
  canvasId: Ref<string>
  isConnected: Ref<boolean>
  lastSyncTime: Ref<Date | null>
  error: Ref<string | null>
  loading: Ref<boolean>
  saving: Ref<boolean>
}

export interface CanvasActions {
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  updateSyncTime: () => void
  setConnected: (connected: boolean) => void
  reset: () => void
}

export const useCanvasState = () => {
  // Use useState for SSR-friendly shared state
  const canvasId = useState('canvas-id', () => CANVAS_ID)
  const isConnected = useState('canvas-connected', () => false)
  const lastSyncTime = useState<Date | null>('canvas-last-sync', () => null)
  const error = useState<string | null>('canvas-error', () => null)
  const loading = useState('canvas-loading', () => false)
  const saving = useState('canvas-saving', () => false)

  // Actions
  const setError = (newError: string | null) => {
    error.value = newError
  }

  const setLoading = (newLoading: boolean) => {
    loading.value = newLoading
  }

  const setSaving = (newSaving: boolean) => {
    saving.value = newSaving
  }

  const updateSyncTime = () => {
    lastSyncTime.value = new Date()
  }

  const setConnected = (connected: boolean) => {
    isConnected.value = connected
  }

  const reset = () => {
    error.value = null
    loading.value = false
    saving.value = false
  }

  // State
  const state: CanvasState = {
    canvasId,
    isConnected,
    lastSyncTime,
    error,
    loading,
    saving
  }

  // Actions
  const actions: CanvasActions = {
    setError,
    setLoading,
    setSaving,
    updateSyncTime,
    setConnected,
    reset
  }

  return {
    ...state,
    ...actions
  }
}
