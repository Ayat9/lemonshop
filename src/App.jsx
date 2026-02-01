import { useState, useMemo } from 'react'
import { categories, products } from './data'
import './App.css'

const ITEMS_PER_PAGE = 6
const PHONE = '87079938485'
const TG = 'gulziya_futlyar'

function App() {
  const [cart, setCart] = useState({})
  const [activeCat, setActiveCat] = useState(null)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!activeCat) return products
    return products.filter((p) => p.cat === activeCat)
  }, [activeCat])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0)
  const cartSum = Object.entries(cart).reduce((s, [id, q]) => {
    const p = products.find((x) => x.id === Number(id))
    return s + (p ? p.price * q : 0)
  }, 0)

  const setQty = (productId, delta) => {
    setCart((prev) => {
      const next = { ...prev }
      const cur = next[productId] || 0
      const newQty = Math.max(0, cur + delta)
      if (newQty === 0) delete next[productId]
      else next[productId] = newQty
      return next
    })
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">Lemonshop</a>
          <nav className="nav">
            <a href="#catalog" className="nav-link">Каталог</a>
            <a href="#login" className="nav-link">Войти</a>
          </nav>
          <div className="header-contacts">
            <a href={`tel:${PHONE}`} className="phone">{PHONE}</a>
            <a href={`https://t.me/${TG}`} target="_blank" rel="noreferrer" className="tg">@{TG}</a>
          </div>
        </div>
      </header>

      <div className="main-wrap">
        <aside className="sidebar">
          <a href="#catalog" className="sidebar-title">Все товары</a>
          {categories.map((cat) => (
            <div key={cat.id} className="sidebar-group">
              <div className="sidebar-group-name">{cat.name}</div>
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item ${activeCat === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCat(activeCat === item.id ? null : item.id)
                    setPage(1)
                  }}
                >
                  {item.name}
                  <span className="sidebar-count">{item.count}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="content">
          <div className="products-grid">
            {paginated.map((p) => {
              const qty = cart[p.id] || 0
              const lineTotal = (p.price * qty).toFixed(2)
              return (
                <article key={p.id} className="product-card">
                  <h3 className="product-title">{p.title}</h3>
                  <p className="product-size">{p.size}</p>
                  <p className="product-price">{p.price.toLocaleString('ru-KZ')}₸</p>
                  {(p.pack != null || p.box != null) && (
                    <p className="product-meta">
                      {p.pack != null && `в упак ${p.pack}шт`}
                      {p.pack != null && p.box != null && ' · '}
                      {p.box != null && `в кор ${p.box}шт`}
                    </p>
                  )}
                  {p.minOrder != null && (
                    <p className="product-meta">заказ минимум {p.minOrder}шт</p>
                  )}
                  {p.packOnly && <p className="product-pack-only">Только упаковкой</p>}
                  <div className="product-actions">
                    <button type="button" className="qty-btn" onClick={() => setQty(p.id, -1)} aria-label="Минус">−</button>
                    <span className="qty-value">{qty}шт</span>
                    <button type="button" className="qty-btn" onClick={() => setQty(p.id, 1)} aria-label="Плюс">+</button>
                  </div>
                  <p className="product-line">
                    {qty}шт × {p.price.toFixed(2)} = {lineTotal}₸
                  </p>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pagination-btn ${n === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </main>
      </div>

      <div className="cart-bar">
        <span className="cart-summary">Выбрано {cartCount} тов ({cartSum.toLocaleString('ru-KZ')}₸)</span>
        <button type="button" className="cart-open-btn">Открыть корзину</button>
      </div>
    </div>
  )
}

export default App
