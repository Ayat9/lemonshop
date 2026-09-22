const KEY = 'lemonshop_hrm'

const DEFAULT_ROLES = [
  {
    id: 1,
    name: 'CEO / Владелец',
    permissions: {
      dashboard: true,
      tasks: true,
      employees: true,
      tactical: true,
      org: true,
      roles: true,
      settings: true,
    },
  },
  {
    id: 2,
    name: 'Директор / Управляющий',
    permissions: {
      dashboard: true,
      tasks: true,
      employees: true,
      tactical: true,
      org: true,
      roles: false,
      settings: false,
    },
  },
  {
    id: 3,
    name: 'Менеджер',
    permissions: {
      dashboard: true,
      tasks: true,
      employees: false,
      tactical: false,
      org: false,
      roles: false,
      settings: false,
    },
  },
  {
    id: 4,
    name: 'Сотрудник точки',
    permissions: {
      dashboard: true,
      tasks: true,
      employees: false,
      tactical: false,
      org: false,
      roles: false,
      settings: false,
    },
  },
]

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

export function hashPassword(password) {
  let h = 0
  const s = String(password)
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return `h${h >>> 0}`
}

function seedUsers(roles) {
  const ceoRole = roles.find((r) => r.id === 1)
  return [
    {
      id: 1,
      email: 'ceo@lemonshop.kz',
      passwordHash: hashPassword('admin123'),
      name: 'Айдан CEO',
      roleId: ceoRole?.id ?? 1,
      theme: 'dark',
      accent: 'gold',
      isActive: true,
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    },
  ]
}

export function getStore() {
  const stored = load()
  const roles = stored?.roles?.length ? stored.roles : DEFAULT_ROLES
  let users = stored?.users ?? []
  if (!stored || !users.length) {
    users = seedUsers(roles)
    if (!stored) {
      save({
        roles,
        users,
        employees: [],
        tasks: [],
        skills: [],
      })
    }
  }
  return {
    roles,
    users,
    employees: stored?.employees ?? [],
    tasks: stored?.tasks ?? [],
    skills: stored?.skills ?? [],
  }
}

export function saveStore(partial) {
  const current = getStore()
  const next = { ...current, ...partial }
  save(next)
  return next
}

export function nextId(items, key = 'id') {
  const max = items.reduce((m, x) => {
    const v = x[key]
    const n = typeof v === 'number' ? v : parseInt(v, 10)
    return Math.max(m, isNaN(n) ? 0 : n)
  }, 0)
  return max + 1
}

export const SESSION_KEY = 'lemonshop_hrm_session'
