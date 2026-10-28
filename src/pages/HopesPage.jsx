import { useState } from 'react'
import {
  readHopes,
  readProjects,
  createHope,
  updateHope,
  removeHopeById,
} from '../storage.js'

// 🌿 近期期待 · 时间地图（第 4 轮完整版）
// 铁律：没有“逾期”状态、绝不自动置顶临近锚点、所有时间推算只是页面运行时临时计算（不存进数据）

const TIME_OPTIONS = ['<1h', '1-3h', '半天左右', '1-2天', '3-5天', '慢慢来，不限']
const VIBES = ['要紧', '加急', '轻松', '随缘']

const VIBE_CLASS = {
  要紧: 'bg-gold text-gold-deep',
  加急: 'bg-lavender text-lavender-deep',
  轻松: 'bg-mint text-mint-deep',
  随缘: 'bg-mist text-mist-deep',
}

const STATUS_META = {
  expecting: { label: '💭 正在期待', chip: 'bg-lavender text-lavender-deep' },
  done: { label: '✅ 已经完成', chip: 'bg-mint text-mint-deep' },
  shelved: { label: '📦 先放一放', chip: 'bg-gold text-gold-deep' },
}

// 预估时长 → 大概提前多少天“可以开始”（只是参考）。
// “慢慢来，不限”不产生建议（没有明确的耗时，就不推算）。
const ESTIMATE_LEAD_DAYS = {
  '<1h': 0,
  '1-3h': 0,
  '半天左右': 1,
  '1-2天': 3,
  '3-5天': 7,
  '慢慢来，不限': null,
}

// 把 YYYY-MM-DD 转成更日常的「10月28日」（跨年时带上年份）
function formatAnchor(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return sameYear
    ? `${d.getMonth() + 1}月${d.getDate()}日`
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// 只有同时填了锚点日期和预估时长，才在条目内部生成一行参考文字
function suggestStart(hope) {
  if (!hope.targetAnchorDate || !hope.timeEstimate) return null
  const lead = ESTIMATE_LEAD_DAYS[hope.timeEstimate]
  if (lead === null || lead === undefined) return null
  const d = new Date(`${hope.targetAnchorDate}T00:00:00`)
  d.setDate(d.getDate() - lead)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 月历格子：周一开头，前面补空位
function monthCells(year, month) {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const total = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

export default function HopesPage() {
  const [hopes, setHopes] = useState(readHopes)
  const [projects, setProjects] = useState(readProjects)
  // 默认排序：按创建时间，最新在最上面（铁律：绝不默认置顶临近锚点）
  const [sortMode, setSortMode] = useState('newest')
  const [editor, setEditor] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [dayPicked, setDayPicked] = useState(null) // 月历点击的日期 { iso }
  const [viewYM, setViewYM] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    projectId: '',
    targetAnchorDate: '',
    timeEstimate: '',
    vibeTag: '',
  })

  function refresh() {
    setHopes(readHopes())
    setProjects(readProjects())
  }

  function openNew() {
    setDraft({ title: '', description: '', projectId: '', targetAnchorDate: '', timeEstimate: '', vibeTag: '' })
    setEditor('new')
  }

  function openEdit(h) {
    setDraft({
      title: h.title,
      description: h.description,
      projectId: h.projectId || '',
      targetAnchorDate: h.targetAnchorDate || '',
      timeEstimate: h.timeEstimate || '',
      vibeTag: h.vibeTag || '',
    })
    setEditor(h)
  }

  function save() {
    // 所有可选字段：空值一律存 null（数据模型规则），绝不存“”空串污染历史
    const payload = {
      title: draft.title.trim() || '一个还没起名的盼头',
      description: draft.description.trim(),
      projectId: draft.projectId || null,
      targetAnchorDate: draft.targetAnchorDate || null, // YYYY-MM-DD 或 null
      timeEstimate: draft.timeEstimate || null,         // 只能从固定下拉里选
      vibeTag: draft.vibeTag || null,
    }
    if (editor === 'new') createHope(payload)
    else updateHope(editor.id, payload)
    refresh()
    setEditor(null)
  }

  function handleRemove() {
    removeHopeById(removeTarget.id)
    refresh()
    setRemoveTarget(null)
  }

  // ---------- 排序（最新创建默认在顶，其余全靠手动切换） ----------
  function sorted() {
    const list = [...hopes]
    if (sortMode === 'anchor') {
      const withDate = list.filter((h) => h.targetAnchorDate).sort((a, b) => (a.targetAnchorDate < b.targetAnchorDate ? -1 : 1))
      const without = list.filter((h) => !h.targetAnchorDate)
      return [...withDate, ...without]
    }
    if (sortMode === 'vibe') {
      const order = { 要紧: 0, 加急: 1, 轻松: 2, 随缘: 3 }
      return list.sort((a, b) => (order[a.vibeTag] ?? 4) - (order[b.vibeTag] ?? 4))
    }
    if (sortMode === 'project') {
      const withP = list.filter((h) => h.projectId).sort((a, b) => (a.projectId < b.projectId ? -1 : 1))
      const without = list.filter((h) => !h.projectId)
      return [...withP, ...without]
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  function projectName(id) {
    const p = projects.find((x) => x.id === id)
    return p ? `${p.iconKey} ${p.name}` : ''
  }

  // 月历上今天的日期（只用来温柔高亮今天，绝不做倒计时）
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const cells = monthCells(viewYM.y, viewYM.m)

  function dotClass(hopesOnDay) {
    const first = hopesOnDay[0]
    if (first.status === 'shelved') return 'bg-mist/50'
    if (first.status === 'done') return 'bg-mint-deep/60'
    return 'bg-lavender-deep/60'
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">近期期待 · 时间地图</h1>
          <p className="mt-2 text-sm text-softink">
            这里只有「盼头」，没有截止。锚点日期、耗时、氛围全部选填，可以随时改、随时放。
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
        >
          ＋ 加一个盼头
        </button>
      </section>

      {/* 排序按钮：默认“最新创建”，其余全手动切换（铁律） */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-softink">排列方式：</span>
        {[
          ['newest', '最新创建'],
          ['anchor', '锚点由近到远'],
          ['vibe', '按氛围'],
          ['project', '按项目'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`rounded-pill px-3.5 py-1.5 text-xs ${
              sortMode === mode ? 'bg-lavender text-lavender-deep font-medium' : 'bg-white/60 text-softink hover:bg-mist/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 期待条目列表 */}
      {hopes.length === 0 ? (
        <div className="rounded-card bg-white/70 border border-gold/30 p-10 text-center shadow-soft">
          <div className="text-3xl">🌿</div>
          <p className="mt-3 text-sm text-softink leading-relaxed">
            还没有期待条目。想去的旅行、想学的小技能、想见的人 —— 先记下来，什么都不用决定。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted().map((h) => {
            const meta = STATUS_META[h.status] || STATUS_META.expecting
            const suggestion = suggestStart(h)
            return (
              <div
                key={h.id}
                className={`rounded-card border p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5 bg-white/70 border-gold/30 ${
                  h.status === 'shelved' ? 'opacity-[0.85] translate-x-1 translate-y-1' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{h.title}</h3>
                    {h.description && (
                      <p className="mt-1.5 text-sm text-softink leading-relaxed">{h.description}</p>
                    )}
                  </div>
                  <span className={`text-xs rounded-pill px-3 py-1 ${meta.chip}`}>{meta.label}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {h.targetAnchorDate && (
                    <span className="text-xs rounded-pill bg-cream-soft px-3 py-1 text-softink">
                      📌 目标锚点：{formatAnchor(h.targetAnchorDate)}
                    </span>
                  )}
                  {h.timeEstimate && (
                    <span className="text-xs rounded-pill bg-cream-soft px-3 py-1 text-softink">
                      ⏳ 预计 {h.timeEstimate}
                    </span>
                  )}
                  {h.vibeTag && (
                    <span className={`text-xs rounded-pill px-3 py-1 ${VIBE_CLASS[h.vibeTag]}`}>
                      氛围 · {h.vibeTag}
                    </span>
                  )}
                  {h.projectId && (
                    <span className="text-xs rounded-pill bg-mist px-3 py-1 text-mist-deep">
                      {projectName(h.projectId)}
                    </span>
                  )}
                </div>

                {/* 只有锚点+耗时都填了才生成这行参考文字（铁律：在条目内部，不在月历上） */}
                {suggestion && (
                  <p className="mt-3 text-xs text-lavender-deep leading-relaxed">
                    ✨ 基于你预估的耗时，或许可以考虑从 {suggestion} 左右开始着手 ——仅作参考，不必照做，节奏由你掌握。
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1.5">
                    {Object.keys(STATUS_META).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          updateHope(h.id, { status: s })
                          refresh()
                        }}
                        className={`rounded-pill px-3 py-1.5 text-xs ${
                          h.status === s
                            ? STATUS_META[s].chip
                            : 'bg-cream-soft text-softink hover:bg-mist/60'
                        }`}
                      >
                        {STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => openEdit(h)}
                      className="text-xs rounded-pill bg-cream-soft px-3.5 py-1 text-softink hover:bg-gold"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setRemoveTarget(h)}
                      className="text-xs rounded-pill px-3.5 py-1 text-softink hover:bg-gold"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 月视图：只在锚点日期画小圆点（半透明），点击日期弹窗看当天的盼头 */}
      <section className="rounded-card bg-white/70 border border-mist/40 p-8 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">月历上的锚点</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewYM((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
              className="rounded-pill bg-mist/60 px-3.5 py-1.5 text-sm text-mist-deep hover:bg-lavender"
            >
              ‹ 上个月
            </button>
            <span className="text-sm font-medium text-ink">
              {viewYM.y} 年 {viewYM.m + 1} 月
            </span>
            <button
              onClick={() => setViewYM((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
              className="rounded-pill bg-mist/60 px-3.5 py-1.5 text-sm text-mist-deep hover:bg-lavender"
            >
              下个月 ›
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-softink">
          只画出一个小小的半透明圆点，不做计划块、不生成任务清单。点有圆点的日期看看当天的盼头。
        </p>
        <div className="mt-5 grid grid-cols-7 gap-1 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
            <div key={w} className="text-xs text-softink py-1">周{w}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} />
            const iso = `${viewYM.y}-${String(viewYM.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hopesOnDay = hopes.filter((h) => h.targetAnchorDate === iso)
            const isToday = iso === todayIso
            return (
              <button
                key={iso}
                onClick={() => setDayPicked(hopesOnDay.length > 0 ? { iso, day } : null)}
                className={`rounded-2xl py-2.5 relative ${
                  isToday ? 'ring-2 ring-lavender-deep bg-lavender/40' : 'hover:bg-lavender/30'
                } ${hopesOnDay.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`text-sm ${isToday ? 'font-semibold text-lavender-deep' : 'text-ink'}`}>{day}</span>
                {hopesOnDay.length > 0 && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${dotClass(hopesOnDay)}`} />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 新建 / 编辑盼头弹窗 */}
      {editor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-6" onClick={() => setEditor(null)}>
          <div className="w-full max-w-lg rounded-card bg-cream p-8 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink">{editor === 'new' ? '加一个盼头' : '调整这个盼头'}</h2>

            <label className="mt-5 block text-xs text-softink">标题</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="比如：去海边看一次日落"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
            />

            <label className="mt-5 block text-xs text-softink">描述（可选）</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              placeholder="为什么期待它？写不写都行"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-lavender"
            />

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-softink">目标锚点日期（可选）</label>
                <input
                  type="date"
                  value={draft.targetAnchorDate}
                  onChange={(e) => setDraft({ ...draft, targetAnchorDate: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                />
              </div>
              <div>
                <label className="block text-xs text-softink">预估时长（可选）</label>
                <select
                  value={draft.timeEstimate}
                  onChange={(e) => setDraft({ ...draft, timeEstimate: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                >
                  <option value="">先不估了</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-softink">氛围（可选）</label>
                <select
                  value={draft.vibeTag}
                  onChange={(e) => setDraft({ ...draft, vibeTag: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                >
                  <option value="">先不选</option>
                  {VIBES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-softink">放进哪个项目（可选）</label>
                <select
                  value={draft.projectId}
                  onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                >
                  <option value="">不关联项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.iconKey} {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-5 text-xs text-softink leading-relaxed">
              全部都可以留空。锚点日期和预估时长都填了之后，条目里会出现一行“仅供参考”的开始日期提示 —— 信不信、照不照做，都随你。
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditor(null)} className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60">
                先不写
              </button>
              <button onClick={save} className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold">
                {editor === 'new' ? '种下这个盼头 🌱' : '保存调整 🌿'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 月历某天的盼头弹窗 */}
      {dayPicked && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-6" onClick={() => setDayPicked(null)}>
          <div className="w-full max-w-md rounded-card bg-cream p-8 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink">{dayPicked.day} 日的盼头</h2>
            <div className="mt-4 space-y-3">
              {hopes
                .filter((h) => h.targetAnchorDate === dayPicked.iso)
                .map((h) => {
                  const meta = STATUS_META[h.status] || STATUS_META.expecting
                  return (
                    <div key={h.id} className="rounded-2xl bg-cream-soft/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-ink">{h.title}</span>
                        <span className={`text-xs rounded-pill px-2.5 py-0.5 ${meta.chip}`}>{meta.label}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {h.vibeTag && <span className={`text-xs rounded-pill px-2.5 py-0.5 ${VIBE_CLASS[h.vibeTag] || 'bg-cream-soft text-softink'}`}>氛围 · {h.vibeTag}</span>}
                        {h.projectId && <span className="text-xs rounded-pill bg-mist px-2.5 py-0.5 text-mist-deep">{projectName(h.projectId)}</span>}
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className="mt-6 text-right">
              <button onClick={() => setDayPicked(null)} className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60">
                知道了 ☁️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认浮层 */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6" onClick={() => setRemoveTarget(null)}>
          <div className="w-full max-w-sm rounded-card bg-cream p-8 shadow-lift text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl">🍃</div>
            <h2 className="mt-3 text-lg font-semibold text-ink">把这个盼头放回风里？</h2>
            <p className="mt-2 text-sm text-softink leading-relaxed">
              期待条目会被移除。也可以选择「先放一放」，它还会留在列表里等你回来 —— 放弃或搁置都是正常的事。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setRemoveTarget(null)} className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60">
                先留着
              </button>
              <button
                onClick={() => {
                  updateHope(removeTarget.id, { status: 'shelved' })
                  setRemoveTarget(null)
                }}
                className="rounded-pill bg-gold px-5 py-2.5 text-sm font-medium text-gold-deep hover:bg-lavender"
              >
                📦 先放一放
              </button>
              <button
                onClick={handleRemove}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                放回风里 🍃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
