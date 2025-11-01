// Silence structured logger during test runs
jest.mock('./src/lib/logger.js', () => {
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  };
});

// Disable snapshot testing
expect.extend({
  toMatchSnapshot: () => {
    throw new Error('Snapshot testing is disabled. Use explicit assertions instead.');
  },
  toMatchInlineSnapshot: () => {
    throw new Error('Snapshot testing is disabled. Use explicit assertions instead.');
  },
});

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
}); 
