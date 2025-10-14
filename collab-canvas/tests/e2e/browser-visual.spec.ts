import { test, expect, describe } from 'vitest'
import { chromium } from 'playwright-core'

describe('Browser Visual E2E Tests', () => {
  test('open browser and navigate to canvas', async () => {
    // Launch a visible browser
    const browser = await chromium.launch({ 
      headless: false, // This will show the browser
      devtools: true   // Open devtools
    })
    
    const page = await browser.newPage()
    
    // Navigate to your app (assuming it's running on localhost:3000)
    await page.goto('http://localhost:3000/canvas')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if canvas toolbar is visible
    const toolbar = page.locator('[data-testid="canvas-toolbar"]')
    const isToolbarVisible = await toolbar.isVisible()
    console.log('🎨 Canvas toolbar visible:', isToolbarVisible)
    
    // Check if shape creation buttons are visible
    const addRectangleBtn = page.locator('[data-testid="add-rectangle-btn"]')
    const isRectangleBtnVisible = await addRectangleBtn.isVisible()
    console.log('🔲 Add Rectangle button visible:', isRectangleBtnVisible)
    
    const addCircleBtn = page.locator('[data-testid="add-circle-btn"]')
    const isCircleBtnVisible = await addCircleBtn.isVisible()
    console.log('⭕ Add Circle button visible:', isCircleBtnVisible)
    
    const addTextBtn = page.locator('[data-testid="add-text-btn"]')
    const isTextBtnVisible = await addTextBtn.isVisible()
    console.log('📝 Add Text button visible:', isTextBtnVisible)
    
    // Click the add rectangle button
    await addRectangleBtn.click()
    
    // Wait a moment for the shape to be added
    await page.waitForTimeout(2000)
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/canvas-with-rectangle.png' })
    
    // Keep browser open for a few seconds so you can see it
    await page.waitForTimeout(3000)
    
    // Close the browser
    await browser.close()
  })
  
  test('test homepage in browser', async () => {
    const browser = await chromium.launch({ 
      headless: false,
      devtools: true
    })
    
    const page = await browser.newPage()
    
    // Navigate to homepage
    await page.goto('http://localhost:3000/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the page title contains CollabCanvas
    const title = await page.title()
    expect(title).toContain('CollabCanvas')
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage.png' })
    
    // Keep browser open for a few seconds
    await page.waitForTimeout(3000)
    
    await browser.close()
  })
})
