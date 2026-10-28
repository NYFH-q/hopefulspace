import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  readProjects,
  readNotes,
  toggleArchive,
  removeProjectById,
  formatDate,
} from '../storage.js'

// 颜色映射和项目集页一致（存进数据的 colorKey → 完整类名，不能拼）
const COLOR_CARDS = {
  lavender: 'bg-lavender',
  mint: 'bg-mint',
  gold: 'bg-gold',
  mist: 'bg-mist',
}

// 项目详情页：看项目信息 + 它名下关联的灵感笔记（本轮只读展示，写笔记是第 3 轮）
export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projects, setProjects] = useState(readProjects)
  const [openRemove, setOpenRemove] = useState(false)
  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
        <div className="text-3xl">🍃</div>
        <p className="mt-3 text-sm text-softink">这个项目已经不在列表里了，回项目集看看吧。</p>
        <Link
          to="/projects"
          className="mt-4 inline-block text-xs rounded-pill bg-mist px-4 py-1.5 text-mist-deep hover:bg-lavender"
        >
          ← 回项目集
        </Link>
      </div>
    )
  }

  const notes = readNotes().filter((n) => n.projectId === id)

  function handleRemove() {
    const next = removeProjectById(project.id)
    setProjects(next)
    navigate('/projects') // 删完跳回项目集，避免停留在不存在的详情页
  }

  return (
    <div className="space-y-8">
      <Link to="/projects" className="text-sm text-softink hover:text-ink">
        ← 回项目集
      </Link>

      <section className="rounded-card bg-white/70 border border-gold/30 p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl ${COLOR_CARDS[project.colorKey] || COLOR_CARDS.mist} flex items-center justify-center text-3xl shrink-0`}
          >
            {project.iconKey}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-ink">{project.name}</h1>
              {project.isArchived && (
                <span className="text-xs rounded-pill bg-gold px-2.5 py-0.5 text-gold-deep">
                  📦 已归档
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-softink">
              创建于 {formatDate(project.createdAt)} · {notes.length} 篇关联笔记
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2 flex-wrap">
          <button
            onClick={() => setProjects(toggleArchive(project.id))}
            className="text-xs rounded-pill bg-mist px-4 py-1.5 text-mist-deep hover:bg-lavender"
          >
            {project.isArchived ? '🌤 移出归档' : '📦 收进归档'}
          </button>
          <button
            onClick={() => setOpenRemove(true)}
            className="text-xs rounded-pill px-4 py-1.5 text-softink hover:bg-gold"
          >
            删除这个项目
          </button>
        </div>
      </section>

      <section className="rounded-card bg-white/70 border border-gold/30 p-8 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">📝 关联的灵感笔记</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-softink leading-relaxed">
            这个项目下面还没有笔记。第 3 轮开始，在「灵感笔记」页面新建笔记时可以选择关联到这个项目，到时候就能在这里看到它们了。
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="rounded-2xl bg-cream-soft/60 p-4">
                <div className="font-medium text-ink">{n.title || '无标题小碎片'}</div>
                <p className="mt-1 text-sm text-softink">{n.content}</p>
                {n.moodTags.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {n.moodTags.map((t) => (
                      <span key={t} className="text-xs rounded-pill bg-lavender px-2 py-0.5 text-lavender-deep">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 删除确认浮层（与项目集页同款柔和确认） */}
      {openRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setOpenRemove(false)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-cream p-8 shadow-lift text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">📦</div>
            <h2 className="mt-3 text-lg font-semibold text-ink">把「{project.name}」收起来？</h2>
            <p className="mt-2 text-sm text-softink leading-relaxed">
              项目会从列表里移走，但它下面的灵感笔记和近期期待都不会删除，只是回到自由灵感，随时还能看到。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setOpenRemove(false)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                先留着
              </button>
              <button
                onClick={handleRemove}
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
