import { test, expect } from '@playwright/test'

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected canvas page
    await page.goto('/canvas')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('h1')).toContainText('Login')
  })

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for signup link
    await expect(page.locator('a[href="/signup"]')).toBeVisible()
  })

  test('should display signup form correctly', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for login link
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })

  test('should handle signup with valid credentials', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Fill signup form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message or redirect
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 10000 })
  })

  test('should handle signup with invalid email', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Fill signup form with invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid email')).toBeVisible({ timeout: 5000 })
  })

  test('should handle signup with weak password', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Fill signup form with weak password
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Password too short')).toBeVisible({ timeout: 5000 })
  })

  test('should handle login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to canvas or show success
    await expect(page).toHaveURL(/.*canvas/, { timeout: 10000 })
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('should handle magic link login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill email for magic link
    await page.fill('input[type="email"]', 'test@example.com')
    
    // Click magic link button
    await page.click('button:has-text("Send Magic Link")')
    
    // Should show success message
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 5000 })
  })

  test('should handle password reset', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
    
    // Fill email for password reset
    await page.fill('input[type="email"]', 'test@example.com')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 5000 })
  })

  test('should handle logout', async ({ page }) => {
    // First login (assuming we have a way to mock authentication)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Mock successful login by setting auth state
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      window.dispatchEvent(new Event('storage'))
    })
    
    // Navigate to canvas
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Click logout button
    await page.click('button:has-text("Logout")')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/)
  })

  test('should persist session across page refreshes', async ({ page }) => {
    // Mock successful login
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      window.dispatchEvent(new Event('storage'))
    })
    
    // Navigate to canvas
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be on canvas page
    await expect(page).toHaveURL(/.*canvas/)
  })

  test('should handle session expiration', async ({ page }) => {
    // Mock expired session
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'expired-token')
      window.dispatchEvent(new Event('storage'))
    })
    
    // Navigate to canvas
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to login after detecting expired session
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 })
  })

  test('should show loading states during authentication', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show loading state
    await expect(page.locator('button:has-text("Loading")')).toBeVisible()
    await expect(page.locator('button[disabled]')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/**', route => {
      route.abort('failed')
    })
    
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Network error')).toBeVisible({ timeout: 10000 })
  })

  test('should validate form fields', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should handle email already exists error', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Fill form with existing email
    await page.fill('input[type="email"]', 'existing@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Email already exists')).toBeVisible({ timeout: 5000 })
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access canvas page
    await page.goto('/canvas')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
    
    // Mock successful login
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
      window.dispatchEvent(new Event('storage'))
    })
    
    // Navigate to login and submit
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect back to canvas
    await expect(page).toHaveURL(/.*canvas/, { timeout: 10000 })
  })
})

