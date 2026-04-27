export { default as Console } from './Component'
export { default as Hook } from './Hook'
export { default as Unhook } from './Unhook'

import { ComponentOverrides as _ComponentOverrides } from './definitions/ComponentOverrides'
export type ComponentOverrides = _ComponentOverrides
export type { Message } from './definitions/Component'
export type { HookedConsole } from './definitions/Console'
export type { Methods } from './definitions/Methods'

export { Decode } from './Transform'
export { Encode } from './Transform'
