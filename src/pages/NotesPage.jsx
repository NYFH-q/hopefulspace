import { useState } from 'react'
import {
  readNotes,
  readProjects,
  createNote,
  updateNote,
  removeNoteById,
  formatDate,
} from '../storage.js'

// 📝 灵感笔记：增删改查 + 可选关联项目 + 最多 2 个心情标签 + 关键词搜索（第 3 轮完整版）
export default function NotesPage() {
  const [notes, setNotes] = useState(readNotes)
  const [projects, setProjects] = useState(readProjects)
  const [query, setQuery] = useState('')
  // editor：null=关闭；'new'=新建；某个笔记对象=编辑那个笔记
  const [editor, setEditor] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [draft, setDraft] = useState({ title: '', content: '', projectId: '', tag1: '', tag2: '' })

  function refresh() {
    setNotes(readNotes())
    setProjects(readProjects())
  }

  function openNew() {
    setDraft({ title: '', content: '', projectId: '', tag1: '', tag2: '' })
    setEditor('new')
  }

  function openEdit(n) {
    setDraft({
      title: n.title,
      content: n.content,
      projectId: n.projectId || '',
      tag1: n.moodTags[0] || '',
      tag2: n.moodTags[1] || '',
    })
    setEditor(n)
  }

  function save() {
    // 标签最多 2 个：两个输入框都填了也只取前两个非空的（铁律+模型约束）
    const moodTags = [draft.tag1.trim(), draft.tag2.trim()].filter(Boolean).slice(0, 2)
    const payload = {
      title: draft.title.trim(),           // 允许空标题（无标题碎片）
      content: draft.content,              // 正文是主角
      projectId: draft.projectId || null,  // null = 自由灵感
      moodTags,
    }
    if (editor === 'new') createNote(payload)
    else updateNote(editor.id, payload)
    refresh()
    setEditor(null)
  }

  function handleRemove() {
    removeNoteById(removeTarget.id)
    refresh()
    setRemoveTarget(null)
  }

  // 简单前端关键词搜索：只看标题和正文
  const q = query.trim().toLowerCase()
  const filtered = q
    ? notes.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
    : notes

  function projectName(id) {
    const p = projects.find((x) => x.id === id)
    return p ? `${p.iconKey} ${p.name}` : ''
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">灵感笔记</h1>
          <p className="mt-2 text-sm text-softink">
            一个念头、一句话、一段摘抄都可以是笔记；没想好归到哪就让它先自由飘着。
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
        >
          ＋ 记一条灵感
        </button>
      </section>

      <div className="rounded-pill bg-white/70 border border-mist/50 px-4 py-2 flex items-center gap-2">
        <span className="text-sm text-softink">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题或正文…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      {notes.length === 0 ? (
        <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
          <div className="text-3xl">💭</div>
          <p className="mt-3 text-sm text-softink leading-relaxed">
            还没有灵感笔记。此刻想到的任何碎片都值得记下来 —— 不用完整，不用成文。
          </p>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
              <p className="text-sm text-softink">
                没有找到和「{query.trim()}」有关的笔记。换个词试试，或者直接记一条新的。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className="rounded-card bg-white/70 border border-gold/30 p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink">{n.title || '无标题小碎片'}</h3>
                    {n.projectId && (
                      <span className="text-xs rounded-pill bg-mist px-2.5 py-0.5 text-mist-deep">
                        {projectName(n.projectId)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-softink leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                  {n.moodTags.length > 0 && (
                    <div className="mt-3 flex gap-1.5">
                      {n.moodTags.map((t) => (
                        <span key={t} className="text-xs rounded-pill bg-lavender px-2 py-0.5 text-lavender-deep">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-softink">记于 {formatDate(n.createdAt)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(n)}
                        className="text-xs rounded-pill bg-cream-soft px-3.5 py-1 text-softink hover:bg-gold"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setRemoveTarget(n)}
                        className="text-xs rounded-pill px-3.5 py-1 text-softink hover:bg-gold"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 新建 / 编辑笔记弹窗（共用同一个） */}
      {editor && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setEditor(null)}
        >
          <div
            className="w-full max-w-lg rounded-card bg-cream p-8 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">
              {editor === 'new' ? '记一条灵感' : '整理这条灵感'}
            </h2>

            <label className="mt-5 block text-xs text-softink">标题（可以留空）</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="想个名字，或者直接留空"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
            />

            <label className="mt-5 block text-xs text-softink">正文</label>
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={6}
              placeholder="随便写点什么，不需要完整…"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-lavender"
            />

            <label className="mt-5 block text-xs text-softink">放进哪个项目（可选）</label>
            <select
              value={draft.projectId}
              onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
            >
              <option value="">🌱 自由灵感（不属于项目）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.iconKey} {p.name}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs text-softink">心情标签（最多 2 个，可选）</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input
                value={draft.tag1}
                onChange={(e) => setDraft({ ...draft, tag1: e.target.value })}
                placeholder="标签一，比如：兴奋"
                className="w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
              />
              <input
                value={draft.tag2}
                onChange={(e) => setDraft({ ...draft, tag2: e.target.value })}
                placeholder="标签二，比如：平静"
                className="w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
              />
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setEditor(null)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                先不写
              </button>
              <button
                onClick={save}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                {editor === 'new' ? '记下来 ✨' : '保存整理 🌿'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认浮层（与项目页同款柔和确认） */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setRemoveTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-cream p-8 shadow-lift text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">🍂</div>
            <h2 className="mt-3 text-lg font-semibold text-ink">
              把这条灵感收起来？
            </h2>
            <p className="mt-2 text-sm text-softink leading-relaxed">
              笔记会被移除，这是你自己做的决定 —— 收起来之后，随时可以重新记下新的灵感。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                先留着
              </button>
              <button
                onClick={handleRemove}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                收起来 🍃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
