import { Decode, Encode } from '../index'

describe('Prototype pollution prevention', () => {
  it('filters __proto__, constructor, prototype keys', () => {
    const malicious = {
      __proto__: { isAdmin: true },
      constructor: { prototype: { isAdmin: true } },
      prototype: { hacked: true },
      safe: 'value',
    }

    const message = {
      method: 'log',
      timestamp: new Date().toISOString(),
      data: [malicious],
    }

    const encoded = Encode(message)
    const decoded = Decode(encoded)
    const decodedObject = decoded.data && decoded.data[0]

    expect(({} as any).isAdmin).toBeUndefined()
    const ownKeys = decodedObject && Object.getOwnPropertyNames(decodedObject)
    expect(ownKeys).not.toContain('__proto__')
    expect(ownKeys).not.toContain('constructor')
    expect(ownKeys).not.toContain('prototype')
    expect(decodedObject.safe).toEqual('value')
  })
})
