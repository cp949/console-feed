import { Console, Decode, Encode } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * 네트워크 전송 예제
 * Encode/Decode를 사용하여 네트워크를 통해 로그를 전송하고 수신하는 시뮬레이션
 */
const NetworkExample: React.FC = () => {
  const [logs, setLogs] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { theme } = useTheme()

  // 네트워크 전송 시뮬레이션: 로컬 스토리지 사용
  useEffect(() => {
    const simulateNetwork = () => {
      // 로컬 스토리지에서 로그 읽기 (서버에서 받은 것처럼 시뮬레이션)
      const storedLogs = localStorage.getItem('console-feed-logs')
      if (storedLogs) {
        try {
          const parsedLogs = JSON.parse(storedLogs)
          const decodedLogs: Message[] = parsedLogs.map((log: unknown) => {
            const decoded = Decode(log)
            return {
              ...decoded,
              id: `log-${Date.now()}-${Math.random()}`,
              data: decoded.data || [],
            }
          })
          setLogs(decodedLogs)
          setIsConnected(true)
        } catch (e) {
          console.error('Failed to decode logs:', e)
        }
      }
    }

    simulateNetwork()

    // 주기적으로 로그 확인 (폴링 시뮬레이션)
    intervalRef.current = setInterval(simulateNetwork, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const sendLog = (method: string, ...data: unknown[]) => {
    // 로그를 Encode하여 직렬화
    const encoded = Encode(
      {
        method,
        data,
        timestamp: new Date().toISOString(),
      },
      100, // limit: 100
    )

    // 네트워크 전송 시뮬레이션: 로컬 스토리지에 저장
    const existingLogs = localStorage.getItem('console-feed-logs')
    const logs = existingLogs ? JSON.parse(existingLogs) : []
    logs.push(encoded)

    // 최대 50개만 유지
    if (logs.length > 50) {
      logs.shift()
    }

    localStorage.setItem('console-feed-logs', JSON.stringify(logs))
  }

  const clearLogs = () => {
    localStorage.removeItem('console-feed-logs')
    setLogs([])
  }

  return (
    <div>
      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '8px',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: 0, color: '#666' }}>
            Encode/Decode를 사용하여 네트워크를 통해 로그를 전송하고 수신합니다.
            <br />
            로컬 스토리지를 사용하여 네트워크 전송을 시뮬레이션합니다.
          </p>
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#4CAF50' : '#f44336',
              }}
            />
            <span style={{ fontSize: '0.9rem' }}>
              {isConnected ? '연결됨' : '연결 안 됨'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => sendLog('log', '네트워크를 통해 전송된 로그')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #4CAF50',
              backgroundColor: '#4CAF50',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            로그 전송
          </button>
          <button
            onClick={() => sendLog('warn', '경고 메시지 전송')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ff9800',
              backgroundColor: '#ff9800',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            경고 전송
          </button>
          <button
            onClick={() => sendLog('error', '에러 메시지 전송')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #f44336',
              backgroundColor: '#f44336',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            에러 전송
          </button>
          <button
            onClick={() =>
              sendLog('log', '복잡한 객체:', { nested: { data: [1, 2, 3] } })
            }
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #2196F3',
              backgroundColor: '#2196F3',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            객체 전송
          </button>
          <button
            onClick={clearLogs}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              color: '#242424',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            로그 지우기
          </button>
        </div>
      </div>

      <div className={commonStyles.consoleContainer}>
        <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </div>
  )
}

export default NetworkExample
