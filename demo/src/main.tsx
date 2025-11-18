import { createRoot } from 'react-dom/client'
import { App } from './index'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(<App />)
}
