// ============================================================
// src/storage.js —— 全项目唯一的「数据仓库」
// 铁律：所有 localStorage 读写只允许出现在这个文件里。
// 页面组件只调这里的函数，绝不自己碰 localStorage。
// ============================================================

// 5 组数据的存储 key，统一带 hopefulspace_ 前缀
const KEY_PROJECTS = 'hopefulspace_projects'
const KEY_NOTES = 'hopefulspace_notes'
const KEY_CHECKITEMS = 'hopefulspace_checkitems'
const KEY_CHECKLOGS = 'hopefulspace_checklogs'
const KEY_HOPES = 'hopefulspace_hopes'
// 聊天对话（原型演示用，同样只存在本地）
const KEY_CHATS = 'hopefulspace_chats'
const KEY_CHAT_MESSAGES = 'hopefulspace_chatmessages'

// 存储后端选用开源数据库 Dexie.js（GitHub: https://github.com/dexie/Dexie.js）
// 它是浏览器 IndexedDB 的封装：容量远超 localStorage（几百 MB），
// 数据仍然只存在你自己的浏览器里，纯前端、不上云、不联网。
import Dexie from 'dexie'

const db = new Dexie('hopefulspace')
// 7 张表对应 7 组数据，主键都是各记录的唯一 id（proj_ / note_ / …）
db.version(1).stores({
  projects: 'id',
  notes: 'id',
  checkitems: 'id',
  checklogs: 'id',
  hopes: 'id',
  chats: 'id',
  chatmessages: 'id',
})

// 表名 ↔ localStorage 旧 key 的映射（旧数据迁移、异常兜底都要用它）
const TABLE_BY_KEY = {
  hopefulspace_projects: 'projects',
  hopefulspace_notes: 'notes',
  hopefulspace_checkitems: 'checkitems',
  hopefulspace_checklogs: 'checklogs',
  hopefulspace_hopes: 'hopes',
  hopefulspace_chats: 'chats',
  hopefulspace_chatmessages: 'chatmessages',
}

// 内存镜像：页面同步读取的“水龙头”。
// IndexedDB 的写入在后台异步完成；数据库不可用时回退 localStorage 兜底。
const cache = {
  projects: [],
  notes: [],
  checkitems: [],
  checklogs: [],
  hopes: [],
  chats: [],
  chatmessages: [],
}

// 从 localStorage 安全读旧数据（带错误兜底）
function readLegacy(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn(`读取 ${key} 失败，已用空数据兜底：`, err)
    return []
  }
}

// 通用读：总是从内存镜像取（页面无感知，和以前“同步读”的用法完全一致）
function load(key) {
  const table = TABLE_BY_KEY[key]
  return cache[table] || []
}

// 通用写：同步更新内存镜像（页面立即刷新），后台异步写 IndexedDB；
// 数据库写入失败时回退 localStorage，保证数据无论如何都能留下来。
function save(key, list) {
  const table = TABLE_BY_KEY[key]
  cache[table] = list
  if (!table) return
  db.transaction('rw', db.table(table), async () => {
    await db.table(table).clear()
    await db.table(table).bulkAdd(list)
  }).catch((err) => {
    console.warn('IndexedDB 写入失败，已回退 localStorage 保存：', err)
    try {
      localStorage.setItem(key, JSON.stringify(list))
    } catch (e) {
      console.warn('localStorage 兜底保存也失败了：', e)
    }
  })
}

// 启动时调用：把 IndexedDB 读进内存镜像。
// 第一次使用时若数据库为空但 localStorage 里还有旧数据，自动迁移进库（旧数据保留不动）。
export async function hydrateDatabase() {
  let allOk = true
  for (const key of Object.keys(TABLE_BY_KEY)) {
    const table = TABLE_BY_KEY[key]
    try {
      const rows = await db.table(table).toArray()
      if (rows.length === 0) {
        const legacy = readLegacy(key)
        if (legacy.length > 0) {
          cache[table] = legacy
          await db.table(table).bulkAdd(legacy)
          console.info(`${table}：已把旧的 localStorage 数据自动迁移进来，共 ${legacy.length} 条`)
        }
      } else {
        cache[table] = rows
      }
    } catch (err) {
      allOk = false
      console.warn(`${table} 读取失败，改用 localStorage 兜底：`, err)
      cache[table] = readLegacy(key)
    }
  }
  return allOk
}

// ---------- 5 组数据的读写函数 ----------
export function readProjects()   { return load(KEY_PROJECTS) }
export function readNotes()      { return load(KEY_NOTES) }
export function readCheckItems() { return load(KEY_CHECKITEMS) }
export function readCheckLogs()  { return load(KEY_CHECKLOGS) }
export function readHopes()      { return load(KEY_HOPES) }

export function writeProjects(list)   { save(KEY_PROJECTS, list) }
export function writeNotes(list)      { save(KEY_NOTES, list) }
export function writeCheckItems(list) { save(KEY_CHECKITEMS, list) }
export function writeCheckLogs(list)  { save(KEY_CHECKLOGS, list) }
export function writeHopes(list)      { save(KEY_HOPES, list) }

// ---------- 工具函数 ----------
// 生成带前缀的唯一 ID：proj_xxx / note_xxx / hope_xxx……
// 前缀是数据模型规定的，不许改；后缀用时间+随机数拼，基本不会撞。
export function makeId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 当前时间 → ISO 字符串（数据模型铁律：日期优先存 ISO 字符串，绝不存 Date 对象）
export function nowISO() {
  return new Date().toISOString()
}

// ISO 时间 → 给人看的「2026年10月28日」
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// ---------- 项目相关操作（读写都在这，页面只负责调用和显示） ----------

// 新建一个项目（完整字段一字不差按数据模型；新项目放在数组最前面 = 最新在上）
export function createProject(name, iconKey, colorKey) {
  const now = nowISO()
  const project = {
    id: makeId('proj'),
    name,
    iconKey,
    colorKey,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  }
  const next = [project, ...readProjects()]
  writeProjects(next)
  return project
}

// 切换归档状态（归档 = 标记，绝不等于删除；下属数据一律不动）
export function toggleArchive(id) {
  const next = readProjects().map((p) =>
    p.id === id ? { ...p, isArchived: !p.isArchived, updatedAt: nowISO() } : p
  )
  writeProjects(next)
  return next
}

// 删除项目：先把下属的笔记/期待/打卡记录的 projectId 清成 null（它们回归自由），再删项目本身
export function removeProjectById(id) {
  const detach = (list) => list.map((x) => (x.projectId === id ? { ...x, projectId: null } : x))
  writeNotes(detach(readNotes()))
  writeHopes(detach(readHopes()))
  writeCheckLogs(detach(readCheckLogs()))
  const next = readProjects().filter((p) => p.id !== id)
  writeProjects(next)
  return next
}

// 取一个项目下的笔记数量（卡片上显示用）
export function countNotesInProject(projectId) {
  return readNotes().filter((n) => n.projectId === projectId).length
}

// ============================================================
// 以下为第 3/4/5 轮功能的数据操作，模式完全相同：
// 操作 → 写入 → 返回最新数组，页面再重新读一遍重绘。
// ============================================================

// ---------- 灵感笔记 ----------
// 字段按数据模型一字不差：id/projectId/title/content/moodTags/createdAt/updatedAt
export function createNote({ title, content, projectId, moodTags }) {
  const now = nowISO()
  const note = {
    id: makeId('note'),
    projectId: projectId || null, // null = 自由灵感，不属于项目
    title: title || '',           // 允许空标题（无标题碎片）
    content,
    moodTags: moodTags || [],     // 最多 2 个文本标签
    createdAt: now,
    updatedAt: now,
  }
  writeNotes([note, ...readNotes()])
  return note
}

export function updateNote(id, patch) {
  const next = readNotes().map((n) =>
    n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n
  )
  writeNotes(next)
  return next
}

export function removeNoteById(id) {
  const next = readNotes().filter((n) => n.id !== id)
  writeNotes(next)
  return next
}

// ---------- 打卡事项 ----------
// 字段按数据模型一字不差：id/name/note/createdAt（注意：事项本身没有 projectId）
export function createCheckItem(name, note) {
  const now = nowISO()
  const item = {
    id: makeId('checkitem'),
    name,
    note: note || '',
    createdAt: now,
  }
  writeCheckItems([item, ...readCheckItems()])
  return item
}

// 删除事项：连同它名下的所有打卡记录一起收起来（避免留下悬空的记录）
export function removeCheckItemById(id) {
  writeCheckLogs(readCheckLogs().filter((l) => l.checkItemId !== id))
  const next = readCheckItems().filter((c) => c.id !== id)
  writeCheckItems(next)
  return next
}

// ---------- 单次打卡记录 ----------
// 字段按数据模型一字不差：id/checkItemId/recordDate(YYYY-MM-DD)/moodEmoji/projectId/createdAt
export function addCheckLog(checkItemId, recordDate, moodEmoji, projectId) {
  const log = {
    id: makeId('checklog'),
    checkItemId,
    recordDate,                     // 必须是 YYYY-MM-DD 文本，别存 Date 对象
    moodEmoji: moodEmoji || null,
    projectId: projectId || null,   // 打卡记录可以可选关联项目
    createdAt: nowISO(),
  }
  writeCheckLogs([...readCheckLogs(), log])
  return log
}

export function removeCheckLogById(id) {
  const next = readCheckLogs().filter((l) => l.id !== id)
  writeCheckLogs(next)
  return next
}

// ---------- 近期期待 · 时间地图 ----------
// 字段按数据模型一字不差，status 只有 expecting/done/shelved 三种（绝无逾期！）
export function createHope({ title, description, projectId, targetAnchorDate, timeEstimate, vibeTag }) {
  const now = nowISO()
  const hope = {
    id: makeId('hope'),
    title,
    description: description || '',
    projectId: projectId || null,
    targetAnchorDate: targetAnchorDate || null, // YYYY-MM-DD 或 null，可选
    timeEstimate: timeEstimate || null,         // 只能从固定下拉里选
    vibeTag: vibeTag || null,                   // 要紧/加急/轻松/随缘
    status: 'expecting',                        // 默认：💭 正在期待
    createdAt: now,
    updatedAt: now,
  }
  writeHopes([hope, ...readHopes()])
  return hope
}

export function updateHope(id, patch) {
  const next = readHopes().map((h) =>
    h.id === id ? { ...h, ...patch, updatedAt: nowISO() } : h
  )
  writeHopes(next)
  return next
}

export function removeHopeById(id) {
  const next = readHopes().filter((h) => h.id !== id)
  writeHopes(next)
  return next
}

// ---------- 聊天对话（本地模拟原型的存储） ----------
export function readChats() {
  return load(KEY_CHATS)
}
export function readChatMessages() {
  return load(KEY_CHAT_MESSAGES)
}
export function writeChats(list) {
  save(KEY_CHATS, list)
}
export function writeChatMessages(list) {
  save(KEY_CHAT_MESSAGES, list)
}

// 新建一个对话（无标题，第一次发消息时自动取名）
export function createChat() {
  const now = nowISO()
  const chat = { id: makeId('chat'), title: '', createdAt: now, updatedAt: now }
  writeChats([chat, ...readChats()])
  return chat
}

export function removeChatById(id) {
  // 删除对话时，它名下的消息也一并移除（对话是消息的容器）
  writeChatMessages(readChatMessages().filter((m) => m.chatId !== id))
  const next = readChats().filter((c) => c.id !== id)
  writeChats(next)
  return next
}

// 追加一条消息；若是该对话的第一条用户消息，顺手用它的开头做对话标题
export function appendChatMessage(chatId, role, text) {
  const msg = {
    id: makeId('chatmsg'),
    chatId,
    role, // 'user' | 'assistant'
    text,
    createdAt: nowISO(),
  }
  writeChatMessages([...readChatMessages(), msg])
  const next = readChats().map((c) => {
    if (c.id !== chatId) return c
    let title = c.title
    if (!title && role === 'user') title = text.slice(0, 12)
    return { ...c, title, updatedAt: nowISO() }
  })
  writeChats(next)
  return msg
}
