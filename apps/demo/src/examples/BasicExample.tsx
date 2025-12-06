import React, { useState, useEffect, useRef } from 'react'
import { Hook, Console, Decode, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'
import { useTheme } from '../contexts/ThemeContext'
import styles from './BasicExample.module.css'

/**
 * 기본 사용법 예제
 * 메인 윈도우의 console을 Hook하여 console-feed에 표시합니다.
 */
const BasicExample: React.FC = () => {
  const [logs, setLogs] = useState<Message[]>([])
  const hookedConsoleRef = useRef<HookedConsole | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // console을 Hook하여 로그를 캡처
    const hookedConsole = Hook(
      window.console,
      (log) => {
        // Decode를 사용하여 로그를 디코딩 (필수!)
        const decoded = Decode(log)
        const message: Message = {
          ...decoded,
          id: `log-${Date.now()}-${Math.random()}`,
          data: decoded.data || [],
        }
        setLogs((prevLogs) => [...prevLogs, message])
      },
      true, // encode: true - 네트워크 전송을 위한 직렬화
      100, // limit: 100 - 직렬화 깊이 제한
    )

    hookedConsoleRef.current = hookedConsole

    // 예제 로그 생성
    console.log('기본 사용법 예제가 시작되었습니다.')
    console.log('이 메시지는 console-feed에 표시됩니다.')
    console.warn('경고 메시지 예제')
    console.error('에러 메시지 예제')
    console.info('정보 메시지 예제')
    console.log('객체 예제:', { name: 'console-feed', version: '3.6.5' })
    console.log('배열 예제:', [1, 2, 3, 4, 5])
    console.log(
      '스타일링 예제: %c빨간색 텍스트',
      'color: red; font-weight: bold',
    )
    console.log('URL 예제: https://github.com/cp949/console-feed')

    // Cleanup: 컴포넌트 언마운트 시 Hook 해제
    return () => {
      if (hookedConsoleRef.current) {
        Unhook(hookedConsoleRef.current)
        hookedConsoleRef.current = null
      }
    }
  }, [])

  return (
    <div className={styles.consoleContainer}>
      <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
    </div>
  )
}

export default BasicExample
