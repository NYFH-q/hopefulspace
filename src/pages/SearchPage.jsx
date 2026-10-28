import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  readNotes,
  readProjects,
  readHopes,
  readCheckItems,
} from '../storage.js'

// 🔍 全站搜索：一次搜遍 笔记 / 项目 / 近期期待 / 打卡事项
// 入口在首页搜索框（不放进侧边导航，导航顺序保持 6 项不变）
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const [input, setInput] = useState(query)

  function go() {
    setParams({ q: input.trim() })
  }

  const q = query.trim().toLowerCase()

  const notes = q
    ? readNotes().filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.moodTags.some((t) => t.toLowerCase().includes(q))
      )
    : []
  const projects = q
    ? readProjects().filter((p) => p.name.toLowerCase().includes(q))
    : []
  const hopes = q
    ? readHopes().filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          (h.description || '').toLowerCase().includes(q) ||
          (h.vibeTag || '').toLowerCase().includes(q)
      )
    : []
  const items = q
    ? readCheckItems().filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.note || '').toLowerCase().includes(q)
      )
    : []
  const total = notes.length + projects.length + hopes.length + items.length

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-ink">🔍 全站搜索</h1>
        <p className="mt-2 text-sm text-softink">
          一次搜遍：灵感笔记、项目、近期期待、打卡事项。只找内容，不催进度。
        </p>
      </section>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go()
          }}
          placeholder="输个关键词，比如：吉他 / 海边 / 学习"
          className="flex-1 rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
        />
        <button
          onClick={go}
          className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
        >
          搜索
        </button>
      </div>

      {q === '' ? (
        <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
          <div className="text-3xl">💭</div>
          <p className="mt-3 text-sm text-softink leading-relaxed">
            想找什么？也许是一句写过的灵感、一个项目名字，或者一个心念了很久的期盼。
          </p>
        </div>
      ) : total === 0 ? (
        <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
          <p className="text-sm text-softink leading-relaxed">
            没有找到和「{query.trim()}」有关的内容。换个词试试，或者去记一条新的 👀
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-softink">📁 项目（{projects.length}）</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="rounded-2xl bg-white/70 border border-gold/30 px-5 py-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5"
                  >
                    <span className="text-lg">{p.iconKey}</span>
                    <span className="ml-2 font-medium text-ink">{p.name}</span>
                    {p.isArchived && <span className="ml-2 text-xs text-softink">（已归档）</span>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {notes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-softink">📝 灵感笔记（{notes.length}）</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {notes.slice(0, 8).map((n) => (
                  <Link
                    key={n.id}
                    to="/notes"
                    className="rounded-2xl bg-white/70 border border-gold/30 px-5 py-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5"
                  >
                    <div className="font-medium text-ink">{n.title || '无标题小碎片'}</div>
                    <p className="mt-1 text-sm text-softink line-clamp-2">{n.content}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hopes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-softink">🌿 近期期待（{hopes.length}）</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {hopes.slice(0, 8).map((h) => (
                  <Link
                    key={h.id}
                    to="/hopes"
                    className="rounded-2xl bg-white/70 border border-gold/30 px-5 py-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5"
                  >
                    <div className="font-medium text-ink">{h.title}</div>
                    {h.targetAnchorDate && (
                      <p className="mt-1 text-xs text-lavender-deep">📌 目标锚点：{h.targetAnchorDate}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {items.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-softink">✨ 打卡事项（{items.length}）</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    to="/checkins"
                    className="rounded-2xl bg-white/70 border border-gold/30 px-5 py-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5"
                  >
                    <div className="font-medium text-ink">{c.name}</div>
                    {c.note && <p className="mt-1 text-sm text-softink">{c.note}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="text-xs text-softink">
            共找到 {total} 条。点击任意一条跳到对应页面；搜更多的词可以用更细的关键词。
          </p>
        </div>
      )}
    </div>
  )
}
