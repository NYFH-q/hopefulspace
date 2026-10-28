import { useState } from 'react'
import {
  readCheckItems,
  readCheckLogs,
  readProjects,
  createCheckItem,
  removeCheckItemById,
  addCheckLog,
  removeCheckLogById,
} from '../storage.js'

// ✨ 轻松打卡：打卡事项 + 心情浮层（4 个固定 emoji）+ 30 天日历（第 4 轮完整版）
// 铁律：没有连续打卡计数、没有断签惩罚、空白格子无任何负面标记
const MOODS = ['🥳', '☁️', '✨', '😌']
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 本周（周一到周日）：日常最常用的一周视图
function last7Days() {
  const days = []
  const t = new Date()
  const mondayOffset = (t.getDay() + 6) % 7 // 周一 = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - mondayOffset + i)
    days.push({ iso: isoOf(d), day: d.getDate(), weekday: d.getDay() })
  }
  return days
}

// 最近 30 天（含今天），从旧到新排列
function last30Days() {
  const days = []
  const t = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i)
    days.push({ iso: isoOf(d), day: d.getDate(), weekday: d.getDay() })
  }
  return days
}

export default function CheckinsPage() {
  const [items, setItems] = useState(readCheckItems)
  const [logs, setLogs] = useState(readCheckLogs)
  const [projects, setProjects] = useState(readProjects)
  const [openNewItem, setOpenNewItem] = useState(false)
  const [itemDraft, setItemDraft] = useState({ name: '', note: '' })
  const [dayTarget, setDayTarget] = useState(null) // 点击日历格子后弹浮层：{ iso, day, weekday }
  const [logDraft, setLogDraft] = useState({ checkItemId: '', mood: '', projectId: '' })
  const [removeItemTarget, setRemoveItemTarget] = useState(null)

  function refresh() {
    setItems(readCheckItems())
    setLogs(readCheckLogs())
    setProjects(readProjects())
  }

  // 今天的日期，用来高亮今天那一格（不做任何倒计时！）
  const todayIso = isoOf(new Date())

  function handleCreateItem() {
    createCheckItem(itemDraft.name.trim() || '未命名事项', itemDraft.note.trim())
    refresh()
    setOpenNewItem(false)
    setItemDraft({ name: '', note: '' })
  }

  function handleAddLog() {
    if (!logDraft.checkItemId) return
    // recordDate 必须是 YYYY-MM-DD 文本（数据模型铁律）
    addCheckLog(logDraft.checkItemId, dayTarget.iso, logDraft.mood || null, logDraft.projectId || null)
    refresh()
    setLogDraft({ checkItemId: '', mood: '', projectId: '' })
  }

  function handleRemoveItem() {
    removeCheckItemById(removeItemTarget.id)
    refresh()
    setRemoveItemTarget(null)
  }

  const week = last7Days()
  const days = last30Days()

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">轻松打卡</h1>
          <p className="mt-2 text-sm text-softink">
            记录「我想记录的事」，不是任务清单。忘了就忘了，随时可以回来。
          </p>
        </div>
        <button
          onClick={() => setOpenNewItem(true)}
          className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
        >
          ＋ 记一个想记录的事
        </button>
      </section>

      {/* 打卡事项列表（chips） */}
      {items.length === 0 ? (
        <div className="rounded-card bg-white/70 border border-gold/30 p-8 text-center shadow-soft">
          <div className="text-3xl">🌱</div>
          <p className="mt-3 text-sm text-softink leading-relaxed">
            还没有打卡事项。比如「今天晒到了太阳」「按时吃早饭」「给植物浇水」—— 想记录的日常小事都可以成为一个事项。
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-white/70 border border-mist/50 px-4 py-2.5 shadow-soft flex items-center gap-3"
            >
              <div>
                <div className="text-sm font-medium text-ink">{c.name}</div>
                {c.note && <div className="text-xs text-softink">{c.note}</div>}
                <div className="text-[10px] text-softink mt-0.5">
                  记过 {logs.filter((l) => l.checkItemId === c.id).length} 次
                </div>
              </div>
              <button
                onClick={() => setRemoveItemTarget(c)}
                className="text-xs rounded-pill px-2.5 py-1 text-softink hover:bg-gold"
                title="不再记录这个事项"
              >
                ✂
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 本周视图：周一到周日，今天高亮；点任意一天也能打卡；今天的日期写在标题里 */}
      <section className="rounded-card bg-white/70 border border-mist/40 p-8 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">
          本周
          <span className="ml-2 text-xs font-normal text-softink">
            今天是周{WEEKDAY_LABELS[new Date().getDay()]} · 本周还没过去的几天也可以提前记一笔，或者留白
          </span>
        </h2>
        <div className="mt-5 grid grid-cols-7 gap-2">
          {week.map((d) => {
            const dayLogs = logs.filter((l) => l.recordDate === d.iso)
            const isToday = d.iso === todayIso
            return (
              <button
                key={d.iso}
                onClick={() => setDayTarget(d)}
                className={`rounded-2xl border px-1 py-3 text-center transition-colors ${
                  isToday
                    ? 'border-lavender-deep bg-lavender/40'
                    : 'border-mist/50 bg-white/60 hover:bg-lavender/30'
                }`}
              >
                <div className={`text-[10px] ${isToday ? 'text-lavender-deep font-semibold' : 'text-softink'}`}>
                  周{WEEKDAY_LABELS[d.weekday]}
                </div>
                <div className={`text-sm mt-1 ${isToday ? 'font-semibold text-lavender-deep' : 'text-ink'}`}>
                  {d.day}
                </div>
                <div className="h-1.5 mt-1 flex items-center justify-center">
                  {dayLogs.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-mint-deep/70" />}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 30 天日历：空白格子没有任何负面标记 */}
      <section className="rounded-card bg-white/70 border border-mist/40 p-8 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">过去的 30 天</h2>
        <p className="mt-1 text-xs text-softink">
          点任意一天就能给那天打卡（或看看那天记过什么）。空白的日子就让它空白着，完全正常。
        </p>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {days.map((d) => {
            const dayLogs = logs.filter((l) => l.recordDate === d.iso)
            const isToday = d.iso === todayIso
            return (
              <button
                key={d.iso}
                onClick={() => setDayTarget(d)}
                className={`rounded-2xl border px-2 py-2 text-center transition-colors ${
                  isToday
                    ? 'border-lavender-deep bg-lavender/40'
                    : 'border-mist/50 bg-white/60 hover:bg-lavender/30'
                }`}
              >
                <div className="text-[10px] text-softink">周{WEEKDAY_LABELS[d.weekday]}</div>
                <div className={`text-sm ${isToday ? 'font-semibold text-lavender-deep' : 'text-ink'}`}>
                  {d.day}
                </div>
                <div className="h-1.5 flex items-center justify-center">
                  {dayLogs.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-mint-deep/70" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 新建打卡事项弹窗 */}
      {openNewItem && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setOpenNewItem(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-cream p-8 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">记一个想记录的事</h2>
            <label className="mt-5 block text-xs text-softink">事项名字</label>
            <input
              value={itemDraft.name}
              onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
              placeholder="比如：晒到太阳了"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
            />
            <label className="mt-5 block text-xs text-softink">备注（可选）</label>
            <input
              value={itemDraft.note}
              onChange={(e) => setItemDraft({ ...itemDraft, note: e.target.value })}
              placeholder="为什么想记这件事？一句话就行"
              className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
            />
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setOpenNewItem(false)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                先不记
              </button>
              <button
                onClick={handleCreateItem}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                记下它 ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 某一天的打卡浮层 */}
      {dayTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setDayTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-card bg-cream p-8 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">
              {dayTarget.day} 日 · 星期{WEEKDAY_LABELS[dayTarget.weekday]}
            </h2>

            {/* 当天已有的打卡记录 */}
            {logs.filter((l) => l.recordDate === dayTarget.iso).length === 0 ? (
              <p className="mt-3 text-xs text-softink">
                这一天还没有记录。想记就记一笔，不想记就让它空白 —— 都很好。
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {logs
                  .filter((l) => l.recordDate === dayTarget.iso)
                  .map((l) => {
                    const item = items.find((c) => c.id === l.checkItemId)
                    const proj = projects.find((p) => p.id === l.projectId)
                    return (
                      <div
                        key={l.id}
                        className="flex items-center justify-between gap-2 rounded-2xl bg-cream-soft/60 px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-ink">
                            {item ? item.name : '已不再记录的事 🍃'}
                            {proj && (
                              <span className="ml-2 text-xs text-mist-deep">{proj.name}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-lg">{l.moodEmoji}</span>
                        <button
                          onClick={() => {
                            removeCheckLogById(l.id)
                            refresh()
                          }}
                          className="text-xs rounded-pill px-2.5 py-1 text-softink hover:bg-gold"
                        >
                          收回
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* 打卡表单：事项 + 心情 + 可选项目 */}
            <div className="mt-6">
              {items.length === 0 ? (
                <p className="text-sm text-softink">
                  还没有打卡事项，先在上面点「＋ 记一个想记录的事」新建一个吧 🌱
                </p>
              ) : (
                <>
                  <label className="block text-xs text-softink">今天想记录哪件事？</label>
                  <select
                    value={logDraft.checkItemId}
                    onChange={(e) => setLogDraft({ ...logDraft, checkItemId: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    <option value="">选一个事项…</option>
                    {items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <label className="mt-4 block text-xs text-softink">今天的心情（可跳过）</label>
                  <div className="mt-2 flex gap-3">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        onClick={() =>
                          setLogDraft({ ...logDraft, mood: logDraft.mood === m ? '' : m })
                        }
                        className={`h-11 w-11 rounded-full text-xl ${
                          logDraft.mood === m ? 'bg-lavender ring-2 ring-lavender-deep' : 'bg-mist/50 hover:bg-mist'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block text-xs text-softink">关联项目（可选）</label>
                  <select
                    value={logDraft.projectId}
                    onChange={(e) => setLogDraft({ ...logDraft, projectId: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    <option value="">不关联项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.iconKey} {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setDayTarget(null)}
                      className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
                    >
                      先不管
                    </button>
                    <button
                      onClick={handleAddLog}
                      className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
                    >
                      记下这一天 ✨
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 删除事项确认浮层 */}
      {removeItemTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setRemoveItemTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-cream p-8 shadow-lift text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">✂</div>
            <h2 className="mt-3 text-lg font-semibold text-ink">
              不再记录「{removeItemTarget.name}」？
            </h2>
            <p className="mt-2 text-sm text-softink leading-relaxed">
              事项会从列表里移走，它下面已有的打卡记录会一起收起来。这只是你决定不再记这件事了，没有任何负担。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setRemoveItemTarget(null)}
                className="rounded-pill px-5 py-2.5 text-sm text-softink hover:bg-mist/60"
              >
                继续记录
              </button>
              <button
                onClick={handleRemoveItem}
                className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
              >
                不再记录 🍃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
