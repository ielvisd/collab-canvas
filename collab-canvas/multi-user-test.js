// Multi-user real-time sync test that will show you two browsers
import { chromium } from 'playwright-core';

async function runMultiUserTest() {
  console.log('🚀 Starting multi-user real-time sync test...');
  
  // Launch two browser instances to simulate two users
  const browser1 = await chromium.launch({ 
    headless: false, 
    devtools: true 
  });
  const browser2 = await chromium.launch({ 
    headless: false, 
    devtools: true 
  });
  
  console.log('✅ Two browsers launched! You should see two Chrome windows.');
  
  try {
    // Create two pages (simulating two users)
    const user1Page = await browser1.newPage();
    const user2Page = await browser2.newPage();
    
    // Navigate both users to the canvas
    console.log('🌐 Navigating both users to canvas...');
    await Promise.all([
      user1Page.goto('http://localhost:3000/canvas'),
      user2Page.goto('http://localhost:3000/canvas')
    ]);
    
    // Wait for both pages to load
    await Promise.all([
      user1Page.waitForLoadState('networkidle'),
      user2Page.waitForLoadState('networkidle')
    ]);
    
    console.log('✅ Both users loaded canvas page');
    
    // Wait a moment for real-time sync to establish
    await user1Page.waitForTimeout(2000);
    await user2Page.waitForTimeout(2000);
    
    // User 1 creates a rectangle
    console.log('👤 User 1: Creating rectangle...');
    const user1RectangleBtn = user1Page.locator('[data-testid="add-rectangle-btn"]');
    await user1RectangleBtn.click();
    await user1Page.waitForTimeout(1000);
    
    // User 1 creates a circle
    console.log('👤 User 1: Creating circle...');
    const user1CircleBtn = user1Page.locator('[data-testid="add-circle-btn"]');
    await user1CircleBtn.click();
    await user1Page.waitForTimeout(1000);
    
    // Wait for sync to propagate
    console.log('⏳ Waiting for sync to propagate to User 2...');
    await user2Page.waitForTimeout(3000);
    
    // Check if User 2 can see the shapes (this would require checking the canvas)
    // For now, we'll take screenshots to verify visually
    console.log('📸 Taking screenshots...');
    await user1Page.screenshot({ path: 'test-results/user1-canvas.png' });
    await user2Page.screenshot({ path: 'test-results/user2-canvas.png' });
    
    // User 2 creates a text object
    console.log('👤 User 2: Creating text...');
    const user2TextBtn = user2Page.locator('[data-testid="add-text-btn"]');
    await user2TextBtn.click();
    await user2Page.waitForTimeout(1000);
    
    // Wait for sync to propagate back to User 1
    console.log('⏳ Waiting for sync to propagate to User 1...');
    await user1Page.waitForTimeout(3000);
    
    // Take final screenshots
    console.log('📸 Taking final screenshots...');
    await user1Page.screenshot({ path: 'test-results/user1-final.png' });
    await user2Page.screenshot({ path: 'test-results/user2-final.png' });
    
    // Keep browsers open for a few seconds so you can see the result
    console.log('⏳ Keeping browsers open for 10 seconds so you can see the sync...');
    await user1Page.waitForTimeout(10000);
    
    console.log('✅ Multi-user sync test completed!');
    console.log('📁 Check test-results/ folder for screenshots showing both users\' canvases');
    console.log('🔍 Look for these files:');
    console.log('   - user1-canvas.png (User 1 after creating shapes)');
    console.log('   - user2-canvas.png (User 2 after User 1\'s shapes)');
    console.log('   - user1-final.png (User 1 after User 2\'s text)');
    console.log('   - user2-final.png (User 2 final state)');
    
  } catch (error) {
    console.error('❌ Error during multi-user test:', error.message);
    console.log('💡 Make sure your Nuxt app is running on http://localhost:3000');
    console.log('   Run: pnpm dev');
  } finally {
    // Close both browsers
    console.log('🔒 Closing browsers...');
    await browser1.close();
    await browser2.close();
    console.log('✅ Test completed!');
  }
}

// Run the test
runMultiUserTest().catch(console.error);
