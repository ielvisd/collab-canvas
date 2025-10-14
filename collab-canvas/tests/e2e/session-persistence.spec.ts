import { test, expect } from '@playwright/test'

test.describe('Session Persistence E2E Tests', () => {
  test('should persist session across browser refreshes', async ({ page }) => {
    // Mock successful login
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
      window.dispatchEvent(new Event('storage'))
    })
    
    // Navigate to canvas
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should be on canvas page
    await expect(page).toHaveURL(/.*canvas/)
    
    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be on canvas page
    await expect(page).toHaveURL(/.*canvas/)
    
    // Canvas should be functional
    await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible()
  })

  test('should persist session across tab switches', async ({ context }) => {
    // Mock successful login
    await context.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
    })
    
    // Open canvas in first tab
    const page1 = await context.newPage()
    await page1.goto('/canvas')
    await page1.waitForLoadState('networkidle')
    
    // Create a shape
    await page1.click('button:has-text("Rectangle")')
    await page1.mouse.move(200, 200)
    await page1.mouse.down()
    await page1.mouse.move(300, 300)
    await page1.mouse.up()
    
    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('/canvas')
    await page2.waitForLoadState('networkidle')
    
    // Should be authenticated and see the shape
    await expect(page2).toHaveURL(/.*canvas/)
    await expect(page2.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
    
    // Switch back to first tab
    await page1.bringToFront()
    
    // Should still be authenticated
    await expect(page1).toHaveURL(/.*canvas/)
    await expect(page1.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
  })

  test('should persist session across browser restarts', async ({ browser }) => {
    // First session
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    
    // Mock login
    await page1.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
    })
    
    await page1.goto('/canvas')
    await page1.waitForLoadState('networkidle')
    
    // Create a shape
    await page1.click('button:has-text("Circle")')
    await page1.mouse.move(250, 250)
    await page1.mouse.down()
    await page1.mouse.move(350, 350)
    await page1.mouse.up()
    
    await context1.close()
    
    // Simulate browser restart - new context with same storage
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    
    // Restore session data
    await page2.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
    })
    
    await page2.goto('/canvas')
    await page2.waitForLoadState('networkidle')
    
    // Should be authenticated and see the shape
    await expect(page2).toHaveURL(/.*canvas/)
    await expect(page2.locator('[data-testid="shape-circle"]')).toHaveCount(1)
    
    await context2.close()
  })

  test('should handle session expiration gracefully', async ({ page }) => {
    // Mock expired session
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'expired-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
    })
    
    // Navigate to canvas
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to login after detecting expired session
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 })
    
    // Should show session expired message
    await expect(page.locator('text=Session expired')).toBeVisible()
  })

  test('should clear session data on logout', async ({ page }) => {
    // Mock logged in state
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
    })
    
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Logout
    await page.click('button:has-text("Logout")')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
    
    // Session data should be cleared
    const sessionData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('supabase.auth.token'),
        user: localStorage.getItem('supabase.auth.user')
      }
    })
    
    expect(sessionData.token).toBeNull()
    expect(sessionData.user).toBeNull()
  })

  test('should restore canvas state after session recovery', async ({ page }) => {
    // Mock session with canvas data
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
      localStorage.setItem('canvas-state', JSON.stringify({
        shapes: [
          {
            id: 'shape-1',
            type: 'rectangle',
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            fill: '#ff0000'
          },
          {
            id: 'shape-2',
            type: 'circle',
            x: 300,
            y: 300,
            radius: 50,
            fill: '#00ff00'
          }
        ]
      }))
    })
    
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should restore canvas state
    await expect(page.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="shape-circle"]')).toHaveCount(1)
  })

  test('should handle multiple concurrent sessions', async ({ browser }) => {
    // Create two contexts with same user
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      // Both pages login as same user
      await page1.evaluate(() => {
        localStorage.setItem('supabase.auth.token', 'mock-token')
        localStorage.setItem('supabase.auth.user', JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }))
      })
      
      await page2.evaluate(() => {
        localStorage.setItem('supabase.auth.token', 'mock-token')
        localStorage.setItem('supabase.auth.user', JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }))
      })
      
      await page1.goto('/canvas')
      await page2.goto('/canvas')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Both should be authenticated
      await expect(page1).toHaveURL(/.*canvas/)
      await expect(page2).toHaveURL(/.*canvas/)
      
      // Create shape on page1
      await page1.click('button:has-text("Rectangle")')
      await page1.mouse.move(200, 200)
      await page1.mouse.down()
      await page1.mouse.move(300, 300)
      await page1.mouse.up()
      
      // Should sync to page2
      await page2.waitForTimeout(1000)
      await expect(page2.locator('[data-testid="shape-rectangle"]')).toHaveCount(1)
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should handle session refresh automatically', async ({ page }) => {
    // Mock session that needs refresh
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'refresh-needed-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
    })
    
    // Mock successful token refresh
    await page.route('**/auth/refresh', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        })
      })
    })
    
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should refresh token and stay authenticated
    await expect(page).toHaveURL(/.*canvas/)
    
    // New token should be stored
    const newToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token')
    })
    
    expect(newToken).toBe('new-token')
  })

  test('should show loading state during session validation', async ({ page }) => {
    // Mock slow session validation
    await page.route('**/auth/user', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-123',
            email: 'test@example.com'
          })
        })
      }, 1000)
    })
    
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    
    await page.goto('/canvas')
    
    // Should show loading state
    await expect(page.locator('text=Loading...')).toBeVisible()
    
    // Wait for validation to complete
    await page.waitForLoadState('networkidle')
    
    // Should be authenticated
    await expect(page).toHaveURL(/.*canvas/)
  })

  test('should handle network errors during session validation', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/user', route => {
      route.abort('failed')
    })
    
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to login due to validation failure
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 })
    
    // Should show error message
    await expect(page.locator('text=Session validation failed')).toBeVisible()
  })

  test('should preserve user preferences across sessions', async ({ page }) => {
    // Mock session with user preferences
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      localStorage.setItem('supabase.auth.user', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }))
      localStorage.setItem('user-preferences', JSON.stringify({
        theme: 'dark',
        defaultShapeColor: '#ff0000',
        gridEnabled: true
      }))
    })
    
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should apply user preferences
    const body = page.locator('body')
    await expect(body).toHaveClass(/dark/)
    
    // Check if preferences are applied
    const preferences = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('user-preferences') || '{}')
    })
    
    expect(preferences.theme).toBe('dark')
    expect(preferences.defaultShapeColor).toBe('#ff0000')
    expect(preferences.gridEnabled).toBe(true)
  })
})

