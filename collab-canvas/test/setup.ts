// Global test setup
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Global setup before all tests
  console.log('Setting up test environment...');
});

afterAll(() => {
  // Global cleanup after all tests
  console.log('Cleaning up test environment...');
});
