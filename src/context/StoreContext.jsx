import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getStore, saveStore, nextId, buildCategoryTree } from '../store'

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
    const boxQty = product.boxQty ?? 1
    const priceRetail = product.priceRetail ?? product.price ?? 0
    const priceOpt = product.priceOpt ?? priceRetail * boxQty
    const newProduct = {
      ...product,
      id,
      boxQty,
      priceRetail,
      priceOpt,
      price: priceRetail,
      costPrice: product.costPrice ?? null,
      barcode: product.barcode ?? '',
      description: product.description ?? '',
      stock: product.stock ?? null,
      imageData: product.imageData ?? null,
      article: product.article ?? product.size ?? '',
      createdAt: product.createdAt ?? new Date().toISOString(),
    }
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
    const parentId = category.parentId ?? null
    const siblings = store.categories.filter((c) => (c.parentId ?? null) === parentId)
    const order = siblings.length ? Math.max(...siblings.map((c) => c.order ?? 0), 0) + 1 : 0
    const newCat = { id, name: category.name.trim(), parentId, order }
    update({ categories: [...store.categories, newCat] })
    return newCat
  }, [store.categories, update])

  const updateCategory = useCallback((id, data) => {
    const categories = store.categories.map((c) => (c.id === id ? { ...c, ...data } : c))
    update({ categories })
  }, [store.categories, update])

  const moveCategory = useCallback((id, newParentId, newOrder) => {
    const cat = store.categories.find((c) => c.id === id)
    if (!cat) return
    const parentId = newParentId === '' || newParentId === undefined ? null : Number(newParentId)
    if (parentId === id) return
    const siblings = store.categories.filter((c) => (c.parentId ?? null) === parentId && c.id !== id)
    const order = typeof newOrder === 'number' ? newOrder : (siblings.length ? Math.max(...siblings.map((c) => c.order ?? 0), 0) + 1 : 0)
    const categories = store.categories.map((c) => (c.id === id ? { ...c, parentId, order } : c))
    update({ categories })
  }, [store.categories, update])

  const moveCategoryUp = useCallback((id) => {
    const cat = store.categories.find((c) => c.id === id)
    if (!cat) return
    const siblings = store.categories.filter((c) => (c.parentId ?? null) === (cat.parentId ?? null)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const idx = siblings.findIndex((c) => c.id === id)
    if (idx <= 0) return
    const prev = siblings[idx - 1]
    const categories = store.categories.map((c) => {
      if (c.id === id) return { ...c, order: prev.order ?? 0 }
      if (c.id === prev.id) return { ...c, order: cat.order ?? 0 }
      return c
    })
    update({ categories })
  }, [store.categories, update])

  const moveCategoryDown = useCallback((id) => {
    const cat = store.categories.find((c) => c.id === id)
    if (!cat) return
    const siblings = store.categories.filter((c) => (c.parentId ?? null) === (cat.parentId ?? null)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const idx = siblings.findIndex((c) => c.id === id)
    if (idx < 0 || idx >= siblings.length - 1) return
    const next = siblings[idx + 1]
    const categories = store.categories.map((c) => {
      if (c.id === id) return { ...c, order: next.order ?? 0 }
      if (c.id === next.id) return { ...c, order: cat.order ?? 0 }
      return c
    })
    update({ categories })
  }, [store.categories, update])

  const getDescendantIds = useCallback((parentId) => {
    const ids = new Set()
    function collect(pid) {
      store.categories.filter((c) => (c.parentId ?? null) === pid).forEach((c) => {
        ids.add(c.id)
        collect(c.id)
      })
    }
    collect(parentId)
    return ids
  }, [store.categories])

  const deleteCategory = useCallback((id) => {
    const toRemove = new Set([id, ...getDescendantIds(id)])
    update({ categories: store.categories.filter((c) => !toRemove.has(c.id)) })
  }, [store.categories, getDescendantIds, update])

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

  const addOrder = useCallback((order) => {
    const id = nextId(store.orders)
    const newOrder = { ...order, id, createdAt: new Date().toISOString() }
    update({ orders: [...store.orders, newOrder] })
    return newOrder
  }, [store.orders, update])

  const updateOrder = useCallback((id, data) => {
    const orders = store.orders.map((o) => (o.id === id ? { ...o, ...data } : o))
    update({ orders })
  }, [store.orders, update])

  const categoryTree = buildCategoryTree(store.categories)

  const value = {
    ...store,
    categoryTree,
    update,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    moveCategory,
    moveCategoryUp,
    moveCategoryDown,
    deleteCategory,
    setSettings,
    setTheme,
    incrementVisits,
    addUser,
    deleteUser,
    addOrder,
    updateOrder,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
