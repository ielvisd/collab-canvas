import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected canvas page
    await page.goto('/canvas')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h2')).toContainText('Sign in to your account')
  })

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check magic link option
    await expect(page.locator('button:has-text("Send Magic Link")')).toBeVisible()
    
    // Check forgot password link
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible()
  })

  test('should display signup form correctly', async ({ page }) => {
    await page.goto('/signup')
    
    // Check form elements
    await expect(page.locator('input[name="fullName"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('input[type="checkbox"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display forgot password form correctly', async ({ page }) => {
    await page.goto('/forgot-password')
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check back to login link
    await expect(page.locator('a:has-text("Back to login")')).toBeVisible()
  })

  test('should display reset password form correctly', async ({ page }) => {
    await page.goto('/reset-password')
    
    // Check form elements
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check back to login link
    await expect(page.locator('a:has-text("Sign in here")')).toBeVisible()
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login')
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should show validation errors for short password', async ({ page }) => {
    await page.goto('/signup')
    
    // Enter short password
    await page.fill('input[name="fullName"]', 'John Doe')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('should show validation error for password mismatch', async ({ page }) => {
    await page.goto('/signup')
    
    // Enter mismatched passwords
    await page.fill('input[name="fullName"]', 'John Doe')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'differentpassword')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Passwords don\'t match')).toBeVisible()
  })

  test('should require terms agreement for signup', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill form but don't check terms
    await page.fill('input[name="fullName"]', 'John Doe')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=You must agree to the terms')).toBeVisible()
  })

  test('should navigate between auth pages', async ({ page }) => {
    await page.goto('/login')
    
    // Go to signup
    await page.click('a:has-text("Sign up")')
    await expect(page).toHaveURL('/signup')
    
    // Go to forgot password
    await page.goto('/login')
    await page.click('a:has-text("Forgot your password?")')
    await expect(page).toHaveURL('/forgot-password')
    
    // Go back to login
    await page.click('a:has-text("Back to login")')
    await expect(page).toHaveURL('/login')
  })
})
