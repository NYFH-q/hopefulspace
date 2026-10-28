import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  readProjects,
  createProject,
  toggleArchive,
  removeProjectById,
  countNotesInProject,
  formatDate,
} from '../storage.js'

// 内置图标集合（固定：内置图标，不是自定义标签，以后也不随便加）
const ICONS = ['🌱', '🪴', '📚', '🎨', '💻', '🎵', '✈️', '🏡', '⭐', '🧶']

// 内置柔和颜色映射：key 就是存进数据的 colorKey
// ⚠️ 关键坑：必须写完整的类名（bg-lavender），绝不能拼 bg-{color}，
// 否则 Tailwind 按字面扫描的时候找不到，样式不会生成。
const COLOR_CARDS = {
  lavender: 'bg-lavender',
  mint: 'bg-mint',
  gold: 'bg-gold',
  mist: 'bg-mist',
}
const COLOR_CHIPS = COLOR_CARDS

export default function ProjectsPage() {
  const [projects, setProjects] = useState(readProjects)
  const [openCreate, setOpenCreate] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null) // 正在确认删除的项目
  const [draft, setDraft] = useState({ name: '', iconKey: ICONS[0], colorKey: 'lavender' })

  function handleCreate() {
    const name = draft.name.trim() || '未命名项目'
    createProject(name, draft.iconKey, draft.colorKey)
    setProjects(readProjects()) // 重新从仓库读一遍，页面和存储永远一致
    setOpenCreate(false)
    setDraft({ name: '', iconKey: ICONS[0], colorKey: 'lavender' })
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">我的项目集</h1>
          <p className="mt-2 text-sm text-softink">
            项目是「虚拟文件夹」：把灵感归到一起，只是应用内的逻辑整理，不碰你电脑里的文件。
          </p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
        >
          ＋ 新建一个项目
        </button>
      </section>

      {projects.length === 0 ? (
        <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
          <div className="text-3xl">🌱</div>
          <p className="mt-3 text-sm text-softink leading-relaxed">
            还没有项目，不急 —— 想到什么主题（比如「学吉他」「装修小屋」）再建一个就好，或者先去记自由灵感。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-card bg-white/70 border border-gold/30 p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${COLOR_CARDS[p.colorKey] || COLOR_CARDS.mist} flex items-center justify-center text-2xl shrink-0`}
                >
                  {p.iconKey}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink truncate">{p.name}</h3>
                    {p.isArchived && (
                      <span className="text-xs rounded-pill bg-gold px-2.5 py-0.5 text-gold-deep">
                        📦 已归档
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-softink mt-1">
                    {countNotesInProject(p.id)} 篇灵感笔记 · 创建于 {formatDate(p.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Link
                  to={`/projects/${p.id}`}
                  className="text-xs rounded-pill bg-mist px-4 py-1.5 text-mist-deep hover:bg-lavender"
                >
                  查看详情
                </Link>
                <button
                  onClick={() => {
                    toggleArchive(p.id)
                    setProjects(readProjects())
                  }}
                  className="text-xs rounded-pill bg-cream-soft px-4 py-1.5 text-softink hover:bg-gold"
                >
                  {p.isArchived ? '🌤 移出归档' : '📦 收进归档'}
                </button>
                <button
                  onClick={() => setRemoveTarget(p)}
                  className="text-xs rounded-pill px-4 py-1.5 text-softink hover:bg-gold"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建项目弹窗：轻量遮罩 + 居中卡片，点击遮罩可关闭 */}
      {openCreate && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setOpenCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-cream p-8 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">新建项目</h2>

            <label className="mt-5 block text-xs text-softink">项目名字</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="比如：学吉他 / 装修小屋"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
            />

            <label className="mt-5 block text-xs text-softink">挑一个图标</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setDraft({ ...draft, iconKey: ic })}
                  className={`rounded-2xl py-2 text-2xl ${
                    draft.iconKey === ic ? 'bg-lavender ring-2 ring-lavender-deep' : 'bg-mist/50 hover:bg-mist'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>

            <label className="mt-5 block text-xs text-softink">挑一个柔和颜色</label>
            <div className="mt-2 flex gap-3">
              {Object.keys(COLOR_CHIPS).map((ck) => (
                <button
                  key={ck}
                  onClick={() => setDraft({ ...draft, colorKey: ck })}
                  className={`h-10 w-10 rounded-full ${COLOR_CHIPS[ck]} ${
                    draft.colorKey === ck ? 'ring-2 ring-ink ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setOpenCreate(false)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                先不建
              </button>
              <button
                onClick={handleCreate}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                建好它 🌱
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认浮层：柔和的二次确认，不依赖浏览器原生弹窗 */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setRemoveTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-cream p-8 shadow-lift text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">📦</div>
            <h2 className="mt-3 text-lg font-semibold text-ink">把「{removeTarget.name}」收起来？</h2>
            <p className="mt-2 text-sm text-softink leading-relaxed">
              项目会从列表里移走，但它下面的灵感笔记和近期期待都不会删除，只是回到自由灵感，随时还能看到。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                先留着
              </button>
              <button
                onClick={() => {
                  removeProjectById(removeTarget.id)
                  setProjects(readProjects())
                  setRemoveTarget(null)
                }}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                收起来 🌤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
