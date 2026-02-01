import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import CartBar from '../components/CartBar'
import './Home.css'

const ITEMS_PER_PAGE = 6

function Home() {
  const { products, categories, categoryTree, settings, incrementVisits } = useStore()
  const [cart, setCart] = useState({})
  const [activeCat, setActiveCat] = useState(null)
  const [collapsedCats, setCollapsedCats] = useState(() => new Set())
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const toggleCategoryExpand = (id) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    incrementVisits()
  }, [incrementVisits])

  const filtered = useMemo(() => {
    let list = products
    if (activeCat != null) list = list.filter((p) => String(p.cat ?? '') === String(activeCat))
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

  const isOutOfStock = (p) => settings.stockEnabled && p.stock != null && Number(p.stock) <= 0

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
            <a
              href="#/"
              className="nav-link"
              onClick={(e) => {
                if (window.location.hash === '#/' || window.location.hash === '' || window.location.hash === '#') {
                  e.preventDefault()
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              Каталог
            </a>
            <Link to="/admin" className="nav-link">Админ</Link>
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
          <button
            type="button"
            className="sidebar-title sidebar-title-btn"
            onClick={() => { setActiveCat(null); setPage(1); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            Все товары
          </button>
          {!categoryTree?.length ? (
            <p className="sidebar-empty">Категории пока пусты. Добавьте их в админ-панели.</p>
          ) : (
            (function renderTree(nodes, depth = 0) {
              return nodes.flatMap((node) => {
                const hasChildren = node.children?.length > 0
                const isExpanded = !collapsedCats.has(node.id)
                return [
                  <div key={node.id} className="sidebar-row" style={{ paddingLeft: `${12 + depth * 14}px` }}>
                    {hasChildren ? (
                      <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(node.id) }}
                        title={isExpanded ? 'Свернуть' : 'Развернуть'}
                        aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    ) : (
                      <span className="sidebar-spacer" />
                    )}
                    <button
                      type="button"
                      className={`sidebar-item ${String(activeCat) === String(node.id) ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCat(String(activeCat) === String(node.id) ? null : node.id)
                        setPage(1)
                      }}
                    >
                      {node.name}
                    </button>
                  </div>,
                  ...(hasChildren && isExpanded ? renderTree(node.children, depth + 1) : []),
                ]
              })
            })(categoryTree)
          )}
        </aside>

        <main id="catalog" className="content">
          <div className="products-grid">
            {paginated.length === 0 ? (
              <p className="products-empty">Товаров пока нет или ничего не найдено по запросу.</p>
            ) : (
              paginated.map((p) => {
                const boxQty = p.boxQty ?? 1
                const boxes = cart[p.id] || 0
                const totalPieces = boxes * boxQty
                const lineTotal = (p.price * totalPieces).toFixed(2)
                const outOfStock = isOutOfStock(p)
                return (
                  <article key={p.id} className={`product-card ${outOfStock ? 'product-card-disabled' : ''}`}>
                    {p.imageData && <img src={p.imageData} alt="" className="product-card-image" />}
                    <h3 className="product-title">{p.title}</h3>
                    <p className="product-size">{p.size}</p>
                    <p className="product-price">{p.price.toLocaleString('ru-KZ')}₸/шт</p>
                    {settings.stockEnabled && p.stock != null && (
                      <p className="product-meta">Остаток: {p.stock} шт</p>
                    )}
                    <p className="product-meta">В коробке: {boxQty} шт · за коробку {(p.price * boxQty).toLocaleString('ru-KZ')}₸</p>
                    {(p.pack != null || p.box != null) && (
                      <p className="product-meta">
                        {p.pack != null && `в упак ${p.pack}шт`}
                        {p.pack != null && p.box != null && ' · '}
                        {p.box != null && `в кор ${p.box}шт`}
                      </p>
                    )}
                    {p.minOrder != null && (
                      <p className="product-meta">заказ минимум {p.minOrder} кор.</p>
                    )}
                    {p.packOnly && <p className="product-pack-only">Только упаковкой</p>}
                    {outOfStock ? (
                      <p className="product-out-of-stock">Нет в наличии</p>
                    ) : (
                      <>
                        <div className="product-actions">
                          <button type="button" className="qty-btn" onClick={() => setQty(p.id, -1)} aria-label="Минус коробку">−</button>
                          <span className="qty-value">{boxes} кор.</span>
                          <button type="button" className="qty-btn" onClick={() => setQty(p.id, 1)} aria-label="Плюс коробку">+</button>
                        </div>
                        <p className="product-line">
                          {boxes} кор. × ({boxQty} шт × {p.price}₸) = {lineTotal}₸
                        </p>
                      </>
                    )}
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
