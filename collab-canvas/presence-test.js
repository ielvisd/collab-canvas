// Presence system test - shows two users and their presence
import { chromium } from 'playwright-core';

async function runPresenceTest() {
  console.log('🚀 Starting presence system test...');
  
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
    
    // Wait for presence system to establish
    console.log('⏳ Waiting for presence system to establish...');
    await user1Page.waitForTimeout(3000);
    await user2Page.waitForTimeout(3000);
    
    // Check if presence sidebar is visible
    console.log('🔍 Checking presence sidebar visibility...');
    const user1PresenceSidebar = user1Page.locator('.presence-sidebar');
    const user2PresenceSidebar = user2Page.locator('.presence-sidebar');
    
    const user1SidebarVisible = await user1PresenceSidebar.isVisible();
    const user2SidebarVisible = await user2PresenceSidebar.isVisible();
    
    console.log('👤 User 1 presence sidebar visible:', user1SidebarVisible);
    console.log('👤 User 2 presence sidebar visible:', user2SidebarVisible);
    
    // Check for online users in the sidebar
    console.log('👥 Checking for online users...');
    const user1OnlineUsers = user1Page.locator('.presence-sidebar .space-y-2 > div');
    const user2OnlineUsers = user2Page.locator('.presence-sidebar .space-y-2 > div');
    
    const user1UserCount = await user1OnlineUsers.count();
    const user2UserCount = await user2OnlineUsers.count();
    
    console.log('👤 User 1 sees', user1UserCount, 'other users online');
    console.log('👤 User 2 sees', user2UserCount, 'other users online');
    
    // Take screenshots to verify presence
    console.log('📸 Taking screenshots...');
    await user1Page.screenshot({ path: 'test-results/presence-user1.png' });
    await user2Page.screenshot({ path: 'test-results/presence-user2.png' });
    
    // Keep browsers open for a few seconds so you can see the result
    console.log('⏳ Keeping browsers open for 10 seconds so you can see the presence...');
    await user1Page.waitForTimeout(10000);
    
    console.log('✅ Presence system test completed!');
    console.log('📁 Check test-results/ folder for screenshots showing presence sidebars');
    console.log('🔍 Look for these files:');
    console.log('   - presence-user1.png (User 1 with presence sidebar)');
    console.log('   - presence-user2.png (User 2 with presence sidebar)');
    
  } catch (error) {
    console.error('❌ Error during presence test:', error.message);
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
runPresenceTest().catch(console.error);
