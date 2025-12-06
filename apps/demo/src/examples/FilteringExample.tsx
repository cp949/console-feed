import { Console, Decode, Hook, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'
import type { Methods } from '@cp949/console-feed/src/definitions/Methods'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * 필터링 및 검색 기능 예제
 * 메서드별 필터링과 키워드 검색 기능을 시연합니다.
 */
const FilteringExample: React.FC = () => {
  const [logs, setLogs] = useState<Message[]>([])
  const [filter, setFilter] = useState<Methods[]>([])
  const [searchKeywords, setSearchKeywords] = useState('')
  const hookedConsoleRef = useRef<HookedConsole | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (log) => {
        const decoded = Decode(log)
        const message: Message = {
          ...decoded,
          id: `log-${Date.now()}-${Math.random()}`,
          data: decoded.data || [],
        }
        setLogs((prevLogs) => [...prevLogs, message])
      },
      true,
      100,
    )

    hookedConsoleRef.current = hookedConsole

    // 다양한 메서드로 예제 로그 생성
    console.log('일반 로그 메시지')
    console.warn('경고 메시지')
    console.error('에러 메시지')
    console.info('정보 메시지')
    console.debug('디버그 메시지')
    console.log('검색 가능한 키워드: React, TypeScript, console-feed')
    console.warn('중요한 경고: 이것은 테스트입니다')
    console.error('심각한 에러가 발생했습니다')
    console.log('객체 데이터:', { name: 'test', value: 123 })
    console.info('추가 정보 메시지')

    return () => {
      if (hookedConsoleRef.current) {
        Unhook(hookedConsoleRef.current)
        hookedConsoleRef.current = null
      }
    }
  }, [])

  const toggleFilter = (method: Methods) => {
    setFilter((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    )
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
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
            }}
          >
            메서드 필터:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['log', 'warn', 'error', 'info', 'debug'] as Methods[]).map(
              (method) => (
                <button
                  key={method}
                  onClick={() => toggleFilter(method)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: `2px solid ${filter.includes(method) ? '#4CAF50' : '#e0e0e0'}`,
                    backgroundColor: filter.includes(method)
                      ? '#4CAF50'
                      : '#fff',
                    color: filter.includes(method) ? '#fff' : '#242424',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {method}
                  {filter.includes(method) && ' ✓'}
                </button>
              ),
            )}
            {filter.length > 0 && (
              <button
                onClick={() => setFilter([])}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e0e0e0',
                  backgroundColor: '#fff',
                  color: '#242424',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                모두 해제
              </button>
            )}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
            }}
          >
            키워드 검색:
          </label>
          <input
            type="text"
            value={searchKeywords}
            onChange={(e) => setSearchKeywords(e.target.value)}
            placeholder="검색어를 입력하세요 (정규식 지원)"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}
          />
          <p
            style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.85rem',
              color: '#666',
            }}
          >
            정규식을 사용할 수 있습니다. 예: <code>React|TypeScript</code>,{' '}
            <code>^에러</code>
          </p>
        </div>
      </div>

      <div className={commonStyles.consoleContainer}>
        <Console
          logs={logs}
          variant={theme === 'dark' ? 'dark' : 'light'}
          filter={filter}
          searchKeywords={searchKeywords}
        />
      </div>
    </div>
  )
}

export default FilteringExample
