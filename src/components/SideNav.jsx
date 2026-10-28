import { NavLink } from 'react-router-dom'

// 侧边导航：6 个页面，顺序固定（铁律）。第 1 轮只做入口，点进页面是占位文字。
const navItems = [
  // [图标，名字，路由地址]
  ['🏠', '首页 · 我的小盼头看板', '/'],
  ['📁', '我的项目集', '/projects'],
  ['📝', '灵感笔记', '/notes'],
  ['✨', '轻松打卡', '/checkins'],
  ['🌿', '近期期待 · 时间地图', '/hopes'],
  ['💬', 'AI 灵感聊天', '/chat'],
]

export default function SideNav() {
  return (
    <aside className="w-60 shrink-0 border-r border-gold/40 bg-cream-soft/60 px-5 py-8 hidden md:block">
      {/* 品牌区：唯一的小“棱角”高亮，作为视觉焦点 */}
      <div className="mb-10">
        <div className="text-2xl font-bold tracking-wide text-lavender-deep">盼头空间</div>
        <div className="text-xs text-softink mt-1">HopefulSpace</div>
        <div className="text-xs text-softink mt-3 leading-relaxed">
          计划仅供参考<br />节奏由你掌握 ✨
        </div>
      </div>

      {/* 导航列表 */}
      <nav className="space-y-1">
        {navItems.map(([icon, label, to]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'} // 首页链接必须加 end：否则任意页面下首页都会误高亮
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-lavender text-lavender-deep font-semibold'
                  : 'text-softink hover:bg-mist/60 hover:text-ink'
              }`
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-12 text-[11px] text-softink leading-relaxed">
        纯前端原型 · 数据只存在你的浏览器<br />
        不喊口号 · 不催进度 · 不制造焦虑 🌱
      </div>
    </aside>
  )
}
