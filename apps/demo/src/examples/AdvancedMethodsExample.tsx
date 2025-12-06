import React, { useState, useEffect, useRef } from 'react'
import { Hook, Console, Decode, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * 고급 콘솔 메서드 예제
 * console.table, console.count, console.time, console.assert 등의 고급 메서드를 시연합니다.
 */
const AdvancedMethodsExample: React.FC = () => {
  const [logs, setLogs] = useState<Message[]>([])
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

    // 고급 콘솔 메서드 예제
    setTimeout(() => {
      // console.table 예제
      console.table([
        { name: 'Alice', age: 25, city: 'Seoul' },
        { name: 'Bob', age: 30, city: 'Busan' },
        { name: 'Charlie', age: 35, city: 'Incheon' },
      ])

      // console.count 예제
      console.count('카운터')
      console.count('카운터')
      console.count('다른 카운터')
      console.count('카운터')

      // console.time / console.timeEnd 예제
      console.time('타이머')
      setTimeout(() => {
        console.timeEnd('타이머')
      }, 100)

      // console.assert 예제
      console.assert(true, '이것은 표시되지 않습니다 (true)')
      console.assert(false, '이것은 표시됩니다 (false)')
      console.assert(1 === 1, '이것도 표시되지 않습니다')
      console.assert(1 === 2, '이것은 표시됩니다 (1 !== 2)')

      // console.group 예제 (group은 직접 지원하지 않지만 log로 시뮬레이션)
      console.log('그룹 시작')
      console.log('  그룹 내부 메시지 1')
      console.log('  그룹 내부 메시지 2')
      console.log('그룹 끝')

      // console.dir 예제
      console.dir({ nested: { object: { with: 'deep structure' } } })

      // 복합 예제
      console.log('테이블과 함께:', [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
      ])
    }, 100)

    return () => {
      if (hookedConsoleRef.current) {
        Unhook(hookedConsoleRef.current)
        hookedConsoleRef.current = null
      }
    }
  }, [])

  const triggerExamples = () => {
    // console.table
    console.table([
      { product: 'Laptop', price: 1200, stock: 5 },
      { product: 'Mouse', price: 25, stock: 50 },
      { product: 'Keyboard', price: 75, stock: 30 },
    ])

    // console.count
    console.count('버튼 클릭')
    console.count('버튼 클릭')

    // console.time
    console.time('작업 시간')
    setTimeout(() => {
      console.timeEnd('작업 시간')
    }, 500)

    // console.assert
    const value = Math.random()
    console.assert(value > 0.5, `값이 0.5보다 작습니다: ${value.toFixed(2)}`)
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
        <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
          고급 콘솔 메서드: table, count, time/timeEnd, assert 등을 시연합니다.
        </p>
        <button
          onClick={triggerExamples}
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
          예제 다시 실행
        </button>
      </div>

      <div className={commonStyles.consoleContainer}>
        <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </div>
  )
}

export default AdvancedMethodsExample
