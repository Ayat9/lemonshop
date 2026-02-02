import { useState, useRef } from 'react'

function ProductModal({ product, categories, stockEnabled, onSave, onClose }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    title: product?.title ?? '',
    article: product?.article ?? product?.size ?? '',
    size: product?.size ?? '',
    barcode: product?.barcode ?? '',
    description: product?.description ?? '',
    costPrice: product?.costPrice ?? '',
    priceRetail: product?.priceRetail ?? product?.price ?? '',
    priceOpt: product?.priceOpt ?? '',
    boxQty: product?.boxQty ?? 1,
    stock: product?.stock ?? '',
    cat: product?.cat ?? '',
    imageData: product?.imageData ?? null,
  })
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const boxQty = Math.max(1, Number(form.boxQty) || 1)
    const priceRetail = Number(form.priceRetail) || 0
    const priceOpt = form.priceOpt !== '' ? Number(form.priceOpt) : priceRetail * boxQty
    onSave({
      ...form,
      id: product?.id,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      price: priceRetail,
      priceRetail,
      priceOpt,
      boxQty,
      stock: stockEnabled && form.stock !== '' ? Number(form.stock) : null,
      article: form.article?.trim() || form.size?.trim() || '',
      size: form.size?.trim() || form.article?.trim() || '',
      createdAt: product?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  const generateBarcode = () => {
    const prefix = '200'
    const random = String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')
    setForm((f) => ({ ...f, barcode: prefix + random }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      if (data.length > 200000) {
        alert('Изображение слишком большое. Выберите файл до 200 КБ.')
        return
      }
      setForm((f) => ({ ...f, imageData: data }))
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setForm((f) => ({ ...f, imageData: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Редактировать товар' : 'Новый товар'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="product-modal-row">
            <label>Наименование товара *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название товара"
              required
            />
          </div>
          <div className="product-modal-row">
            <label>Штрих-код</label>
            <div className="product-modal-barcode">
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                placeholder="Введите или сгенерируйте"
              />
              <button type="button" className="admin-btn-small" onClick={generateBarcode}>Сгенерировать</button>
            </div>
          </div>
          <div className="product-modal-row">
            <label>Изображение</label>
            <div className="product-modal-image">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {form.imageData ? (
                <div className="product-modal-image-preview">
                  <img src={form.imageData} alt="" />
                  <button type="button" className="admin-btn-small" onClick={removeImage}>Удалить</button>
                </div>
              ) : (
                <button type="button" className="admin-btn-small" onClick={() => fileInputRef.current?.click()}>
                  Загрузить с компьютера
                </button>
              )}
            </div>
          </div>
          <div className="product-modal-row">
            <label>Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Описание товара"
              rows={3}
            />
          </div>
          <div className="product-modal-row product-modal-row-2">
            <div>
              <label>Цена розница (за шт), ₸ *</label>
              <input
                type="number"
                value={form.priceRetail}
                onChange={(e) => setForm((f) => ({ ...f, priceRetail: e.target.value }))}
                placeholder="0"
                required
                min={0}
              />
            </div>
            <div>
              <label>Цена опт (за коробку), ₸</label>
              <input
                type="number"
                value={form.priceOpt}
                onChange={(e) => setForm((f) => ({ ...f, priceOpt: e.target.value }))}
                placeholder="авто (розница × в коробке)"
                min={0}
              />
            </div>
          </div>
          <div className="product-modal-row">
            <label>Закупочная цена, ₸</label>
            <input
              type="number"
              value={form.costPrice}
              onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
              placeholder="0"
              min={0}
            />
          </div>
          <div className="product-modal-row product-modal-row-2">
            <div>
              <label>Количество в коробке *</label>
              <input
                type="number"
                value={form.boxQty}
                onChange={(e) => setForm((f) => ({ ...f, boxQty: e.target.value }))}
                min={1}
                required
              />
            </div>
            {stockEnabled && (
              <div>
                <label>Остаток (шт)</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  placeholder="Неограничено"
                  min={0}
                />
                <span className="product-modal-hint">0 = нет в наличии</span>
              </div>
            )}
          </div>
          <div className="product-modal-row product-modal-row-2">
            <div>
              <label>Артикул</label>
              <input
                type="text"
                value={form.article}
                onChange={(e) => setForm((f) => ({ ...f, article: e.target.value }))}
                placeholder="Артикул"
              />
            </div>
            <div>
              <label>Размер</label>
              <input
                type="text"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                placeholder="Например: 9×9 см"
              />
            </div>
          </div>
          <div className="product-modal-row">
            <label>Категория</label>
            <select value={form.cat} onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))}>
              <option value="">— Без категории —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.path}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="admin-btn-small" onClick={onClose}>Отмена</button>
            <button type="submit" className="admin-btn-save">{isEdit ? 'Сохранить' : 'Добавить'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal
