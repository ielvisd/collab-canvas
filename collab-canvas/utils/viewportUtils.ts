/**
 * Viewport utilities for calculating visible canvas bounds
 */

export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  centerX: number
  centerY: number
  width: number
  height: number
}

export interface CanvasState {
  scale: number
  offsetX: number
  offsetY: number
  canvasWidth: number
  canvasHeight: number
}

/**
 * Calculate the current viewport bounds based on canvas state
 */
export function calculateViewportBounds(
  canvasState: CanvasState,
  viewportElement: HTMLElement | null
): ViewportBounds | null {
  if (!viewportElement) return null

  const viewportRect = viewportElement.getBoundingClientRect()
  const viewportWidth = viewportRect.width
  const viewportHeight = viewportRect.height

  // Calculate the scaled canvas dimensions
  const scaledCanvasWidth = canvasState.canvasWidth * canvasState.scale
  const scaledCanvasHeight = canvasState.canvasHeight * canvasState.scale

  // Calculate the visible area in canvas coordinates
  // The viewport is centered, so we need to account for the offset and scale
  const canvasCenterX = canvasState.canvasWidth / 2
  const canvasCenterY = canvasState.canvasHeight / 2

  // Calculate the visible bounds in canvas coordinates
  const visibleWidth = viewportWidth / canvasState.scale
  const visibleHeight = viewportHeight / canvasState.scale

  const minX = Math.max(0, canvasCenterX - visibleWidth / 2 - canvasState.offsetX / canvasState.scale)
  const maxX = Math.min(canvasState.canvasWidth, canvasCenterX + visibleWidth / 2 - canvasState.offsetX / canvasState.scale)
  const minY = Math.max(0, canvasCenterY - visibleHeight / 2 - canvasState.offsetY / canvasState.scale)
  const maxY = Math.min(canvasState.canvasHeight, canvasCenterY + visibleHeight / 2 - canvasState.offsetY / canvasState.scale)

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Generate a random position within the viewport bounds
 */
export function getRandomViewportPosition(
  viewportBounds: ViewportBounds,
  itemSize: number = 50
): { x: number; y: number } {
  const padding = itemSize / 2 // Ensure item doesn't go outside viewport
  const minX = viewportBounds.minX + padding
  const maxX = viewportBounds.maxX - padding
  const minY = viewportBounds.minY + padding
  const maxY = viewportBounds.maxY - padding

  // Ensure we have valid bounds
  if (minX >= maxX || minY >= maxY) {
    // Fallback to center if viewport is too small
    return {
      x: viewportBounds.centerX,
      y: viewportBounds.centerY
    }
  }

  return {
    x: Math.random() * (maxX - minX) + minX,
    y: Math.random() * (maxY - minY) + minY
  }
}

/**
 * Generate a position at the center of the viewport
 */
export function getViewportCenterPosition(viewportBounds: ViewportBounds): { x: number; y: number } {
  return {
    x: viewportBounds.centerX,
    y: viewportBounds.centerY
  }
}

/**
 * Clamp a position to ensure it stays within the viewport bounds
 */
export function clampToViewport(
  position: { x: number; y: number },
  viewportBounds: ViewportBounds,
  itemSize: number = 50
): { x: number; y: number } {
  const padding = itemSize / 2
  return {
    x: Math.max(viewportBounds.minX + padding, Math.min(viewportBounds.maxX - padding, position.x)),
    y: Math.max(viewportBounds.minY + padding, Math.min(viewportBounds.maxY - padding, position.y))
  }
}

/**
 * Check if a position is within the viewport bounds
 */
export function isWithinViewport(
  position: { x: number; y: number },
  viewportBounds: ViewportBounds,
  itemSize: number = 50
): boolean {
  const padding = itemSize / 2
  return (
    position.x >= viewportBounds.minX + padding &&
    position.x <= viewportBounds.maxX - padding &&
    position.y >= viewportBounds.minY + padding &&
    position.y <= viewportBounds.maxY - padding
  )
}
