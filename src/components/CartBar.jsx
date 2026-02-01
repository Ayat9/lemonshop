import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { useStore } from '../context/StoreContext'

function CartBar({ cart, setCart, products }) {
  const [open, setOpen] = useState(false)
  const { settings } = useStore()

  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0)
  const cartCount = cartEntries.reduce((s, [, q]) => s + q, 0)
  const cartSum = cartEntries.reduce((s, [id, q]) => {
    const p = products.find((x) => x.id === Number(id))
    return s + (p ? p.price * q : 0)
  }, 0)

  const orderLines = cartEntries.map(([id, q]) => {
    const p = products.find((x) => x.id === Number(id))
    if (!p) return null
    return `${p.title} (${p.size}) — ${q} шт × ${p.price}₸ = ${(p.price * q).toFixed(2)}₸`
  }).filter(Boolean)

  const orderText = [
    'ЗАКАЗ',
    new Date().toLocaleString('ru-KZ'),
    '',
    ...orderLines,
    '',
    `Итого: ${cartSum.toLocaleString('ru-KZ')}₸`,
  ].join('\n')

  const makePdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const font = doc.getFont()
    doc.setFontSize(14)
    doc.text('Накладная / Заказ', 20, 20)
    doc.setFontSize(10)
    doc.text(`Дата: ${new Date().toLocaleString('ru-KZ')}`, 20, 28)
    let y = 38
    doc.setFontSize(11)
    orderLines.forEach((line) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, 20, y)
      y += 7
    })
    y += 5
    doc.setFontSize(12)
    doc.text(`Итого: ${cartSum.toLocaleString('ru-KZ')}₸`, 20, y)
    doc.save(`zakaz-${Date.now()}.pdf`)
  }

  const whatsappNumber = (settings.whatsapp || '').replace(/\D/g, '')
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText)}`
    : null

  if (cartCount === 0) {
    return (
      <div className="cart-bar">
        <span className="cart-summary">Корзина пуста</span>
      </div>
    )
  }

  return (
    <div className={`cart-bar ${open ? 'cart-bar-open' : ''}`}>
      <button
        type="button"
        className="cart-bar-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="cart-summary">Выбрано {cartCount} тов ({cartSum.toLocaleString('ru-KZ')}₸)</span>
        <span className="cart-bar-chevron">{open ? '▼' : '▲'}</span>
      </button>
      {open && (
        <div className="cart-bar-content">
          <ul className="cart-list">
            {cartEntries.map(([id, q]) => {
              const p = products.find((x) => x.id === Number(id))
              if (!p) return null
              return (
                <li key={id} className="cart-list-item">
                  <span>{p.title} — {q} шт × {p.price.toLocaleString('ru-KZ')}₸ = {(p.price * q).toLocaleString('ru-KZ')}₸</span>
                  <div className="cart-list-actions">
                    <button type="button" className="qty-btn small" onClick={() => {
                      setCart((prev) => {
                        const next = { ...prev }
                        const newQ = Math.max(0, (prev[id] || 0) - 1)
                        if (newQ === 0) delete next[id]
                        else next[id] = newQ
                        return next
                      })
                    }}>−</button>
                    <span>{q}</span>
                    <button type="button" className="qty-btn small" onClick={() => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))}>+</button>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="cart-bar-buttons">
            <button type="button" className="cart-open-btn" onClick={makePdf}>
              Скачать накладную (PDF)
            </button>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="cart-whatsapp-btn">
                Отправить заказ в WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CartBar
