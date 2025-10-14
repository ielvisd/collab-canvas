import { test, expect } from '@playwright/test'

test.describe('Multi-User Collaboration E2E Tests', () => {
  test('should sync shapes between multiple users', async ({ browser }) => {
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
      
      // User 1 creates a rectangle
      await page1.click('button:has-text("Rectangle")')
      await page1.mouse.move(200, 200)
      await page1.mouse.down()
      await page1.mouse.move(300, 300)
      await page1.mouse.up()
      
      // Wait for shape to be created and synced
      await page1.waitForTimeout(1000)
      
      // Check if rectangle appears on page2
      const rectangleOnPage2 = page2.locator('[data-testid="shape-rectangle"]').first()
      await expect(rectangleOnPage2).toBeVisible({ timeout: 10000 })
      
      // Verify rectangle properties
      const rectBounds = await rectangleOnPage2.boundingBox()
      expect(rectBounds).toBeTruthy()
      expect(rectBounds!.x).toBeCloseTo(200, 10)
      expect(rectBounds!.y).toBeCloseTo(200, 10)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should sync shape modifications between users', async ({ browser }) => {
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
      
      // User 1 creates a circle
      await page1.click('button:has-text("Circle")')
      await page1.mouse.move(250, 250)
      await page1.mouse.down()
      await page1.mouse.move(350, 350)
      await page1.mouse.up()
      
      // Wait for sync
      await page1.waitForTimeout(1000)
      
      // User 2 selects and modifies the circle
      await page2.click('[data-testid="shape-circle"]')
      await page2.waitForTimeout(500)
      
      // Drag to resize
      const circle = page2.locator('[data-testid="shape-circle"]').first()
      const initialBounds = await circle.boundingBox()
      
      await page2.mouse.move(initialBounds!.x + initialBounds!.width, initialBounds!.y + initialBounds!.height)
      await page2.mouse.down()
      await page2.mouse.move(initialBounds!.x + initialBounds!.width + 50, initialBounds!.y + initialBounds!.height + 50)
      await page2.mouse.up()
      
      // Wait for sync
      await page2.waitForTimeout(1000)
      
      // Check if modification appears on page1
      const modifiedCircle = page1.locator('[data-testid="shape-circle"]').first()
      await expect(modifiedCircle).toBeVisible()
      
      const newBounds = await modifiedCircle.boundingBox()
      expect(newBounds!.width).toBeGreaterThan(initialBounds!.width)
      expect(newBounds!.height).toBeGreaterThan(initialBounds!.height)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should sync shape deletions between users', async ({ browser }) => {
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
      
      // User 1 creates a text object
      await page1.click('button:has-text("Text")')
      await page1.mouse.click(300, 300)
      await page1.keyboard.type('Hello World')
      await page1.keyboard.press('Escape')
      
      // Wait for sync
      await page1.waitForTimeout(1000)
      
      // Verify text appears on page2
      const textOnPage2 = page2.locator('[data-testid="shape-text"]').first()
      await expect(textOnPage2).toBeVisible({ timeout: 10000 })
      
      // User 2 deletes the text
      await page2.click('[data-testid="shape-text"]')
      await page2.keyboard.press('Delete')
      
      // Wait for sync
      await page2.waitForTimeout(1000)
      
      // Check if text is deleted on page1
      await expect(page1.locator('[data-testid="shape-text"]')).toHaveCount(0)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should show presence indicators for online users', async ({ browser }) => {
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
      await page1.waitForTimeout(3000)
      await page2.waitForTimeout(3000)
      await page3.waitForTimeout(3000)
      
      // Check presence sidebar on page1
      const presenceSidebar = page1.locator('[data-testid="presence-sidebar"]')
      await expect(presenceSidebar).toBeVisible()
      
      // Should show 2 other users
      const onlineUsers = page1.locator('[data-testid="online-user"]')
      await expect(onlineUsers).toHaveCount(2)
      
      // Check user names are displayed
      const userNames = page1.locator('[data-testid="user-name"]')
      await expect(userNames).toHaveCount(2)
      
    } finally {
      await context1.close()
      await context2.close()
      await context3.close()
    }
  })

  test('should display real-time cursors for all users', async ({ browser }) => {
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
      
      // Check if cursor appears on page2
      const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first()
      await expect(remoteCursor).toBeVisible({ timeout: 5000 })
      
      // Move mouse to different position
      await page1.mouse.move(500, 400)
      await page1.waitForTimeout(100)
      
      // Cursor position should update
      const cursorBounds = await remoteCursor.boundingBox()
      expect(cursorBounds).toBeTruthy()
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle concurrent shape creation', async ({ browser }) => {
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
      
      // Both users create shapes simultaneously
      await Promise.all([
        // User 1 creates rectangle
        (async () => {
          await page1.click('button:has-text("Rectangle")')
          await page1.mouse.move(200, 200)
          await page1.mouse.down()
          await page1.mouse.move(300, 300)
          await page1.mouse.up()
        })(),
        
        // User 2 creates circle
        (async () => {
          await page2.click('button:has-text("Circle")')
          await page2.mouse.move(400, 400)
          await page2.mouse.down()
          await page2.mouse.move(500, 500)
          await page2.mouse.up()
        })()
      ])
      
      // Wait for sync
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Both pages should have both shapes
      await expect(page1.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
      await expect(page1.locator('[data-testid="shape-circle"]')).toHaveCount(1)
      
      await expect(page2.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
      await expect(page2.locator('[data-testid="shape-circle"]')).toHaveCount(1)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle user leaving and rejoining', async ({ browser }) => {
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
      
      // User 1 creates a shape
      await page1.click('button:has-text("Rectangle")')
      await page1.mouse.move(200, 200)
      await page1.mouse.down()
      await page1.mouse.move(300, 300)
      await page1.mouse.up()
      
      // Wait for sync
      await page1.waitForTimeout(1000)
      
      // User 2 should see the shape
      await expect(page2.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
      
      // User 2 leaves (close context)
      await context2.close()
      
      // Wait for presence to detect user left
      await page1.waitForTimeout(3000)
      
      // User 2 rejoins (new context)
      const newContext2 = await browser.newContext()
      const newPage2 = await newContext2.newPage()
      
      await newPage2.goto('/canvas')
      await newPage2.waitForLoadState('networkidle')
      await newPage2.waitForTimeout(2000)
      
      // User 2 should still see the shape
      await expect(newPage2.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
      
      await newContext2.close()
      
    } finally {
      await context1.close()
    }
  })

  test('should handle network interruptions gracefully', async ({ browser }) => {
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
      
      // User 1 creates a shape
      await page1.click('button:has-text("Rectangle")')
      await page1.mouse.move(200, 200)
      await page1.mouse.down()
      await page1.mouse.move(300, 300)
      await page1.mouse.up()
      
      // Simulate network interruption on page2
      await page2.route('**/realtime/**', route => {
        route.abort('failed')
      })
      
      // Wait a bit
      await page2.waitForTimeout(2000)
      
      // Restore network
      await page2.unroute('**/realtime/**')
      
      // Wait for reconnection and sync
      await page2.waitForTimeout(5000)
      
      // Shape should eventually appear
      await expect(page2.locator('[data-testid="shape-rectangle"]')).toHaveCount(1, { timeout: 10000 })
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should maintain data consistency during conflicts', async ({ browser }) => {
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
      
      // User 1 creates a shape
      await page1.click('button:has-text("Rectangle")')
      await page1.mouse.move(200, 200)
      await page1.mouse.down()
      await page1.mouse.move(300, 300)
      await page1.mouse.up()
      
      // Wait for sync
      await page1.waitForTimeout(1000)
      
      // Both users try to modify the same shape simultaneously
      await Promise.all([
        // User 1 moves shape
        (async () => {
          await page1.click('[data-testid="shape-rectangle"]')
          await page1.mouse.move(250, 250)
          await page1.mouse.down()
          await page1.mouse.move(350, 350)
          await page1.mouse.up()
        })(),
        
        // User 2 resizes shape
        (async () => {
          await page2.click('[data-testid="shape-rectangle"]')
          await page2.mouse.move(300, 300)
          await page2.mouse.down()
          await page2.mouse.move(400, 400)
          await page2.mouse.up()
        })()
      ])
      
      // Wait for conflict resolution
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)
      
      // Both pages should have consistent state
      const shape1 = page1.locator('[data-testid="shape-rectangle"]').first()
      const shape2 = page2.locator('[data-testid="shape-rectangle"]').first()
      
      await expect(shape1).toBeVisible()
      await expect(shape2).toBeVisible()
      
      // Shapes should have similar properties (allowing for minor differences)
      const bounds1 = await shape1.boundingBox()
      const bounds2 = await shape2.boundingBox()
      
      expect(bounds1).toBeTruthy()
      expect(bounds2).toBeTruthy()
      
      // Positions should be within reasonable range
      expect(Math.abs(bounds1!.x - bounds2!.x)).toBeLessThan(50)
      expect(Math.abs(bounds1!.y - bounds2!.y)).toBeLessThan(50)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

