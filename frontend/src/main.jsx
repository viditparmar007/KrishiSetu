import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

document.addEventListener('click', (event) => {
  const element = event.target instanceof Element ? event.target.closest('a, button') : null
  if (!element || element.textContent?.trim() !== 'Get Started') return

  const story = document.getElementById('story')
  if (!story) return

  event.preventDefault()
  event.stopPropagation()
  story.scrollIntoView({ behavior: 'smooth', block: 'start' })
}, true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
