import { Console, Decode, Hook, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * 에러 스택 트레이스 예제
 * 다양한 에러 객체와 스택 트레이스를 시연합니다.
 */
const ErrorStackTraceExample: React.FC = () => {
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

    // 에러 스택 트레이스 예제 로그 생성
    setTimeout(() => {
      // 기본 Error 객체
      const basicError = new Error('기본 에러 메시지')
      console.error('기본 Error 객체:', basicError)

      // TypeError
      try {
        const obj: any = null
        obj.someMethod()
      } catch (e) {
        console.error('TypeError (null 참조):', e)
      }

      // ReferenceError
      try {
        // @ts-expect-error - 의도적으로 정의되지 않은 변수 사용
        console.log(undefinedVariable)
      } catch (e) {
        console.error('ReferenceError (정의되지 않은 변수):', e)
      }

      // RangeError
      try {
        const arr = new Array(-1)
      } catch (e) {
        console.error('RangeError (잘못된 배열 크기):', e)
      }

      // SyntaxError (일반적으로는 파싱 시 발생하지만, 예제로 시뮬레이션)
      try {
        eval('const x = {')
      } catch (e) {
        console.error('SyntaxError (문법 오류):', e)
      }

      // 커스텀 에러 클래스
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string,
        ) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const customError = new CustomError('커스텀 에러 메시지', 'CUSTOM_001')
      console.error('커스텀 에러:', customError)

      // 중첩된 함수 호출로 스택 트레이스 생성
      function functionA() {
        functionB()
      }

      function functionB() {
        functionC()
      }

      function functionC() {
        const error = new Error('중첩된 함수 호출에서 발생한 에러')
        console.error('중첩 함수 호출 에러:', error)
      }

      functionA()

      // 비동기 에러
      setTimeout(() => {
        const asyncError = new Error('비동기 함수에서 발생한 에러')
        console.error('비동기 에러:', asyncError)
      }, 100)

      // Promise rejection (catch로 잡기)
      Promise.reject(new Error('Promise rejection 에러')).catch((e) => {
        console.error('Promise rejection:', e)
      })

      // 에러와 함께 추가 정보
      const errorWithContext = new Error('컨텍스트가 있는 에러')
      console.error('에러 발생 위치:', 'src/utils/api.ts', 'line 42')
      console.error('에러 객체:', errorWithContext)
      console.error('에러 상세 정보:', {
        error: errorWithContext,
        timestamp: new Date().toISOString(),
        userId: 'user123',
        requestId: 'req-456',
      })

      // 여러 에러를 한 번에
      console.error('여러 에러:', [
        new Error('에러 1'),
        new Error('에러 2'),
        new TypeError('타입 에러'),
      ])

      // 에러 메시지와 스택 트레이스 분리
      const detailedError = new Error('상세한 에러 메시지')
      console.error('에러 메시지:', detailedError.message)
      console.error('에러 스택:', detailedError.stack)
      console.error('에러 이름:', detailedError.name)
    }, 100)

    return () => {
      if (hookedConsoleRef.current) {
        Unhook(hookedConsoleRef.current)
        hookedConsoleRef.current = null
      }
    }
  }, [])

  const triggerError = () => {
    // 동적으로 에러 생성
    const dynamicError = new Error('동적으로 생성된 에러')
    console.error('동적 에러:', dynamicError)
  }

  const triggerNestedError = () => {
    function level1() {
      function level2() {
        function level3() {
          const error = new Error('3단계 중첩 함수에서 발생한 에러')
          console.error('중첩 에러:', error)
        }
        level3()
      }
      level2()
    }
    level1()
  }

  const triggerAsyncError = () => {
    setTimeout(() => {
      const asyncError = new Error('비동기 작업에서 발생한 에러')
      console.error('비동기 에러:', asyncError)
    }, 100)
  }

  return (
    <div>
      <div className={commonStyles.infoBox}>
        <p className={commonStyles.infoText}>
          다양한 에러 객체와 스택 트레이스를 시연합니다.
          <br />
          console-feed는 에러 객체의 스택 트레이스를 자동으로 포맷팅하여
          표시합니다.
        </p>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={triggerError}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--accent-color)',
              backgroundColor: 'var(--accent-color)',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            에러 생성
          </button>
          <button
            onClick={triggerNestedError}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--accent-color)',
              backgroundColor: 'var(--accent-color)',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            중첩 에러
          </button>
          <button
            onClick={triggerAsyncError}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--accent-color)',
              backgroundColor: 'var(--accent-color)',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            비동기 에러
          </button>
        </div>
      </div>

      <div className={commonStyles.consoleContainer}>
        <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </div>
  )
}

export default ErrorStackTraceExample
