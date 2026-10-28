import { HashRouter, Routes, Route } from 'react-router-dom'
import SideNav from './components/SideNav.jsx'
import HomePage from './pages/HomePage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import NotesPage from './pages/NotesPage.jsx'
import CheckinsPage from './pages/CheckinsPage.jsx'
import HopesPage from './pages/HopesPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import SearchPage from './pages/SearchPage.jsx'

// 路由主文件：HashRouter 让地址变成 http://localhost:5173/#/projects 这种形式。
// 好处：部署到 GitHub Pages 等纯静态托管时不用配任何服务器规则，双击打开也能用。
export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen">
        {/* 左边固定侧边导航 */}
        <SideNav />
        {/* 右边内容区 */}
        <main className="flex-1 px-8 py-8 md:px-12 md:py-10 max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/checkins" element={<CheckinsPage />} />
            <Route path="/hopes" element={<HopesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
