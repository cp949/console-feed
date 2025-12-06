import { Console } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * 커스텀 로그 함수 예제
 * iframe에서 myLog() 함수를 호출하여 메인 윈도우의 console-feed에 출력합니다.
 */
const CustomLogExample: React.FC = () => {
  const [logs, setLogs] = useState<Message[]>([])
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // iframe 생성
    const iframe = document.createElement('iframe')
    iframe.src = './iframe-custom.html'
    iframe.style.display = 'none'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    iframeRef.current = iframe

    // postMessage를 통한 커스텀 로그 수신
    const handleMessage = (event: MessageEvent) => {
      // 보안: 같은 origin에서 온 메시지만 처리
      if (event.origin !== window.location.origin) {
        return
      }

      if (event.data && event.data.type === 'customLog') {
        const { method, data } = event.data

        // Message 형식으로 직접 생성 (Encode는 네트워크 전송용)
        const message: Message = {
          method: method || 'log',
          data: Array.isArray(data) ? data : [data],
          id: `log-${Date.now()}-${Math.random()}`,
        }

        setLogs((prevLogs) => [...prevLogs, message])
      }
    }

    window.addEventListener('message', handleMessage)

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage)
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.parentNode.removeChild(iframeRef.current)
        iframeRef.current = null
      }
    }
  }, [])

  return (
    <div>
      <div className={commonStyles.infoBox}>
        <p className={commonStyles.infoText}>
          iframe에서 myLog() 함수를 호출하면 여기에 표시됩니다.
        </p>
      </div>
      <div className={commonStyles.consoleContainer}>
        <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </div>
  )
}

export default CustomLogExample
