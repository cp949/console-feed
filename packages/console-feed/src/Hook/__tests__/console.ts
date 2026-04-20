import { HookedConsole, Message } from '../../definitions/Console'

interface Console extends HookedConsole {
  logs: Message[]
  $log: Function
}

const hookedConsole = globalThis.console as Console

hookedConsole.logs = []
;['log', 'warn', 'info', 'error', 'debug', 'assert', 'time', 'timeEnd'].forEach(
  (method) => {
    hookedConsole[`$${method}`] = hookedConsole[method]
    hookedConsole[method] = () => {}
  },
)

export default hookedConsole
