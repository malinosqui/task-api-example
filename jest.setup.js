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