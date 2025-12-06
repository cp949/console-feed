import { Console, Decode, Hook, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import commonStyles from './ExampleCommon.module.css'

/**
 * 성능 모니터링 예제
 * console.time / console.timeEnd를 활용한 성능 측정 및 메트릭 시각화
 */
const PerformanceMonitoringExample: React.FC = () => {
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

    // 성능 모니터링 예제 로그 생성
    setTimeout(() => {
      // 기본 타이머 예제
      console.time('기본 작업')
      // 시뮬레이션: 간단한 작업
      for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i)
      }
      console.timeEnd('기본 작업')

      // 여러 타이머 동시 사용
      console.time('데이터 로딩')
      console.time('데이터 처리')
      console.time('데이터 렌더링')

      // 데이터 로딩 시뮬레이션
      setTimeout(() => {
        console.timeEnd('데이터 로딩')
        console.log('데이터 로딩 완료')

        // 데이터 처리 시뮬레이션
        setTimeout(() => {
          console.timeEnd('데이터 처리')
          console.log('데이터 처리 완료')

          // 데이터 렌더링 시뮬레이션
          setTimeout(() => {
            console.timeEnd('데이터 렌더링')
            console.log('데이터 렌더링 완료')
          }, 50)
        }, 30)
      }, 100)

      // 중첩된 타이머
      console.time('전체 프로세스')
      console.time('1단계: 초기화')
      setTimeout(() => {
        console.timeEnd('1단계: 초기화')
        console.time('2단계: 검증')
        setTimeout(() => {
          console.timeEnd('2단계: 검증')
          console.time('3단계: 실행')
          setTimeout(() => {
            console.timeEnd('3단계: 실행')
            console.timeEnd('전체 프로세스')
          }, 40)
        }, 30)
      }, 20)

      // API 호출 시뮬레이션
      console.time('API: 사용자 정보 조회')
      setTimeout(() => {
        console.timeEnd('API: 사용자 정보 조회')
        console.log('사용자 정보:', { id: 1, name: '홍길동' })
      }, 80)

      console.time('API: 주문 목록 조회')
      setTimeout(() => {
        console.timeEnd('API: 주문 목록 조회')
        console.log('주문 목록:', [{ id: 1, total: 50000 }])
      }, 120)

      // 반복 작업 성능 측정
      console.time('배열 처리 (1000개)')
      const arr = Array.from({ length: 1000 }, (_, i) => i)
      arr.forEach((item) => {
        Math.pow(item, 2)
      })
      console.timeEnd('배열 처리 (1000개)')

      console.time('배열 처리 (10000개)')
      const arr2 = Array.from({ length: 10000 }, (_, i) => i)
      arr2.forEach((item) => {
        Math.pow(item, 2)
      })
      console.timeEnd('배열 처리 (10000개)')

      // 복잡한 계산 성능 측정
      console.time('복잡한 계산')
      let result = 0
      for (let i = 0; i < 100000; i++) {
        result += Math.sin(i) * Math.cos(i)
      }
      console.timeEnd('복잡한 계산')
      console.log('계산 결과:', result.toFixed(2))
    }, 100)

    return () => {
      if (hookedConsoleRef.current) {
        Unhook(hookedConsoleRef.current)
        hookedConsoleRef.current = null
      }
    }
  }, [])

  const measureHeavyTask = () => {
    console.time('무거운 작업')
    console.log('무거운 작업 시작...')

    // 무거운 작업 시뮬레이션
    const start = performance.now()
    let sum = 0
    for (let i = 0; i < 5000000; i++) {
      sum += i
    }
    const end = performance.now()

    console.timeEnd('무거운 작업')
    console.log(
      `작업 완료: ${sum.toLocaleString()} (실제 소요: ${(end - start).toFixed(2)}ms)`,
    )
  }

  const measureAsyncTask = () => {
    console.time('비동기 작업')
    console.log('비동기 작업 시작...')

    // 여러 비동기 작업 시뮬레이션
    Promise.all([
      new Promise((resolve) => setTimeout(resolve, 50)),
      new Promise((resolve) => setTimeout(resolve, 80)),
      new Promise((resolve) => setTimeout(resolve, 30)),
    ]).then(() => {
      console.timeEnd('비동기 작업')
      console.log('모든 비동기 작업 완료')
    })
  }

  const measureMultipleOperations = () => {
    console.time('작업 1: 데이터 파싱')
    console.time('작업 2: 데이터 변환')
    console.time('작업 3: 데이터 저장')

    setTimeout(() => {
      console.timeEnd('작업 1: 데이터 파싱')
      console.log('데이터 파싱 완료')
    }, 40)

    setTimeout(() => {
      console.timeEnd('작업 2: 데이터 변환')
      console.log('데이터 변환 완료')
    }, 60)

    setTimeout(() => {
      console.timeEnd('작업 3: 데이터 저장')
      console.log('데이터 저장 완료')
    }, 100)
  }

  // 성능 메트릭 추출 (간단한 시각화)
  const performanceMetrics = logs
    .filter(
      (log) => log.method === 'log' && log.data?.[0]?.toString().includes('ms'),
    )
    .map((log) => {
      const text = log.data?.[0]?.toString() || ''
      const match = text.match(/(.+):\s*(\d+(?:\.\d+)?)ms/)
      if (match) {
        return {
          label: match[1],
          time: parseFloat(match[2]),
        }
      }
      return null
    })
    .filter((m): m is { label: string; time: number } => m !== null)

  const totalTime = performanceMetrics.reduce((sum, m) => sum + m.time, 0)
  const avgTime =
    performanceMetrics.length > 0 ? totalTime / performanceMetrics.length : 0
  const maxTime =
    performanceMetrics.length > 0
      ? Math.max(...performanceMetrics.map((m) => m.time))
      : 0

  return (
    <div>
      <div className={commonStyles.infoBox}>
        <p className={commonStyles.infoText}>
          console.time()과 console.timeEnd()를 사용하여 작업 성능을 측정합니다.
          <br />
          여러 타이머를 동시에 사용하거나 중첩하여 사용할 수 있습니다.
        </p>

        {performanceMetrics.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
              성능 메트릭 요약
            </h3>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              <div>총 측정 횟수: {performanceMetrics.length}회</div>
              <div>평균 소요 시간: {avgTime.toFixed(2)}ms</div>
              <div>최대 소요 시간: {maxTime.toFixed(2)}ms</div>
              <div>총 소요 시간: {totalTime.toFixed(2)}ms</div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={measureHeavyTask}
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
            무거운 작업 측정
          </button>
          <button
            onClick={measureAsyncTask}
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
            비동기 작업 측정
          </button>
          <button
            onClick={measureMultipleOperations}
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
            여러 작업 동시 측정
          </button>
        </div>
      </div>

      <div className={commonStyles.consoleContainer}>
        <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </div>
  )
}

export default PerformanceMonitoringExample
