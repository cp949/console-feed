import './polyfills'
import { useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Console, Decode, Hook, Unhook } from '@cp949/console-feed'

declare global {
  interface Window {
    __consoleFeedChrome75?: {
      done: boolean
      captured: boolean
      decoded: boolean
      rendered: boolean
      restored: boolean
      styled: boolean
      errors: string[]
    }
  }
}

const distinctiveLog = 'console-feed-chrome75-packed-consumer'
const result = {
  done: false,
  captured: false,
  decoded: false,
  rendered: false,
  restored: false,
  styled: false,
  errors: [] as string[],
}

window.__consoleFeedChrome75 = result

const rootElement = document.getElementById('root')
const originalLog = console.log
let hookedConsole: ReturnType<typeof Hook> | undefined
let completed = false

function finish(error?: unknown) {
  if (completed) return
  completed = true

  if (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  if (hookedConsole) {
    try {
      Unhook(hookedConsole)
    } catch (unhookError) {
      result.errors.push(
        unhookError instanceof Error
          ? unhookError.message
          : String(unhookError),
      )
    }
  }

  result.restored = console.log === originalLog
  result.done = true
}

function CommitProbe() {
  useLayoutEffect(() => {
    // Console의 DOM commit 이후에만 계산 스타일과 완료 상태를 검사한다.
    requestAnimationFrame(() => {
      try {
        const message = document.querySelector('[data-method="log"]')
        const styles = message ? getComputedStyle(message) : null

        result.rendered =
          message?.textContent?.includes(distinctiveLog) === true
        result.styled =
          styles?.display === 'flex' &&
          styles.color.length > 0 &&
          styles.borderTopStyle === 'solid'
      } catch (error) {
        finish(error)
      } finally {
        finish()
      }
    })
  }, [])

  return null
}

if (!rootElement) {
  finish(new Error('#root 요소를 찾을 수 없습니다'))
} else {
  let root: ReturnType<typeof createRoot> | undefined

  try {
    root = createRoot(rootElement)
    hookedConsole = Hook(console, (encoded) => {
      try {
        const decoded = Decode(encoded)
        result.captured = decoded.data?.includes(distinctiveLog) === true
        result.decoded =
          decoded.method === 'log' &&
          decoded.data?.includes(distinctiveLog) === true

        if (!root) throw new Error('React root를 초기화하지 못했습니다')
        root.render(
          <>
            <Console logs={[decoded]} />
            <CommitProbe />
          </>,
        )
      } catch (error) {
        finish(error)
      }
    })

    console.log(distinctiveLog)
  } catch (error) {
    finish(error)
  }
}
