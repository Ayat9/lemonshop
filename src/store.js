const KEY = 'lemonshop'

const defaultCategories = []
const defaultProducts = []
const defaultSettings = { whatsapp: '', instagram: '', tiktok: '' }
const defaultUsers = []
const defaultVisits = 0
const defaultTheme = 'dark'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function getStore() {
  const stored = load()
  return {
    products: stored?.products ?? defaultProducts,
    categories: stored?.categories ?? defaultCategories,
    settings: { ...defaultSettings, ...stored?.settings },
    users: stored?.users ?? defaultUsers,
    visits: stored?.visits ?? defaultVisits,
    theme: stored?.theme ?? defaultTheme,
  }
}

export function saveStore(partial) {
  const current = getStore()
  const next = { ...current, ...partial }
  save(next)
  return next
}

export function nextId(items, key = 'id') {
  const max = items.reduce((m, x) => Math.max(m, Number(x[key]) || 0), 0)
  return max + 1
}
