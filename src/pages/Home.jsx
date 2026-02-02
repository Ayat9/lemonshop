import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { loadCart, saveCart } from '../store'
import CartBar from '../components/CartBar'
import './Home.css'

const ITEMS_PER_PAGE = 12
const NEW_DAYS = 7

function Home() {
  const { products, categories, categoryTree, settings, incrementVisits } = useStore()
  const [cartState, setCartState] = useState(() => loadCart())
  const { mode, items: cart } = cartState
  const setCart = (updater) => {
    setCartState((prev) => ({ ...prev, items: typeof updater === 'function' ? updater(prev.items) : updater }))
  }
  const setMode = (m) => setCartState((prev) => ({ ...prev, mode: m }))

  const [activeCat, setActiveCat] = useState(null)
  const [collapsedCats, setCollapsedCats] = useState(() => new Set())
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    incrementVisits()
  }, [incrementVisits])

  useEffect(() => {
    saveCart(cartState)
  }, [cartState])

  const toggleCategoryExpand = (id) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isOutOfStock = (p) => settings.stockEnabled && p.stock != null && Number(p.stock) <= 0
  const isNew = (p) => {
    const created = p.createdAt ? new Date(p.createdAt).getTime() : 0
    return created && (Date.now() - created) < NEW_DAYS * 24 * 60 * 60 * 1000
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (activeCat != null) list = list.filter((p) => String(p.cat ?? '') === String(activeCat))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.size || '').toLowerCase().includes(q) ||
          (p.article || '').toLowerCase().includes(q)
      )
    }
    const prRetail = priceMin !== '' ? Number(priceMin) : null
    const prMax = priceMax !== '' ? Number(priceMax) : null
    if (prRetail != null) list = list.filter((p) => (p.priceRetail ?? p.price ?? 0) >= prRetail)
    if (prMax != null) list = list.filter((p) => (p.priceRetail ?? p.price ?? 0) <= prMax)
    if (inStockOnly) list = list.filter((p) => !isOutOfStock(p))
    if (sortBy === 'priceAsc') list.sort((a, b) => (a.priceRetail ?? a.price ?? 0) - (b.priceRetail ?? b.price ?? 0))
    else if (sortBy === 'priceDesc') list.sort((a, b) => (b.priceRetail ?? b.price ?? 0) - (a.priceRetail ?? a.price ?? 0))
    else if (sortBy === 'name') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    else if (sortBy === 'new') list.sort((a, b) => (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0)))
    return list
  }, [products, activeCat, search, priceMin, priceMax, inStockOnly, sortBy])

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

      <div className="mode-bar">
        <span className="mode-bar-label">Режим:</span>
        <button
          type="button"
          className={`mode-btn ${mode === 'retail' ? 'mode-btn-active' : ''}`}
          onClick={() => setMode('retail')}
        >
          Розница
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'wholesale' ? 'mode-btn-active' : ''}`}
          onClick={() => setMode('wholesale')}
        >
          Опт
        </button>
      </div>

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

      <div className="filters-bar">
        <label className="filter-item">
          <span>Цена от</span>
          <input type="number" placeholder="0" value={priceMin} onChange={(e) => { setPriceMin(e.target.value); setPage(1) }} min={0} />
        </label>
        <label className="filter-item">
          <span>до</span>
          <input type="number" placeholder="—" value={priceMax} onChange={(e) => { setPriceMax(e.target.value); setPage(1) }} min={0} />
        </label>
        <label className="filter-item filter-checkbox">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setPage(1) }} />
          <span>В наличии</span>
        </label>
        <label className="filter-item">
          <span>Сортировка</span>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }}>
            <option value="default">По умолчанию</option>
            <option value="priceAsc">Цена: по возрастанию</option>
            <option value="priceDesc">Цена: по убыванию</option>
            <option value="name">По названию</option>
            <option value="new">Сначала новые</option>
          </select>
        </label>
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
                const priceRetail = p.priceRetail ?? p.price ?? 0
                const priceOpt = p.priceOpt ?? priceRetail * boxQty
                const isRetail = mode === 'retail'
                const qty = cart[p.id] || 0
                const lineTotal = isRetail ? (qty * priceRetail).toFixed(2) : (qty * priceOpt).toFixed(2)
                const outOfStock = isOutOfStock(p)
                const newBadge = isNew(p)
                return (
                  <article key={p.id} className={`product-card ${outOfStock ? 'product-card-disabled' : ''}`}>
                    {newBadge && <span className="product-badge-new">NEW</span>}
                    {p.imageData && <img src={p.imageData} alt="" className="product-card-image" />}
                    <h3 className="product-title">{p.title}</h3>
                    {(p.article || p.size) && <p className="product-article">Артикул: {p.article || p.size}</p>}
                    {p.barcode && <p className="product-meta">Штрих-код: {p.barcode}</p>}
                    {isRetail ? (
                      <p className="product-price">{priceRetail.toLocaleString('ru-KZ')}₸/шт</p>
                    ) : (
                      <p className="product-price">{priceOpt.toLocaleString('ru-KZ')}₸/кор</p>
                    )}
                    {settings.stockEnabled && p.stock != null && (
                      <p className="product-meta">Остаток: {p.stock} шт</p>
                    )}
                    {!isRetail && <p className="product-meta">В коробке: {boxQty} шт</p>}
                    {outOfStock ? (
                      <p className="product-out-of-stock">Нет в наличии</p>
                    ) : (
                      <>
                        <div className="product-actions">
                          <button type="button" className="qty-btn" onClick={() => setQty(p.id, -1)} aria-label="Минус">−</button>
                          <span className="qty-value">{isRetail ? `${qty} шт` : `${qty} кор`}</span>
                          <button type="button" className="qty-btn" onClick={() => setQty(p.id, 1)} aria-label="Плюс">+</button>
                        </div>
                        <p className="product-line">
                          {isRetail ? `${qty} шт × ${priceRetail}₸` : `${qty} кор × ${priceOpt}₸`} = {lineTotal}₸
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

      <CartBar cart={cart} setCart={setCart} mode={mode} products={products} />
    </div>
  )
}

export default Home
