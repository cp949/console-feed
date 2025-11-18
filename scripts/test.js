if (typeof Element !== 'undefined' && !Element.prototype.getRootNode) {
  Element.prototype.getRootNode = function () {
    return document
  }
}

import '@testing-library/jest-dom/vitest'
