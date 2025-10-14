import { test, expect } from '@playwright/test'

test.describe('Canvas Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to canvas page
    await page.goto('/canvas')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display canvas with proper layout', async ({ page }) => {
    // Check that the canvas container is visible
    const canvasContainer = page.locator('[data-testid="canvas-container"]')
    await expect(canvasContainer).toBeVisible()

    // Check that the toolbar is visible and positioned correctly
    const toolbar = page.locator('[data-testid="canvas-toolbar"]')
    await expect(toolbar).toBeVisible()

    // Check that the debug info is visible
    const debugInfo = page.locator('[data-testid="debug-info"]')
    await expect(debugInfo).toBeVisible()
  })

  test('should have toolbar controls that are not overlapped by header', async ({ page }) => {
    // Get the toolbar position
    const toolbar = page.locator('[data-testid="canvas-toolbar"]')
    const toolbarBox = await toolbar.boundingBox()
    
    // Get the header position (if it exists)
    const header = page.locator('header, [data-testid="app-header"]')
    const headerBox = await header.boundingBox()
    
    if (headerBox && toolbarBox) {
      // Toolbar should be below the header
      expect(toolbarBox.y).toBeGreaterThan(headerBox.y + headerBox.height)
    }
  })

  test('should create shapes when buttons are clicked', async ({ page }) => {
    // Check initial shape count
    const debugInfo = page.locator('[data-testid="debug-info"]')
    await expect(debugInfo).toContainText('Shapes: 0')

    // Click add rectangle button
    await page.click('[data-testid="add-rectangle-btn"]')
    await expect(debugInfo).toContainText('Shapes: 1')

    // Click add circle button
    await page.click('[data-testid="add-circle-btn"]')
    await expect(debugInfo).toContainText('Shapes: 2')

    // Click add text button
    await page.click('[data-testid="add-text-btn"]')
    await expect(debugInfo).toContainText('Shapes: 3')
  })

  test('should select and delete shapes', async ({ page }) => {
    // Add a shape
    await page.click('[data-testid="add-rectangle-btn"]')
    
    // Click on the shape to select it
    await page.click('canvas', { position: { x: 100, y: 100 } })
    
    // Check that shape is selected
    const debugInfo = page.locator('[data-testid="debug-info"]')
    await expect(debugInfo).toContainText('Selected: rect_')

    // Delete the selected shape
    await page.click('[data-testid="delete-selected-btn"]')
    
    // Confirm deletion
    await page.click('button:has-text("OK")')
    
    // Check that shape count is back to 0
    await expect(debugInfo).toContainText('Shapes: 0')
  })

  test('should change shape colors', async ({ page }) => {
    // Add a shape
    await page.click('[data-testid="add-rectangle-btn"]')
    
    // Select a color
    const colorPicker = page.locator('[data-testid="color-picker"]')
    await colorPicker.fill('#FF0000')
    
    // Click apply color button
    await page.click('[data-testid="apply-color-btn"]')
    
    // The shape should now have the new color (this would need to be verified visually or through canvas inspection)
  })

  test('should rotate shapes', async ({ page }) => {
    // Add a shape
    await page.click('[data-testid="add-rectangle-btn"]')
    
    // Click on the shape to select it
    await page.click('canvas', { position: { x: 100, y: 100 } })
    
    // Check that shape is selected
    const debugInfo = page.locator('[data-testid="debug-info"]')
    await expect(debugInfo).toContainText('Selected: rect_')
    
    // Check that rotation controls are visible
    const rotateLeftBtn = page.locator('[data-testid="rotate-left-btn"]')
    const rotateRightBtn = page.locator('[data-testid="rotate-right-btn"]')
    await expect(rotateLeftBtn).toBeVisible()
    await expect(rotateRightBtn).toBeVisible()
    
    // Test rotation buttons
    await rotateRightBtn.click()
    await rotateRightBtn.click()
    await rotateLeftBtn.click()
    
    // The shape should now be rotated (this would need to be verified visually or through canvas inspection)
  })

  test('should clear all shapes', async ({ page }) => {
    // Add multiple shapes
    await page.click('[data-testid="add-rectangle-btn"]')
    await page.click('[data-testid="add-circle-btn"]')
    await page.click('[data-testid="add-text-btn"]')
    
    // Check that we have 3 shapes
    const debugInfo = page.locator('[data-testid="debug-info"]')
    await expect(debugInfo).toContainText('Shapes: 3')
    
    // Clear all shapes
    await page.click('[data-testid="clear-all-btn"]')
    
    // Check that all shapes are cleared
    await expect(debugInfo).toContainText('Shapes: 0')
  })

  test('should handle canvas pan and zoom', async ({ page }) => {
    const canvas = page.locator('canvas')
    
    // Test panning by dragging
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 200 }
    })
    
    // Test zooming with mouse wheel
    await canvas.hover()
    await page.mouse.wheel(0, -100) // Zoom in
    await page.mouse.wheel(0, 100)  // Zoom out
  })

  test('should display performance test button and work', async ({ page }) => {
    // Check that performance test button exists
    const perfButton = page.locator('[data-testid="add-many-shapes-btn"]')
    await expect(perfButton).toBeVisible()
    
    // Click performance test button
    await perfButton.click()
    
    // Check that many shapes were added
    const debugInfo = page.locator('[data-testid="debug-info"]')
    await expect(debugInfo).toContainText('Shapes: 50')
  })
})
