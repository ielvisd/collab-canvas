// Simple browser test that will definitely show you a browser
import { chromium } from 'playwright-core';

async function runBrowserTest() {
  console.log('🚀 Launching browser...');
  
  // Launch a visible browser
  const browser = await chromium.launch({ 
    headless: false, // This will show the browser
    devtools: true   // Open devtools
  });
  
  console.log('✅ Browser launched! You should see a Chrome window open.');
  
  const page = await browser.newPage();
  
  console.log('🌐 Navigating to your app...');
  
  try {
    // Navigate to your app (assuming it's running on localhost:3000)
    await page.goto('http://localhost:3000/canvas');
    
    console.log('⏳ Waiting for page to load...');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded! Looking for canvas elements...');
    
    // Check if canvas toolbar is visible
    const toolbar = page.locator('[data-testid="canvas-toolbar"]');
    const isToolbarVisible = await toolbar.isVisible();
    console.log('🎨 Canvas toolbar visible:', isToolbarVisible);
    
    // Check if shape creation buttons are visible
    const addRectangleBtn = page.locator('[data-testid="add-rectangle-btn"]');
    const isRectangleBtnVisible = await addRectangleBtn.isVisible();
    console.log('🔲 Add Rectangle button visible:', isRectangleBtnVisible);
    
    const addCircleBtn = page.locator('[data-testid="add-circle-btn"]');
    const isCircleBtnVisible = await addCircleBtn.isVisible();
    console.log('⭕ Add Circle button visible:', isCircleBtnVisible);
    
    const addTextBtn = page.locator('[data-testid="add-text-btn"]');
    const isTextBtnVisible = await addTextBtn.isVisible();
    console.log('📝 Add Text button visible:', isTextBtnVisible);
    
    if (isRectangleBtnVisible) {
      console.log('🖱️ Clicking Add Rectangle button...');
      await addRectangleBtn.click();
      
      // Wait a moment for the shape to be added
      await page.waitForTimeout(2000);
      
      console.log('📸 Taking screenshot...');
      // Take a screenshot for visual verification
      await page.screenshot({ path: 'test-results/canvas-with-rectangle.png' });
      console.log('✅ Screenshot saved to test-results/canvas-with-rectangle.png');
    }
    
    console.log('⏳ Keeping browser open for 5 seconds so you can see it...');
    // Keep browser open for a few seconds so you can see it
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.log('💡 Make sure your Nuxt app is running on http://localhost:3000');
    console.log('   Run: pnpm dev');
  }
  
  console.log('🔒 Closing browser...');
  await browser.close();
  console.log('✅ Test completed!');
}

// Run the test
runBrowserTest().catch(console.error);
