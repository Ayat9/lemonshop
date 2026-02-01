import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import CartBar from '../components/CartBar'
import './Home.css'

const ITEMS_PER_PAGE = 6

function Home() {
  const { products, categories, settings, setTheme, theme, incrementVisits } = useStore()
  const [cart, setCart] = useState({})
  const [activeCat, setActiveCat] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    incrementVisits()
  }, [incrementVisits])

  const filtered = useMemo(() => {
    let list = products
    if (activeCat) list = list.filter((p) => p.cat === activeCat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.size || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [products, activeCat, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

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

  const hasSocial = settings.whatsapp || settings.instagram || settings.tiktok

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">Lemonshop</a>
          <nav className="nav">
            <a href="/#catalog" className="nav-link">Каталог</a>
            <a href="/admin" className="nav-link">Админ</a>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
          {hasSocial && (
            <div className="header-social">
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="social-link" title="WhatsApp">WhatsApp</a>
              )}
              {settings.instagram && (
                <a href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="social-link" title="Instagram">Instagram</a>
              )}
              {settings.tiktok && (
                <a href={settings.tiktok.startsWith('http') ? settings.tiktok : `https://tiktok.com/@${settings.tiktok.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="social-link" title="TikTok">TikTok</a>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="search-wrap">
        <input
          type="search"
          className="search-input"
          placeholder="Поиск по каталогу..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          aria-label="Поиск"
        />
      </div>

      <div className="main-wrap">
        <aside className="sidebar">
          <a href="#catalog" className="sidebar-title">Все товары</a>
          {categories.length === 0 ? (
            <p className="sidebar-empty">Категории пока пусты. Добавьте их в админ-панели.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="sidebar-group">
                <div className="sidebar-group-name">{cat.name}</div>
                {(cat.items || []).map((item) => (
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
                  </button>
                ))}
              </div>
            ))
          )}
        </aside>

        <main className="content">
          <div className="products-grid">
            {paginated.length === 0 ? (
              <p className="products-empty">Товаров пока нет или ничего не найдено по запросу.</p>
            ) : (
              paginated.map((p) => {
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
              })
            )}
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

      <CartBar cart={cart} setCart={setCart} products={products} />
    </div>
  )
}

export default Home
