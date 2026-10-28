import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  readProjects,
  readNotes,
  readCheckItems,
  readCheckLogs,
  readHopes,
  readChats,
  readChatMessages,
  nowISO,
} from '../storage.js'

// 导出备份：把浏览器里的全部数据下载成一个 JSON 文件（只做导出，MVP 不做导入）
function exportBackup() {
  const data = {
    app: 'hopefulspace',
    exportedAt: nowISO(),
    projects: readProjects(),
    notes: readNotes(),
    checkItems: readCheckItems(),
    checkLogs: readCheckLogs(),
    hopes: readHopes(),
    chats: readChats(),
    chatMessages: readChatMessages(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hopefulspace_backup_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 随机治愈欢迎语池：刷新一次换一条
const GREETINGS = [
  '你好呀 👋 今天也慢慢来',
  '欢迎回来 🌿 今天有什么小盼头？',
  '新的一天，轻轻松松开始吧 ☁️',
  '不管今天多忙，都留一点时间给自己 ✨',
  '愿你今天有一个温柔的盼头 🌱',
]

// 今日小收获快照：从「近 30 天的灵感笔记 + 打卡记录」里随机抽一条
function pickMorsel() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 天前的毫秒数
  const recent =
    readNotes()
      .map((n) => ({ ...n, kind: 'note' }))
      .filter((x) => new Date(x.createdAt).getTime() >= cutoff)
      .concat(
        readCheckLogs()
          .map((l) => ({ ...l, kind: 'checklog' }))
          .filter((x) => new Date(x.createdAt).getTime() >= cutoff)
      )
  if (recent.length === 0) return null
  return recent[Math.floor(Math.random() * recent.length)]
}

export default function HomePage() {
  // 欢迎语和快照都是「每次进首页 / 点一下按钮」就随机换一条
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
  const [morsel, setMorsel] = useState(() => pickMorsel())
  const [searchInput, setSearchInput] = useState('')

  // 柔和统计卡片：只显示数量 —— 不做完成率、不做 KPI（铁律）；点击可跳到对应页面
  const stats = [
    ['📁', '项目', readProjects().length, '/projects'],
    ['📝', '灵感笔记', readNotes().length, '/notes'],
    ['✨', '打卡事项', readCheckItems().length, '/checkins'],
    ['🌿', '近期期待', readHopes().length, '/hopes'],
  ]

  // 快照内容渲染：抽到笔记、抽到打卡，两种样式
  function renderMorsel() {
    if (!morsel) {
      return (
        <p className="mt-4 text-sm text-softink leading-relaxed">
          今天还没有留下小记录 🌱 一切都好，不必为了记录而记录，有空了随时来写。
        </p>
      )
    }
    if (morsel.kind === 'note') {
      return (
        <div className="mt-4 text-sm text-ink leading-relaxed">
          <div className="font-semibold">📝 {morsel.title || '无标题的小碎片'}</div>
          <p className="mt-1 text-softink">{morsel.content.slice(0, 80)}</p>
        </div>
      )
    }
    // checklog：从事项表里找回这个打卡事项的名字
    const itemName = readCheckItems().find((c) => c.id === morsel.checkItemId)?.name || '某次打卡'
    return (
      <div className="mt-4 text-sm text-ink leading-relaxed">
        <div className="font-semibold">✨ {itemName}</div>
        <p className="mt-1 text-softink">
          {morsel.moodEmoji ?? ''} {morsel.recordDate} 的那一次
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-ink">{greeting}</h1>
        <p className="mt-2 text-sm text-softink">看看你的小盼头们，今天也轻轻松松。</p>

        {/* 全站搜索入口（跳转 /search 页面，不进侧边导航，导航顺序保持 6 项不变） */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const t = searchInput.trim()
            if (t) window.location.hash = `#/search?q=${encodeURIComponent(t)}`
          }}
          className="mt-5 flex gap-2 max-w-md"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜遍笔记、项目、盼头、打卡事项…"
            className="flex-1 rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
          />
          <button
            type="submit"
            className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
          >
            🔍 搜索
          </button>
        </form>
      </section>

      {/* 柔和统计卡片（只做数量） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(([icon, label, value, to]) => (
          <Link
            key={label}
            to={to}
            className="rounded-card bg-white/70 border border-mist/40 p-6 text-center shadow-soft hover:shadow-lift hover:-translate-y-0.5"
          >
            <div className="text-2xl">{icon}</div>
            <div className="mt-2 text-sm text-softink">{label}</div>
            <div className="text-xl font-semibold text-ink">{value}</div>
          </Link>
        ))}
      </div>

      {/* 今日小收获快照 */}
      <div className="rounded-card bg-white/70 border border-gold/30 p-8 shadow-soft">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-ink">🌱 今日小收获快照</h2>
          <button
            onClick={() => setMorsel(pickMorsel())}
            className="text-xs rounded-pill bg-mist px-4 py-1.5 text-mist-deep hover:bg-lavender"
          >
            🔁 换一条看看
          </button>
        </div>
        {renderMorsel()}
        <p className="mt-4 text-xs text-softink">
          ✨ 只看最近 30 天里随机抽出的一小件事，不比较、不计量，它就是今天的小念想。
        </p>
      </div>

      {/* 低调的导出备份按钮（首页固定位置） */}
      <footer className="pt-2 text-center">
        <button
          onClick={exportBackup}
          className="rounded-pill bg-cream-soft px-4 py-2 text-xs text-softink hover:bg-gold"
        >
          💾 导出我的数据备份
        </button>
        <p className="mt-2 text-[11px] text-softink">
          把浏览器里的全部数据下载成一份 hopefulspace_backup_日期.json。纯前端原型，导入功能暂未提供。
        </p>
      </footer>
    </div>
  )
}
