import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainWindow from './pages/MainWindow'
import EditorWindow from './pages/EditorWindow'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainWindow />} />
        <Route path="/editor/:fileId" element={<EditorWindow />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)