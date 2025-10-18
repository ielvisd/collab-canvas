// Simple test script to verify undo/redo functionality
// Run this in the browser console after loading the canvas page

console.log('🧪 Testing Undo/Redo Functionality...')

// Test 1: Add an emoji and verify it can be undone
console.log('Test 1: Adding emoji...')
// This would be tested by:
// 1. Clicking the emoji button
// 2. Selecting an emoji
// 3. Verifying it appears on canvas
// 4. Pressing Cmd/Ctrl+Z or clicking Undo
// 5. Verifying emoji disappears

// Test 2: Add a shape and verify it can be undone
console.log('Test 2: Adding shape...')
// This would be tested by:
// 1. Clicking the Shapes dropdown
// 2. Selecting a rectangle
// 3. Verifying it appears on canvas
// 4. Pressing Cmd/Ctrl+Z or clicking Undo
// 5. Verifying shape disappears

// Test 3: Move an object and verify it can be undone
console.log('Test 3: Moving object...')
// This would be tested by:
// 1. Adding an emoji or shape
// 2. Selecting it
// 3. Dragging it to a new position
// 4. Pressing Cmd/Ctrl+Z or clicking Undo
// 5. Verifying it returns to original position

// Test 4: Delete an object and verify it can be undone
console.log('Test 4: Deleting object...')
// This would be tested by:
// 1. Adding an emoji or shape
// 2. Selecting it
// 3. Pressing Delete key or clicking Delete Selected
// 4. Pressing Cmd/Ctrl+Z or clicking Undo
// 5. Verifying object reappears

// Test 5: Multiple undo/redo operations
console.log('Test 5: Multiple operations...')
// This would be tested by:
// 1. Adding multiple objects
// 2. Making various changes (move, resize, delete)
// 3. Using undo multiple times
// 4. Using redo multiple times
// 5. Verifying correct order of operations

// Test 6: Page refresh persistence
console.log('Test 6: Page refresh persistence...')
// This would be tested by:
// 1. Making some changes
// 2. Refreshing the page
// 3. Verifying undo/redo history is still available
// 4. Testing undo/redo after refresh

console.log('✅ Test cases defined. Run these manually in the browser to verify functionality.')

// Helper function to check undo/redo state
window.checkUndoRedoState = () => {
  console.log('Current undo/redo state:')
  console.log('- Can undo:', document.querySelector('[data-testid="undo-button"]')?.disabled === false)
  console.log('- Can redo:', document.querySelector('[data-testid="redo-button"]')?.disabled === false)
}

// Helper function to simulate undo
window.simulateUndo = () => {
  const undoButton = document.querySelector('[data-testid="undo-button"]')
  if (undoButton && !undoButton.disabled) {
    undoButton.click()
    console.log('✅ Undo executed')
  } else {
    console.log('❌ Undo not available')
  }
}

// Helper function to simulate redo
window.simulateRedo = () => {
  const redoButton = document.querySelector('[data-testid="redo-button"]')
  if (redoButton && !redoButton.disabled) {
    redoButton.click()
    console.log('✅ Redo executed')
  } else {
    console.log('❌ Redo not available')
  }
}

console.log('Helper functions available:')
console.log('- checkUndoRedoState() - Check current undo/redo state')
console.log('- simulateUndo() - Simulate undo button click')
console.log('- simulateRedo() - Simulate redo button click')
