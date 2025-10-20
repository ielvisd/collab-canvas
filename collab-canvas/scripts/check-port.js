#!/usr/bin/env node

import { createServer } from 'net';

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Main function to check port 3000
 */
async function main() {
  const port = 3000;
  
  console.log(`🔍 Checking if port ${port} is available...`);
  
  const isAvailable = await isPortAvailable(port);
  
  if (isAvailable) {
    console.log(`✅ Port ${port} is available!`);
    process.exit(0);
  } else {
    console.log(`❌ Port ${port} is currently in use.`);
    console.log(`\n💡 Another dev server might already be running.`);
    console.log(`   Check if you have a dev server running in another terminal or chat session.`);
    console.log(`   You can kill existing processes with: lsof -ti:3000 | xargs kill -9`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
