import { describe, it, expect } from 'vitest';

describe('Example test', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello').toContain('hello');
  });
});
