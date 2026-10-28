import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { hydrateDatabase } from './storage.js'
import './index.css'

// 程序的“大门”。先初始化数据库（IndexedDB，含旧数据自动迁移），
// 成功后再把 App 挂到 index.html 的 <div id="root"> 里，
// 保证首屏渲染时页面已经能同步读到数据。
hydrateDatabase()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch((err) => {
    console.warn('数据库初始化失败，改用空数据继续（数据将无法长期保留）：', err)
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
