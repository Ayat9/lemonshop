const KEY = 'lemonshop'

const defaultCategories = []
const defaultProducts = []
const defaultSettings = {
  whatsapp: '',
  instagram: '',
  tiktok: '',
  adminPassword: 'admin123',
  stockEnabled: false,
  orderWhatsapp1: '',
  orderWhatsapp2: '',
  orderWhatsapp3: '',
  orderWhatsapp4: '',
  logoUrl: '',
}
const defaultUsers = []
const defaultVisits = 0
const defaultTheme = 'dark'
const defaultOrders = []

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

/** Миграция старого формата категорий (группы + items) в дерево (parentId + order) */
function migrateCategories(list) {
  if (!list?.length) return []
  const first = list[0]
  if (first.items !== undefined && Array.isArray(first.items)) {
    const flat = []
    let order = 0
    list.forEach((cat) => {
      flat.push({ id: cat.id, name: cat.name, parentId: null, order: order++ })
      ;(cat.items || []).forEach((item, i) => {
        flat.push({ id: item.id, name: item.name, parentId: cat.id, order: i })
      })
    })
    return flat
  }
  return list
}

/** Миграция товаров: price → priceRetail, добавить priceOpt, article, createdAt */
function migrateProducts(list) {
  if (!list?.length) return list
  return list.map((p) => {
    const priceRetail = p.priceRetail ?? p.price ?? 0
    const boxQty = Math.max(1, p.boxQty ?? 1)
    const priceOpt = p.priceOpt ?? (p.price ? p.price * boxQty : priceRetail * boxQty)
    return {
      ...p,
      priceRetail,
      priceOpt,
      price: priceRetail,
      article: p.article ?? p.size ?? '',
      createdAt: p.createdAt ?? p.created_at ?? new Date().toISOString(),
    }
  })
}

export function getStore() {
  const stored = load()
  const rawCategories = stored?.categories ?? defaultCategories
  const categories = migrateCategories(rawCategories)
  const rawProducts = stored?.products ?? defaultProducts
  const products = migrateProducts(rawProducts)
  return {
    products,
    categories,
    settings: { ...defaultSettings, ...stored?.settings },
    users: stored?.users ?? defaultUsers,
    visits: stored?.visits ?? defaultVisits,
    theme: stored?.theme ?? defaultTheme,
    orders: stored?.orders ?? defaultOrders,
  }
}

export function saveStore(partial) {
  const current = getStore()
  const next = { ...current, ...partial }
  save(next)
  return next
}

const CART_KEY = KEY + '_cart'

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return { mode: 'retail', items: {} }
    const data = JSON.parse(raw)
    return { mode: data.mode === 'wholesale' ? 'wholesale' : 'retail', items: data.items || {} }
  } catch {
    return { mode: 'retail', items: {} }
  }
}

export function saveCart(cartState) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartState))
    return true
  } catch {
    return false
  }
}

export function nextId(items, key = 'id') {
  const max = items.reduce((m, x) => {
    const v = x[key]
    const n = typeof v === 'number' ? v : parseInt(v, 10)
    return Math.max(m, isNaN(n) ? 0 : n)
  }, 0)
  return max + 1
}

/** Строит дерево из плоского списка категорий */
export function buildCategoryTree(categories) {
  const byParent = new Map()
  byParent.set(null, [])
  categories.forEach((c) => {
    const pid = c.parentId ?? null
    if (!byParent.has(pid)) byParent.set(pid, [])
    byParent.get(pid).push({ ...c, children: [] })
  })
  const sort = (arr) => arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  sort(byParent.get(null))
  function fill(node) {
    const kids = byParent.get(node.id) || []
    sort(kids)
    node.children = kids
    kids.forEach(fill)
  }
  byParent.get(null).forEach(fill)
  return byParent.get(null)
}

/** Плоский список категорий с путём (для селектов) */
export function flatCategoryList(categories) {
  const tree = buildCategoryTree(categories)
  const out = []
  function walk(nodes, path) {
    nodes.forEach((n) => {
      const p = path ? `${path} / ${n.name}` : n.name
      out.push({ id: n.id, name: n.name, path: p })
      walk(n.children || [], p)
    })
  }
  walk(tree, '')
  return out
}
