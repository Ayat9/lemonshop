import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getStore, saveStore, nextId } from '../store'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [store, setStore] = useState(getStore)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.theme)
  }, [store.theme])

  const update = useCallback((partial) => {
    setStore((prev) => {
      const next = { ...prev, ...partial }
      saveStore(next)
      return next
    })
  }, [])

  const addProduct = useCallback((product) => {
    const id = nextId(store.products)
    const newProduct = { ...product, id }
    update({ products: [...store.products, newProduct] })
    return newProduct
  }, [store.products, update])

  const updateProduct = useCallback((id, data) => {
    const products = store.products.map((p) => (p.id === id ? { ...p, ...data } : p))
    update({ products })
  }, [store.products, update])

  const deleteProduct = useCallback((id) => {
    update({ products: store.products.filter((p) => p.id !== id) })
  }, [store.products, update])

  const addCategory = useCallback((category) => {
    const id = nextId(store.categories)
    const items = (category.items || []).map((item, i) => ({
      id: `${id}-${i}`,
      name: typeof item === 'string' ? item : item.name,
    }))
    const newCat = { id, name: category.name, items }
    update({ categories: [...store.categories, newCat] })
    return newCat
  }, [store.categories, update])

  const updateCategory = useCallback((id, data) => {
    const categories = store.categories.map((c) => (c.id === id ? { ...c, ...data } : c))
    update({ categories })
  }, [store.categories, update])

  const deleteCategory = useCallback((id) => {
    update({ categories: store.categories.filter((c) => c.id !== id) })
  }, [store.categories, update])

  const setSettings = useCallback((settings) => {
    update({ settings: { ...store.settings, ...settings } })
  }, [store.settings, update])

  const setTheme = useCallback((theme) => {
    update({ theme })
  }, [update])

  const incrementVisits = useCallback(() => {
    setStore((prev) => {
      const next = { ...prev, visits: prev.visits + 1 }
      saveStore(next)
      return next
    })
  }, [])

  const addUser = useCallback((user) => {
    const id = nextId(store.users)
    const newUser = { ...user, id }
    update({ users: [...store.users, newUser] })
    return newUser
  }, [store.users, update])

  const deleteUser = useCallback((id) => {
    update({ users: store.users.filter((u) => u.id !== id) })
  }, [store.users, update])

  const value = {
    ...store,
    update,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    setSettings,
    setTheme,
    incrementVisits,
    addUser,
    deleteUser,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
