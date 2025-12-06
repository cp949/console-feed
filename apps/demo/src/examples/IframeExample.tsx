import { Console, Decode, Hook, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * iframe 통신 예제
 * iframe 내부의 console.log를 메인 윈도우의 console-feed에 표시합니다.
 */
const IframeExample: React.FC = () => {
  const [logs, setLogs] = useState<Message[]>([])
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const hookedConsoleRef = useRef<HookedConsole | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // iframe 생성
    const iframe = document.createElement('iframe')
    iframe.src = './iframe.html'
    iframe.style.display = 'none' // 화면에 보이지 않도록 설정
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    iframeRef.current = iframe

    // iframe 로드 완료 대기
    const handleLoad = () => {
      if (!iframe.contentWindow) {
        console.error('iframe contentWindow is not available')
        return
      }

      // iframe의 console을 Hook
      // TypeScript 타입 단언: contentWindow는 Window 타입이며 console 속성을 가집니다
      const iframeConsole = (
        iframe.contentWindow as Window & { console: globalThis.Console }
      ).console
      const hookedConsole = Hook(
        iframeConsole,
        (log) => {
          // Decode를 사용하여 로그를 디코딩
          const decoded = Decode(log)
          const message: Message = {
            ...decoded,
            id: `log-${Date.now()}-${Math.random()}`,
            data: decoded.data || [],
          }
          setLogs((prevLogs) => [...prevLogs, message])
        },
        true, // encode: true
        100, // limit: 100
      )

      hookedConsoleRef.current = hookedConsole
    }

    iframe.addEventListener('load', handleLoad)

    // Cleanup: 컴포넌트 언마운트 시 정리
    return () => {
      if (hookedConsoleRef.current && iframe.contentWindow) {
        Unhook(hookedConsoleRef.current)
        hookedConsoleRef.current = null
      }
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.parentNode.removeChild(iframeRef.current)
        iframeRef.current = null
      }
      iframe.removeEventListener('load', handleLoad)
    }
  }, [])

  return (
    <div>
      <div className={commonStyles.infoBox}>
        <p className={commonStyles.infoText}>
          iframe 내부에서 실행되는 console.log가 여기에 표시됩니다.
        </p>
      </div>
      <div className={commonStyles.consoleContainer}>
        <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </div>
  )
}

export default IframeExample
