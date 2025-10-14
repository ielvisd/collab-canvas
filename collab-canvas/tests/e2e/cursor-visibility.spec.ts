import { test, expect } from '@playwright/test'

test.describe('Cursor Visibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to canvas page
    await page.goto('/canvas')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display cursor overlay when multiple users are present', async ({ browser }) => {
    // Create two browser contexts to simulate multiple users
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      // Navigate both pages to canvas
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      // Wait for both pages to load
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Wait for presence system to initialize
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Check if cursor overlay component exists
      const cursorOverlay1 = page1.locator('[data-testid="cursor-overlay"]')
      const cursorOverlay2 = page2.locator('[data-testid="cursor-overlay"]')
      
      await expect(cursorOverlay1).toBeVisible()
      await expect(cursorOverlay2).toBeVisible()
      
      // Move mouse on page1 and check if cursor appears on page2
      await page1.mouse.move(400, 300)
      await page1.waitForTimeout(100)
      
      // Check if remote cursor appears on page2
      const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(remoteCursor).toBeVisible({ timeout: 5000 })
      
      // Verify cursor has correct styling
      const cursorElement = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(cursorElement).toHaveCSS('position', 'absolute')
      await expect(cursorElement).toHaveCSS('pointer-events', 'none')
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should show user names on cursors', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Wait for presence system
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Move mouse on page1
      await page1.mouse.move(400, 300)
      await page1.waitForTimeout(100)
      
      // Check if user name label appears on page2
      const userNameLabel = page2.locator('[data-testid="cursor-user-name"]').first()
      await expect(userNameLabel).toBeVisible({ timeout: 5000 })
      
      // Verify the label contains text
      const labelText = await userNameLabel.textContent()
      expect(labelText).toBeTruthy()
      expect(labelText!.length).toBeGreaterThan(0)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should differentiate cursor colors for different users', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const context3 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    const page3 = await context3.newPage()
    
    try {
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      await page3.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      await page3.waitForLoadState('networkidle')
      
      // Wait for presence system
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      await page3.waitForTimeout(2000)
      
      // Move mouse on different pages
      await page1.mouse.move(200, 200)
      await page2.mouse.move(400, 300)
      await page3.mouse.move(600, 400)
      
      await page1.waitForTimeout(100)
      await page2.waitForTimeout(100)
      await page3.waitForTimeout(100)
      
      // Check cursor colors on page1
      const cursorsOnPage1 = page1.locator('[data-testid="remote-cursor"]')
      await expect(cursorsOnPage1).toHaveCount(2) // Should see 2 other users
      
      // Get cursor colors
      const cursor1Color = await cursorsOnPage1.nth(0).getAttribute('data-color')
      const cursor2Color = await cursorsOnPage1.nth(1).getAttribute('data-color')
      
      // Colors should be different
      expect(cursor1Color).toBeTruthy()
      expect(cursor2Color).toBeTruthy()
      expect(cursor1Color).not.toBe(cursor2Color)
      
    } finally {
      await context1.close()
      await context2.close()
      await context3.close()
    }
  })

  test('should hide cursors when users go offline', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Wait for presence system
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Move mouse on page1
      await page1.mouse.move(400, 300)
      await page1.waitForTimeout(100)
      
      // Verify cursor appears on page2
      const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(remoteCursor).toBeVisible({ timeout: 5000 })
      
      // Close page1 (simulate user going offline)
      await context1.close()
      
      // Wait for presence to detect user left
      await page2.waitForTimeout(3000)
      
      // Cursor should disappear
      await expect(remoteCursor).not.toBeVisible({ timeout: 10000 })
      
    } finally {
      await context2.close()
    }
  })

  test('should update cursor positions in real-time', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Wait for presence system
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Move mouse to initial position
      await page1.mouse.move(200, 200)
      await page1.waitForTimeout(100)
      
      // Check initial cursor position on page2
      const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(remoteCursor).toBeVisible({ timeout: 5000 })
      
      const initialPosition = await remoteCursor.boundingBox()
      expect(initialPosition).toBeTruthy()
      
      // Move mouse to new position
      await page1.mouse.move(400, 300)
      await page1.waitForTimeout(100)
      
      // Wait for cursor position to update
      await page2.waitForTimeout(500)
      
      // Check if cursor position changed
      const newPosition = await remoteCursor.boundingBox()
      expect(newPosition).toBeTruthy()
      
      // Positions should be different
      expect(newPosition!.x).not.toBe(initialPosition!.x)
      expect(newPosition!.y).not.toBe(initialPosition!.y)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle cursor updates with low latency', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Wait for presence system
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Measure latency
      const startTime = Date.now()
      
      // Move mouse on page1
      await page1.mouse.move(400, 300)
      
      // Wait for cursor to appear on page2
      const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(remoteCursor).toBeVisible({ timeout: 5000 })
      
      const endTime = Date.now()
      const latency = endTime - startTime
      
      // Latency should be under 50ms target
      expect(latency).toBeLessThan(50)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should not show own cursor', async ({ page }) => {
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Wait for presence system
    await page.waitForTimeout(2000)
    
    // Move mouse
    await page.mouse.move(400, 300)
    await page.waitForTimeout(100)
    
    // Should not see own cursor in remote cursors
    const remoteCursors = page.locator('[data-testid="remote-cursor"]')
    await expect(remoteCursors).toHaveCount(0)
  })

  test('should handle rapid cursor movements smoothly', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Wait for presence system
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Perform rapid mouse movements
      for (let i = 0; i < 10; i++) {
        const x = 200 + (i * 20)
        const y = 200 + (i * 10)
        await page1.mouse.move(x, y)
        await page1.waitForTimeout(10)
      }
      
      // Check that cursor updates are smooth
      const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(remoteCursor).toBeVisible({ timeout: 5000 })
      
      // Cursor should be visible and not flickering
      await expect(remoteCursor).toBeVisible()
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

