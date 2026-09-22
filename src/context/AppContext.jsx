import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { getStore, saveStore, hashPassword, SESSION_KEY, nextId } from '../store'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [store, setStore] = useState(getStore)
  const [sessionUserId, setSessionUserId] = useState(() => {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? Number(raw) : null
  })

  const currentUser = useMemo(
    () => store.users.find((u) => u.id === sessionUserId && u.isActive !== false) ?? null,
    [store.users, sessionUserId]
  )

  const currentRole = useMemo(
    () => store.roles.find((r) => r.id === currentUser?.roleId) ?? null,
    [store.roles, currentUser]
  )

  useEffect(() => {
    const theme = currentUser?.theme || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [currentUser?.theme])

  const update = useCallback((partial) => {
    setStore((prev) => {
      const next = { ...prev, ...partial }
      saveStore(next)
      return next
    })
  }, [])

  const login = useCallback(
    (email, password) => {
      const normalized = email.trim().toLowerCase()
      const user = store.users.find(
        (u) => u.email.toLowerCase() === normalized && u.isActive !== false
      )
      if (!user || user.passwordHash !== hashPassword(password)) {
        return { ok: false, error: 'Неверный email или пароль' }
      }
      sessionStorage.setItem(SESSION_KEY, String(user.id))
      setSessionUserId(user.id)
      return { ok: true }
    },
    [store.users]
  )

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSessionUserId(null)
  }, [])

  const setUserTheme = useCallback(
    (theme) => {
      if (!currentUser) return
      const users = store.users.map((u) =>
        u.id === currentUser.id ? { ...u, theme } : u
      )
      update({ users })
    },
    [currentUser, store.users, update]
  )

  const hasPermission = useCallback(
    (section) => {
      if (!currentRole) return false
      if (currentRole.permissions?.all) return true
      return !!currentRole.permissions?.[section]
    },
    [currentRole]
  )

  const value = {
    ...store,
    currentUser,
    currentRole,
    isAuthenticated: !!currentUser,
    login,
    logout,
    setUserTheme,
    hasPermission,
    update,
    nextId: (items) => nextId(items),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
