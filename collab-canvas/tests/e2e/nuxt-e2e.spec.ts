import { test, expect, describe } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

describe('Nuxt E2E Tests', async () => {
  await setup({
    // Nuxt test context options
    rootDir: './',
    browser: true, // Enable browser testing
    browserOptions: {
      type: 'chromium',
      launch: {
        headless: false, // Show browser window
        devtools: true, // Open devtools
      },
    },
  })

  test('homepage loads correctly', async () => {
    // Test that the homepage returns a valid response
    const html = await $fetch('/')
    
    // Check if the page contains expected content
    expect(html).toContain('CollabCanvas')
  })

  test('canvas page is accessible', async () => {
    // Test that the canvas page returns a valid response
    const html = await $fetch('/canvas')
    
    // Check if the page contains expected content
    expect(html).toContain('canvas')
  })

  test('can create browser page and interact', async () => {
    // Create a browser page for more advanced testing
    const page = await createPage('/canvas')
    
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
  })

  test('can interact with canvas elements', async () => {
    const page = await createPage('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Click the add rectangle button
    const addRectangleBtn = page.locator('[data-testid="add-rectangle-btn"]')
    await addRectangleBtn.click()
    
    // Wait a moment for the shape to be added
    await page.waitForTimeout(1000)
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/canvas-with-rectangle.png' })
  })
})
