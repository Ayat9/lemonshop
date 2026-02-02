import { useState } from 'react'

function OrderFormModal({ onConfirm, onClose }) {
  const [form, setForm] = useState({ fio: '', phone: '', city: '', address: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.fio?.trim()) e.fio = 'Укажите ФИО'
    if (!form.phone?.trim()) e.phone = 'Укажите номер телефона'
    if (!form.city?.trim()) e.city = 'Укажите город'
    if (!form.address?.trim()) e.address = 'Укажите адрес поставки'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onConfirm({ name: form.fio.trim(), phone: form.phone.trim(), city: form.city.trim(), address: form.address.trim() })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Данные для заказа</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <p className="order-form-hint">Пожалуйста, заполните обязательные поля перед оформлением заказа.</p>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="order-form-row">
            <label htmlFor="order-fio">ФИО *</label>
            <input
              id="order-fio"
              type="text"
              value={form.fio}
              onChange={(e) => setForm((f) => ({ ...f, fio: e.target.value }))}
              placeholder="Фамилия Имя Отчество"
              className={errors.fio ? 'order-form-error' : ''}
            />
            {errors.fio && <span className="order-form-err-msg">{errors.fio}</span>}
          </div>
          <div className="order-form-row">
            <label htmlFor="order-phone">Номер телефона *</label>
            <input
              id="order-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+7 777 123 45 67"
              className={errors.phone ? 'order-form-error' : ''}
            />
            {errors.phone && <span className="order-form-err-msg">{errors.phone}</span>}
          </div>
          <div className="order-form-row">
            <label htmlFor="order-city">Город *</label>
            <input
              id="order-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Город"
              className={errors.city ? 'order-form-error' : ''}
            />
            {errors.city && <span className="order-form-err-msg">{errors.city}</span>}
          </div>
          <div className="order-form-row">
            <label htmlFor="order-address">Адрес поставки *</label>
            <textarea
              id="order-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Улица, дом, квартира"
              rows={3}
              className={errors.address ? 'order-form-error' : ''}
            />
            {errors.address && <span className="order-form-err-msg">{errors.address}</span>}
          </div>
          <div className="modal-footer">
            <button type="button" className="admin-btn-small" onClick={onClose}>Отмена</button>
            <button type="submit" className="admin-btn-save">Продолжить</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderFormModal
