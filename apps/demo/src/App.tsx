import React, { useEffect, useState } from 'react'
import styles from './App.module.css'
import { ThemeProvider } from './contexts/ThemeContext'
import AdvancedMethodsExample from './examples/AdvancedMethodsExample'
import BasicExample from './examples/BasicExample'
import CustomLogExample from './examples/CustomLogExample'
import ErrorStackTraceExample from './examples/ErrorStackTraceExample'
import FilteringExample from './examples/FilteringExample'
import IframeExample from './examples/IframeExample'
import NetworkExample from './examples/NetworkExample'
import PerformanceMonitoringExample from './examples/PerformanceMonitoringExample'
import './theme.css'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'console-feed-demo-theme'

type ExampleType =
  | 'basic'
  | 'iframe'
  | 'custom'
  | 'filtering'
  | 'network'
  | 'advanced'
  | 'error'
  | 'performance'

const examples: { id: ExampleType; name: string; description: string }[] = [
  {
    id: 'basic',
    name: '기본 사용법',
    description: '메인 윈도우에서 console-feed를 사용하는 기본 예제',
  },
  {
    id: 'iframe',
    name: 'iframe 통신',
    description: 'iframe의 console.log를 메인 윈도우의 console-feed에 출력',
  },
  {
    id: 'custom',
    name: '커스텀 로그 함수',
    description: 'iframe에서 myLog() 함수를 호출하여 메인 윈도우에 출력',
  },
  {
    id: 'filtering',
    name: '필터링 및 검색',
    description: '메서드별 필터링과 키워드 검색 기능 시연',
  },
  {
    id: 'network',
    name: '네트워크 전송',
    description: 'Encode/Decode를 사용한 네트워크 로그 전송 시뮬레이션',
  },
  {
    id: 'advanced',
    name: '고급 콘솔 메서드',
    description: 'console.table, count, time, assert 등 고급 메서드 시연',
  },
  {
    id: 'error',
    name: '에러 스택 트레이스',
    description: '에러 객체 처리 및 스택 트레이스 포맷팅 예제',
  },
  {
    id: 'performance',
    name: '성능 모니터링',
    description: 'console.time/timeEnd를 활용한 성능 측정 및 메트릭 시각화',
  },
]

const App: React.FC = () => {
  const [activeExample, setActiveExample] = useState<ExampleType>('basic')
  const [theme, setTheme] = useState<Theme>(() => {
    // localStorage에서 테마 불러오기
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme
    return savedTheme || 'light'
  })

  // 테마 변경 시 localStorage에 저장 및 document에 적용
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 초기 마운트 시 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const renderExample = () => {
    switch (activeExample) {
      case 'basic':
        return <BasicExample />
      case 'iframe':
        return <IframeExample />
      case 'custom':
        return <CustomLogExample />
      case 'filtering':
        return <FilteringExample />
      case 'network':
        return <NetworkExample />
      case 'advanced':
        return <AdvancedMethodsExample />
      case 'error':
        return <ErrorStackTraceExample />
      case 'performance':
        return <PerformanceMonitoringExample />
      default:
        return null
    }
  }

  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>console-feed Examples</h1>
            <p className={styles.headerSubtitle}>
              @cp949/console-feed 사용 예제 모음
            </p>
          </div>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`${theme === 'light' ? '다크' : '라이트'} 테마로 전환`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
            <span>{theme === 'light' ? '다크 모드' : '라이트 모드'}</span>
          </button>
        </header>

        <nav className={styles.nav}>
          <div className={styles.navList}>
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`${styles.navButton} ${
                  activeExample === example.id ? styles.navButtonActive : ''
                }`}
              >
                {example.name}
              </button>
            ))}
          </div>
        </nav>

        <main className={styles.main}>
          <div className={styles.exampleInfo}>
            <h2 className={styles.exampleTitle}>
              {examples.find((e) => e.id === activeExample)?.name}
            </h2>
            <p className={styles.exampleDescription}>
              {examples.find((e) => e.id === activeExample)?.description}
            </p>
          </div>

          {renderExample()}
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
