import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { getStore, flatCategoryList } from '../store'
import ProductModal from '../components/ProductModal'
import './Admin.css'

const ADMIN_SESSION_KEY = 'lemonshop_admin'
const DEFAULT_PASSWORD = 'admin123'

const SECTIONS = [
  { id: 'catalog', label: 'Товары и категории' },
  { id: 'orders', label: 'Заказы' },
  { id: 'users', label: 'Пользователи' },
  { id: 'visits', label: 'Посещения' },
  { id: 'settings', label: 'Настройки' },
]

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    const stored = getStore()
    const expected = stored.settings?.adminPassword?.trim() || DEFAULT_PASSWORD
    if (loginPassword.trim() === expected) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      setLoginError('')
      setLoginPassword('')
      setIsLoggedIn(true)
    } else {
      setLoginError('Неверный пароль')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-layout admin-login-page">
        <div className="admin-login-box">
          <h1 className="admin-login-title">Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <label htmlFor="admin-password">Пароль</label>
            <input
              id="admin-password"
              type="password"
              placeholder="Введите пароль"
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError('') }}
              autoFocus
              autoComplete="current-password"
            />
            {loginError && <p className="admin-login-error">{loginError}</p>}
            <button type="submit">Войти</button>
          </form>
          <p className="admin-login-hint">Пароль по умолчанию: <strong>admin123</strong> (смените в Настройках после входа)</p>
          <Link to="/" className="admin-login-back">← На главную</Link>
        </div>
      </div>
    )
  }

  const {
    products,
    categories,
    users,
    visits,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    moveCategory,
    moveCategoryUp,
    moveCategoryDown,
    deleteCategory,
    categoryTree,
    addUser,
    deleteUser,
    setSettings,
    orders,
    updateOrder,
  } = useStore()

  const [section, setSection] = useState('catalog')

  // Catalog: выбранная категория и фильтр
  const [selectedCatId, setSelectedCatId] = useState(null)
  const [collapsedCats, setCollapsedCats] = useState(() => new Set()) // свернутые категории (по умолчанию все развёрнуты)
  const [showFilter, setShowFilter] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null) // null = новый товар, иначе { id, ... }
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [orderEditForm, setOrderEditForm] = useState(null)

  const flatCats = flatCategoryList(categories)

  // Фильтрация товаров по категории и тексту
  const filteredProducts = products.filter((p) => {
    const matchesCat = !selectedCatId || p.cat === selectedCatId || String(p.cat) === String(selectedCatId)
    const matchesText = !filterText.trim() || (p.title || '').toLowerCase().includes(filterText.toLowerCase()) || (p.size || '').toLowerCase().includes(filterText.toLowerCase())
    return matchesCat && matchesText
  })

  const openAddProduct = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const openEditProduct = (p) => {
    setEditingProduct({
      id: p.id,
      title: p.title || '',
      size: p.size || '',
      article: p.article ?? p.size ?? '',
      barcode: p.barcode || '',
      description: p.description || '',
      costPrice: p.costPrice ?? '',
      priceRetail: p.priceRetail ?? p.price ?? '',
      priceOpt: p.priceOpt ?? '',
      boxQty: p.boxQty ?? 1,
      stock: p.stock ?? '',
      cat: p.cat ?? '',
      imageData: p.imageData ?? null,
      createdAt: p.createdAt ?? null,
    })
    setShowProductModal(true)
  }

  const handleSaveProduct = (data) => {
    if (data.id) {
      updateProduct(data.id, data)
    } else {
      addProduct({ ...data, cat: data.cat || flatCats[0]?.id || '' })
    }
    setShowProductModal(false)
    setEditingProduct(null)
  }

  // Category form (дерево: категория или подкатегория)
  const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '' })
  const [editingCategory, setEditingCategory] = useState(null) // { id, name }

  const handleAddCategory = (e) => {
    e.preventDefault()
    const parentId = categoryForm.parentId === '' ? null : Number(categoryForm.parentId)
    addCategory({ name: categoryForm.name.trim(), parentId })
    setCategoryForm({ name: '', parentId: '' })
  }

  const startEditCategory = (cat) => {
    setEditingCategory({ id: cat.id, name: cat.name || '' })
  }

  const handleSaveCategory = () => {
    if (!editingCategory) return
    updateCategory(editingCategory.id, { name: editingCategory.name.trim() })
    setEditingCategory(null)
  }

  const handleMoveCategory = (id, newParentId) => {
    const v = newParentId === '' ? null : Number(newParentId)
    if (v === id) return
    moveCategory(id, v, undefined)
  }

  const toggleCategoryExpand = (id) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getMoveOptions = (currentId) => {
    const descendants = new Set()
    function collect(pid) {
      categories.filter((c) => (c.parentId ?? null) === pid).forEach((c) => {
        descendants.add(c.id)
        collect(c.id)
      })
    }
    collect(currentId)
    return [{ id: '', path: '— Корень —' }, ...flatCats.filter((f) => f.id !== currentId && !descendants.has(f.id))]
  }

  // User form
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'manager' })

  const handleAddUser = (e) => {
    e.preventDefault()
    addUser({ name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role })
    setUserForm({ name: '', email: '', role: 'manager' })
  }

  // Settings form — sync when opening settings tab
  const [settingsForm, setSettingsForm] = useState({
    whatsapp: settings.whatsapp || '',
    instagram: settings.instagram || '',
    tiktok: settings.tiktok || '',
    adminPassword: settings.adminPassword || '',
    stockEnabled: settings.stockEnabled ?? false,
    orderWhatsapp1: settings.orderWhatsapp1 || '',
    orderWhatsapp2: settings.orderWhatsapp2 || '',
    orderWhatsapp3: settings.orderWhatsapp3 || '',
    orderWhatsapp4: settings.orderWhatsapp4 || '',
    logoUrl: settings.logoUrl || '',
  })
  useEffect(() => {
    if (section === 'settings') {
      setSettingsForm({
        whatsapp: settings.whatsapp || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
        adminPassword: settings.adminPassword || '',
        stockEnabled: settings.stockEnabled ?? false,
        orderWhatsapp1: settings.orderWhatsapp1 || '',
        orderWhatsapp2: settings.orderWhatsapp2 || '',
        orderWhatsapp3: settings.orderWhatsapp3 || '',
        orderWhatsapp4: settings.orderWhatsapp4 || '',
        logoUrl: settings.logoUrl || '',
      })
    }
  }, [section, settings.whatsapp, settings.instagram, settings.tiktok, settings.adminPassword, settings.stockEnabled, settings.orderWhatsapp1, settings.orderWhatsapp2, settings.orderWhatsapp3, settings.orderWhatsapp4, settings.logoUrl])

  const handleSaveSettings = (e) => {
    e.preventDefault()
    setSettings(settingsForm)
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <Link to="/" className="admin-back">← На сайт</Link>
        <h1 className="admin-title">Lemonshop</h1>
        <button type="button" className="admin-logout" onClick={handleLogout}>Выйти</button>
      </header>
      <nav className="admin-topnav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`admin-topnav-item ${section === s.id ? 'active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <main className="admin-main">
          {section === 'catalog' && (
            <section className="admin-section catalog-section">
              {/* Toolbar */}
              <div className="catalog-toolbar">
                <button type="button" className="catalog-btn" onClick={() => { openAddProduct(); setShowAddCategory(false) }}>
                  + Товар
                </button>
                <button type="button" className="catalog-btn" onClick={() => { setShowAddCategory(!showAddCategory); setShowAddProduct(false) }}>
                  + Категория
                </button>
                <button type="button" className={`catalog-btn ${showFilter ? 'active' : ''}`} onClick={() => setShowFilter(!showFilter)}>
                  Фильтр
                </button>
                <input
                  type="text"
                  className="catalog-search"
                  placeholder="Поиск по названию..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>

              {/* Сворачиваемый фильтр */}
              {showFilter && (
                <div className="catalog-filter-panel">
                  <label>Поиск</label>
                  <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Название или размер" />
                  <button type="button" className="admin-btn-small" onClick={() => { setFilterText(''); setSelectedCatId(null) }}>Сбросить</button>
                </div>
              )}

              {/* Модальное окно товара */}
              {showProductModal && (
                <ProductModal
                  product={editingProduct}
                  categories={flatCats}
                  stockEnabled={settings.stockEnabled}
                  onSave={handleSaveProduct}
                  onClose={() => { setShowProductModal(false); setEditingProduct(null) }}
                />
              )}

              {/* Форма добавления категории */}
              {showAddCategory && (
                <form className="catalog-add-form" onSubmit={(e) => { handleAddCategory(e); setShowAddCategory(false) }}>
                  <h4>Новая категория</h4>
                  <input type="text" placeholder="Название" value={categoryForm.name} onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))} required />
                  <select value={categoryForm.parentId} onChange={(e) => setCategoryForm((f) => ({ ...f, parentId: e.target.value }))}>
                    <option value="">— Корень —</option>
                    {flatCats.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
                  </select>
                  <button type="submit">Добавить</button>
                  <button type="button" className="admin-btn-small" onClick={() => setShowAddCategory(false)}>Отмена</button>
                </form>
              )}

              {/* Основной layout: дерево слева, таблица справа */}
              <div className="catalog-layout">
                {/* Дерево категорий */}
                <aside className="catalog-tree-panel">
                  <div className="catalog-tree-title">Категории</div>
                  <button
                    type="button"
                    className={`catalog-tree-item ${!selectedCatId ? 'active' : ''}`}
                    onClick={() => setSelectedCatId(null)}
                  >
                    Все товары
                  </button>
                  {categoryTree.length === 0 ? (
                    <p className="admin-empty">Нет категорий</p>
                  ) : (
                    (function renderTree(nodes, depth = 0) {
                      return nodes.flatMap((node) => {
                        const hasChildren = node.children?.length > 0
                        const isExpanded = !collapsedCats.has(node.id)
                        return [
                          <div key={node.id} className="catalog-tree-row" style={{ paddingLeft: `${8 + depth * 16}px` }}>
                            {editingCategory?.id === node.id ? (
                              <>
                                <input
                                  type="text"
                                  className="admin-tree-edit-input"
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory((f) => ({ ...f, name: e.target.value }))}
                                  autoFocus
                                />
                                <button type="button" className="admin-btn-save" onClick={handleSaveCategory}>✓</button>
                                <button type="button" className="admin-btn-small" onClick={() => setEditingCategory(null)}>✕</button>
                              </>
                            ) : (
                              <>
                                {hasChildren ? (
                                  <button
                                    type="button"
                                    className="catalog-tree-toggle"
                                    onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(node.id) }}
                                    title={isExpanded ? 'Свернуть' : 'Развернуть'}
                                    aria-expanded={isExpanded}
                                  >
                                    {isExpanded ? '▼' : '▶'}
                                  </button>
                                ) : (
                                  <span className="catalog-tree-spacer" />
                                )}
                                <button
                                  type="button"
                                  className={`catalog-tree-item ${selectedCatId === node.id ? 'active' : ''}`}
                                  onClick={() => setSelectedCatId(node.id)}
                                >
                                  {node.name}
                                </button>
                                <div className="catalog-tree-actions">
                                <button type="button" className="catalog-tree-action" onClick={() => startEditCategory(node)} title="Редактировать">✏️</button>
                                <button type="button" className="catalog-tree-action" onClick={() => moveCategoryUp(node.id)} title="Вверх">↑</button>
                                <button type="button" className="catalog-tree-action" onClick={() => moveCategoryDown(node.id)} title="Вниз">↓</button>
                                <select
                                  className="catalog-tree-move"
                                  value=""
                                  onChange={(e) => handleMoveCategory(node.id, e.target.value)}
                                  title="Переместить"
                                >
                                  <option value="">→</option>
                                  {getMoveOptions(node.id).map((opt) => (
                                    <option key={opt.id ?? 'root'} value={opt.id}>{opt.path}</option>
                                  ))}
                                </select>
                                <button type="button" className="catalog-tree-action danger" onClick={() => deleteCategory(node.id)} title="Удалить">🗑</button>
                              </div>
                            </>
                          )}
                        </div>,
                        ...(hasChildren && isExpanded ? renderTree(node.children, depth + 1) : []),
                      ]
                      })
                    })(categoryTree)
                  )}
                </aside>

                {/* Таблица товаров */}
                <div className="catalog-products-panel">
                  <div className="catalog-products-header">
                    Товары {selectedCatId ? `(${flatCats.find((c) => c.id === selectedCatId)?.name || ''})` : '(все)'}
                    <span className="catalog-products-count">{filteredProducts.length} шт</span>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Название</th>
                          <th>Артикул</th>
                          <th>Розница</th>
                          <th>Опт (кор.)</th>
                          <th>В коробке</th>
                          {settings.stockEnabled && <th>Остаток</th>}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td>{p.title}</td>
                            <td>{p.article ?? p.size ?? '—'}</td>
                            <td>{(p.priceRetail ?? p.price ?? 0).toLocaleString('ru-KZ')}₸</td>
                            <td>{(p.priceOpt ?? (p.price ?? 0) * (p.boxQty ?? 1)).toLocaleString('ru-KZ')}₸</td>
                            <td>{(p.boxQty ?? 1)} шт</td>
                            {settings.stockEnabled && <td>{p.stock != null ? `${p.stock} шт` : '—'}</td>}
                            <td>
                              <button type="button" className="admin-btn-small" onClick={() => openEditProduct(p)}>✏️</button>
                              <button type="button" className="admin-btn-danger" onClick={() => deleteProduct(p.id)}>🗑</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && <p className="admin-empty">Нет товаров</p>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === 'orders' && (
            <section className="admin-section">
              <h2>История заказов</h2>
              <p className="admin-hint">Список оформленных заказов. Нажмите «Редактировать» для изменения данных клиента.</p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Дата</th>
                      <th>Клиент (ФИО)</th>
                      <th>Телефон</th>
                      <th>Город</th>
                      <th>Адрес</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(orders || [])].reverse().map((o) => (
                      editingOrderId === o.id ? (
                        <tr key={o.id} className="admin-edit-row">
                          <td>{o.id}</td>
                          <td colSpan={7}>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                updateOrder(o.id, { client: orderEditForm })
                                setEditingOrderId(null)
                                setOrderEditForm(null)
                              }}
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                            >
                              <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ФИО</label>
                                <input
                                  value={orderEditForm?.name ?? ''}
                                  onChange={(e) => setOrderEditForm((f) => ({ ...f, name: e.target.value }))}
                                  style={{ width: '100%', padding: '0.4rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Телефон</label>
                                <input
                                  value={orderEditForm?.phone ?? ''}
                                  onChange={(e) => setOrderEditForm((f) => ({ ...f, phone: e.target.value }))}
                                  style={{ width: '100%', padding: '0.4rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Город</label>
                                <input
                                  value={orderEditForm?.city ?? ''}
                                  onChange={(e) => setOrderEditForm((f) => ({ ...f, city: e.target.value }))}
                                  style={{ width: '100%', padding: '0.4rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Адрес поставки</label>
                                <input
                                  value={orderEditForm?.address ?? ''}
                                  onChange={(e) => setOrderEditForm((f) => ({ ...f, address: e.target.value }))}
                                  style={{ width: '100%', padding: '0.4rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="admin-btn-save">Сохранить</button>
                                <button type="button" className="admin-btn-small" onClick={() => { setEditingOrderId(null); setOrderEditForm(null); }}>Отмена</button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : (
                        <tr key={o.id}>
                          <td>{o.id}</td>
                          <td>{o.createdAt ? new Date(o.createdAt).toLocaleString('ru-KZ') : '—'}</td>
                          <td>{o.client?.name ?? '—'}</td>
                          <td>{o.client?.phone ?? '—'}</td>
                          <td>{o.client?.city ?? '—'}</td>
                          <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.client?.address}>{o.client?.address ?? '—'}</td>
                          <td>{(o.totalSum ?? 0).toLocaleString('ru-KZ')}₸</td>
                          <td>
                            <button type="button" className="admin-btn-small" onClick={() => { setEditingOrderId(o.id); setOrderEditForm({ name: o.client?.name, phone: o.client?.phone, city: o.client?.city, address: o.client?.address }); }}>✏️ Редактировать</button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
                {(!orders || orders.length === 0) && <p className="admin-empty">Заказов пока нет.</p>}
              </div>
            </section>
          )}

          {section === 'users' && (
            <section className="admin-section">
              <h2>Пользователи</h2>
              <form className="admin-form" onSubmit={handleAddUser}>
                <input type="text" placeholder="Имя" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} required />
                <input type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
                <select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
                <button type="submit">Добавить</button>
              </form>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Имя</th><th>Email</th><th>Роль</th><th></th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td><button type="button" className="admin-btn-danger" onClick={() => deleteUser(u.id)}>Удалить</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p className="admin-empty">Пользователей пока нет.</p>}
              </div>
            </section>
          )}

          {section === 'visits' && (
            <section className="admin-section">
              <h2>Статистика</h2>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Посещения сайта</span>
                  <span className="admin-stat-value">{visits}</span>
                  <p className="admin-hint">При каждом открытии главной страницы</p>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Заказов</span>
                  <span className="admin-stat-value">{orders?.length ?? 0}</span>
                  <p className="admin-hint">Всего оформленных заказов</p>
                </div>
              </div>
            </section>
          )}

          {section === 'settings' && (
            <section className="admin-section">
              <h2>Настройки</h2>
              <form className="admin-form settings-form" onSubmit={handleSaveSettings}>
                <h3>Контакты (отображаются на главной)</h3>
                <label>Логотип для PDF (URL или путь, например /logo.png)</label>
                <input
                  type="text"
                  placeholder="/logo.png или https://..."
                  value={settingsForm.logoUrl}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, logoUrl: e.target.value }))}
                />
                <label>WhatsApp (основной, для ссылки на главной)</label>
                <input
                  type="text"
                  placeholder="87071234567"
                  value={settingsForm.whatsapp}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, whatsapp: e.target.value }))}
                />
                <h3>Номера для приёма заказов (3–4 шт)</h3>
                <p className="admin-hint">Клиент выбирает номер, на который отправить заказ в WhatsApp. Укажите до 4 номеров.</p>
                <label>Номер для заказов 1</label>
                <input
                  type="text"
                  placeholder="87071234567"
                  value={settingsForm.orderWhatsapp1}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, orderWhatsapp1: e.target.value }))}
                />
                <label>Номер для заказов 2</label>
                <input
                  type="text"
                  placeholder="87071234568"
                  value={settingsForm.orderWhatsapp2}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, orderWhatsapp2: e.target.value }))}
                />
                <label>Номер для заказов 3</label>
                <input
                  type="text"
                  placeholder="87071234569"
                  value={settingsForm.orderWhatsapp3}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, orderWhatsapp3: e.target.value }))}
                />
                <label>Номер для заказов 4</label>
                <input
                  type="text"
                  placeholder="87071234570"
                  value={settingsForm.orderWhatsapp4}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, orderWhatsapp4: e.target.value }))}
                />
                <label>Instagram (логин или ссылка)</label>
                <input
                  type="text"
                  placeholder="@username или https://instagram.com/..."
                  value={settingsForm.instagram}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, instagram: e.target.value }))}
                />
                <label>TikTok (логин или ссылка)</label>
                <input
                  type="text"
                  placeholder="@username или https://tiktok.com/..."
                  value={settingsForm.tiktok}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, tiktok: e.target.value }))}
                />
                <p className="admin-hint">Основной WhatsApp — для ссылки на главной. Номера 1–4 — кнопки в корзине: клиент заполняет имя, телефон, адрес и отправляет заказ на выбранный номер.</p>
                <h3>Учёт остатков</h3>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={settingsForm.stockEnabled}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, stockEnabled: e.target.checked }))}
                  />
                  Включить учёт остатков
                </label>
                <p className="admin-hint">Если включено: клиенты видят остаток и не могут заказать товар при отсутствии. Если выключено — заказы без ограничений.</p>
                <h3>Пароль админ-панели</h3>
                <label>Новый пароль (оставьте пустым, чтобы не менять)</label>
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={settingsForm.adminPassword}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, adminPassword: e.target.value }))}
                  autoComplete="new-password"
                />
                <p className="admin-hint">По умолчанию используется пароль <strong>admin123</strong>. Задайте свой и сохраните.</p>
                <button type="submit">Сохранить настройки</button>
              </form>
            </section>
          )}
      </main>
    </div>
  )
}

export default Admin
