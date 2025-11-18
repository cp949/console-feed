// Vitest test setup file
// This file is loaded before running tests (configured in vitest.config.ts)

// Import jest-dom matchers for Vitest
// Provides custom matchers like toBeInTheDocument(), toHaveStyle(), etc.
import '@testing-library/jest-dom/vitest'

// Polyfill for Element.prototype.getRootNode in older jsdom environments
// Required for React component testing compatibility
if (typeof Element !== 'undefined' && !Element.prototype.getRootNode) {
  Element.prototype.getRootNode = function () {
    return document
  }
}
