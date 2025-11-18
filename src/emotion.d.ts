import { Context } from './definitions/Component'

declare module '@emotion/react' {
  export interface Theme extends Context {}
}
