import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainWindow from './pages/MainWindow'
import EditorWindow from './pages/EditorWindow'
import SettingsWindow from './pages/SettingsWindow'
import { useSettingsStore, applyTheme } from './store/settings'
import './index.css'

// 应用初始化组件
function AppInit({ children }: { children: React.ReactNode }) {
  const { appearance } = useSettingsStore()

  useEffect(() => {
    // 应用保存的主题设置
    applyTheme(appearance)

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (appearance.theme === 'system') {
        applyTheme(appearance)
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [appearance])

  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppInit>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainWindow />} />
          <Route path="/editor/:fileId" element={<EditorWindow />} />
          <Route path="/settings" element={<SettingsWindow />} />
        </Routes>
      </HashRouter>
    </AppInit>
  </React.StrictMode>
)