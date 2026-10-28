import { useState, useEffect, useRef } from 'react'
import {
  readChats,
  readChatMessages,
  createChat,
  removeChatById,
  appendChatMessage,
} from '../storage.js'

// 💬 AI 灵感聊天（第 5 轮完整版：本地模拟对话）
// 铁律：绝对不写任何 fetch / axios / API 请求 —— 所有回复都是本地脚本生成的温柔话。

// 关键词 → 温柔回应（只是本地规则，没有任何真实 AI 在背后）
function localReply(text) {
  if (/期待|盼头|愿望|想去做/.test(text)) {
    return '有盼头的感觉真好 🌱 可以把它记进「近期期待」，加不加锚点、什么时候开始，都由你决定。'
  }
  if (/累|烦|焦虑|压力|难过|emo/.test(text)) {
    return '辛苦了。今天先歇着也完全没问题——这里没有任务要赶，只有你想记录的事。☁️'
  }
  if (/卡住|没想法|写不出|没灵感|不知道|迷茫/.test(text)) {
    return '没想法也是正常的节奏。先不逼自己，隔几天再翻翻灵感笔记，说不定某句旧话忽然就亮了 ✨'
  }
  if (/计划|安排|开始|时间|来不及|拖延/.test(text)) {
    return '时间地图上那行「或许可以考虑从 X 开始」真的只是参考 ✨ 提前、延后、搁置甚至放弃，都是完全正常的选择，节奏一直由你掌握。'
  }
  const pool = [
    '嗯，我听到了。这件事可以慢慢来，先把「想做的感觉」留下就够了 🌿',
    '听起来不错。要不要先放一放，隔一天再回来看看它？',
    '你已经愿意把它说出来、记下来，这是最棒的一步 ✨',
    '不急。想到什么就写点什么，灵感喜欢在轻松的时候来。',
    '不管今天怎么样，明天都有一个新的盼头在等你 ☁️',
  ]
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function ChatPage() {
  const [chats, setChats] = useState(readChats)
  const [activeId, setActiveId] = useState(() => readChats()[0]?.id || null)
  const [messages, setMessages] = useState(() =>
    readChatMessages().filter((m) => m.chatId === activeId)
  )
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const endRef = useRef(null)

  // 每次有新消息都自动滚到底部
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  function openChat(id) {
    setActiveId(id)
    setMessages(readChatMessages().filter((m) => m.chatId === id))
    setTyping(false)
  }

  function handleNew() {
    const chat = createChat()
    setChats(readChats())
    setActiveId(chat.id)
    setMessages([])
    setTyping(false)
  }

  function handleRemove() {
    removeChatById(removeTarget.id)
    setChats(readChats())
    if (activeId === removeTarget.id) {
      setActiveId(readChats()[0]?.id || null)
      setMessages(readChats()[0]?.id ? readChatMessages().filter((m) => m.chatId === readChats()[0].id) : [])
    }
    setRemoveTarget(null)
  }

  function send() {
    const text = input.trim()
    if (!text || !activeId || typing) return
    appendChatMessage(activeId, 'user', text)
    setInput('')
    setChats(readChats()) // 第一条用户消息会自动给对话取名
    setMessages(readChatMessages().filter((m) => m.chatId === activeId))
    setTyping(true)
    // 本地模拟“思考”的延迟，回复完全本地生成，绝不联网
    window.setTimeout(() => {
      appendChatMessage(activeId, 'assistant', localReply(text))
      setMessages(readChatMessages().filter((m) => m.chatId === activeId))
      setTyping(false)
    }, 700)
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-ink">AI 灵感聊天</h1>
        {/* 强制标注：演示原型，不是真的接了 AI */}
        <span className="text-xs rounded-pill bg-gold px-3 py-1 text-gold-deep">
          预留 AI 扩展 · 当前仅演示
        </span>
      </section>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧：对话列表 */}
        <aside className="md:w-64 shrink-0 rounded-card bg-white/70 border border-gold/30 p-5 shadow-soft md:self-start">
          <button
            onClick={handleNew}
            className="w-full rounded-pill bg-lavender px-4 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
          >
            ＋ 开个新对话
          </button>
          <div className="mt-4 space-y-2">
            {chats.length === 0 ? (
              <p className="text-xs text-softink leading-relaxed">
                还没有对话。开一个新对话，随便说点什么 —— 它只会轻轻回应，绝不会指挥你。
              </p>
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 cursor-pointer ${
                    activeId === c.id ? 'bg-lavender' : 'hover:bg-mist/60'
                  }`}
                  onClick={() => openChat(c.id)}
                >
                  <span className={`text-sm truncate ${activeId === c.id ? 'text-lavender-deep font-medium' : 'text-ink'}`}>
                    {c.title || '新的对话'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRemoveTarget(c)
                    }}
                    className="text-xs text-softink opacity-0 group-hover:opacity-100 hover:text-ink"
                    title="删除这个对话"
                  >
                    ✂
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="mt-4 text-[11px] text-softink leading-relaxed">
            对话只保存在你的浏览器里，不会上传到任何地方。
          </p>
        </aside>

        {/* 右侧：聊天区 */}
        <div className="flex-1 rounded-card bg-white/70 border border-mist/40 p-6 shadow-soft">
          {!activeId ? (
            <div className="py-16 text-center">
              <div className="text-3xl">🌱</div>
              <p className="mt-3 text-sm text-softink">
                先开一个对话，然后随便说点什么。这里没有正确答案，只有温柔的回应。
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-soft ${
                        m.role === 'user'
                          ? 'bg-lavender text-ink'
                          : 'bg-white/90 border border-mist/50 text-ink'
                      }`}
                    >
                      {m.role === 'assistant' && (
                        <div className="text-[10px] text-softink mb-1">盼头小助手 🌿</div>
                      )}
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="rounded-3xl border border-mist/50 bg-white/90 px-4 py-2.5 text-sm text-softink shadow-soft">
                      盼头小助手正在酝酿… ☁️
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send()
                  }}
                  placeholder="随便说点什么…"
                  className="flex-1 rounded-2xl border border-gold/50 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender"
                />
                <button
                  onClick={send}
                  className="rounded-pill bg-lavender px-5 py-2.5 text-sm font-medium text-lavender-deep hover:bg-gold"
                >
                  发送
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 删除对话确认浮层 */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
          onClick={() => setRemoveTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-card bg-cream p-8 shadow-lift text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">🍃</div>
            <h2 className="mt-3 text-lg font-semibold text-ink">收掉这个对话？</h2>
            <p className="mt-2 text-sm text-softink leading-relaxed">
              对话和里面的消息会一起从本地移除。想聊的话随时可以再开一个，没有任何损失。
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
