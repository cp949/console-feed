if (typeof Element !== 'undefined' && !Element.prototype.getRootNode) {
  Element.prototype.getRootNode = function () {
    return document
  }
}

require('@testing-library/jest-dom')
