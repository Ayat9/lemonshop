import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import './Admin.css'

const SECTIONS = [
  { id: 'products', label: 'Товары' },
  { id: 'categories', label: 'Категории' },
  { id: 'users', label: 'Пользователи' },
  { id: 'visits', label: 'Посещения' },
  { id: 'settings', label: 'Настройки' },
]

function Admin() {
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
    deleteCategory,
    addUser,
    deleteUser,
    setSettings,
  } = useStore()

  const [section, setSection] = useState('products')

  // Product form
  const [productForm, setProductForm] = useState({ title: '', size: '', price: '', pack: '', box: '', minOrder: '', packOnly: false, cat: '' })

  const flatCatItems = () => {
    const out = []
    categories.forEach((c) => c.items?.forEach((i) => out.push({ id: i.id, name: i.name, group: c.name })))
    return out
  }

  const handleAddProduct = (e) => {
    e.preventDefault()
    const cat = productForm.cat || (flatCatItems()[0]?.id)
    addProduct({
      title: productForm.title.trim(),
      size: productForm.size.trim(),
      price: Number(productForm.price) || 0,
      pack: productForm.pack ? Number(productForm.pack) : undefined,
      box: productForm.box ? Number(productForm.box) : undefined,
      minOrder: productForm.minOrder ? Number(productForm.minOrder) : undefined,
      packOnly: productForm.packOnly,
      cat: cat || '',
    })
    setProductForm({ title: '', size: '', price: '', pack: '', box: '', minOrder: '', packOnly: false, cat: '' })
  }

  // Category form
  const [categoryForm, setCategoryForm] = useState({ name: '', items: '' })

  const handleAddCategory = (e) => {
    e.preventDefault()
    const items = categoryForm.items
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, id: '' }))
    addCategory({ name: categoryForm.name.trim(), items })
    setCategoryForm({ name: '', items: '' })
  }

  // User form
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'user' })

  const handleAddUser = (e) => {
    e.preventDefault()
    addUser({ name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role })
    setUserForm({ name: '', email: '', role: 'user' })
  }

  // Settings form — sync when opening settings tab
  const [settingsForm, setSettingsForm] = useState({
    whatsapp: settings.whatsapp || '',
    instagram: settings.instagram || '',
    tiktok: settings.tiktok || '',
  })
  useEffect(() => {
    if (section === 'settings') {
      setSettingsForm({
        whatsapp: settings.whatsapp || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
      })
    }
  }, [section, settings.whatsapp, settings.instagram, settings.tiktok])

  const handleSaveSettings = (e) => {
    e.preventDefault()
    setSettings(settingsForm)
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <Link to="/" className="admin-back">← На сайт</Link>
        <h1 className="admin-title">Админ-панель</h1>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`admin-nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </aside>
        <main className="admin-main">
          {section === 'products' && (
            <section className="admin-section">
              <h2>Товары</h2>
              <form className="admin-form" onSubmit={handleAddProduct}>
                <input
                  type="text"
                  placeholder="Название"
                  value={productForm.title}
                  onChange={(e) => setProductForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Размер (например 9×9см)"
                  value={productForm.size}
                  onChange={(e) => setProductForm((f) => ({ ...f, size: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="Цена ₸"
                  value={productForm.price}
                  onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
                <input type="number" placeholder="В упак (шт)" value={productForm.pack} onChange={(e) => setProductForm((f) => ({ ...f, pack: e.target.value }))} />
                <input type="number" placeholder="В кор (шт)" value={productForm.box} onChange={(e) => setProductForm((f) => ({ ...f, box: e.target.value }))} />
                <input type="number" placeholder="Мин. заказ" value={productForm.minOrder} onChange={(e) => setProductForm((f) => ({ ...f, minOrder: e.target.value }))} />
                <label>
                  <input type="checkbox" checked={productForm.packOnly} onChange={(e) => setProductForm((f) => ({ ...f, packOnly: e.target.checked }))} />
                  Только упаковкой
                </label>
                <select value={productForm.cat} onChange={(e) => setProductForm((f) => ({ ...f, cat: e.target.value }))}>
                  <option value="">— Категория —</option>
                  {flatCatItems().map((i) => (
                    <option key={i.id} value={i.id}>{i.group} / {i.name}</option>
                  ))}
                </select>
                <button type="submit">Добавить товар</button>
              </form>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Размер</th>
                      <th>Цена</th>
                      <th>Кат.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.size}</td>
                        <td>{p.price}₸</td>
                        <td>{p.cat}</td>
                        <td>
                          <button type="button" className="admin-btn-danger" onClick={() => deleteProduct(p.id)}>Удалить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <p className="admin-empty">Товаров пока нет.</p>}
              </div>
            </section>
          )}

          {section === 'categories' && (
            <section className="admin-section">
              <h2>Категории</h2>
              <form className="admin-form" onSubmit={handleAddCategory}>
                <input
                  type="text"
                  placeholder="Название категории"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <textarea
                  placeholder="Подкатегории (каждая с новой строки)"
                  value={categoryForm.items}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, items: e.target.value }))}
                  rows={4}
                />
                <button type="submit">Добавить категорию</button>
              </form>
              <div className="admin-list">
                {categories.map((cat) => (
                  <div key={cat.id} className="admin-card">
                    <strong>{cat.name}</strong>
                    <ul>
                      {(cat.items || []).map((item) => (
                        <li key={item.id}>{item.name}</li>
                      ))}
                    </ul>
                    <button type="button" className="admin-btn-danger" onClick={() => deleteCategory(cat.id)}>Удалить</button>
                  </div>
                ))}
                {categories.length === 0 && <p className="admin-empty">Категорий пока нет.</p>}
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
                  <option value="user">Пользователь</option>
                  <option value="admin">Админ</option>
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
              <h2>Посещения сайта</h2>
              <p className="admin-stat">Всего визитов: <strong>{visits}</strong></p>
              <p className="admin-hint">Счётчик увеличивается при каждом открытии главной страницы.</p>
            </section>
          )}

          {section === 'settings' && (
            <section className="admin-section">
              <h2>Настройки</h2>
              <form className="admin-form settings-form" onSubmit={handleSaveSettings}>
                <h3>Контакты (отображаются на главной)</h3>
                <label>WhatsApp (номер для заказов и ссылка)</label>
                <input
                  type="text"
                  placeholder="87071234567"
                  value={settingsForm.whatsapp}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, whatsapp: e.target.value }))}
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
                <p className="admin-hint">Номер WhatsApp используется для кнопки «Отправить заказ в WhatsApp» в корзине. Заказ уходит текстом на этот номер.</p>
                <button type="submit">Сохранить настройки</button>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default Admin
