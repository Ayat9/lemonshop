import { useState } from 'react'
import html2pdf from 'html2pdf.js'
import { useStore } from '../context/StoreContext'
import OrderFormModal from './OrderFormModal'

function CartBar({ cart, setCart, products }) {
  const [open, setOpen] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [pendingWhatsappNum, setPendingWhatsappNum] = useState(null)
  const { settings, addOrder } = useStore()

  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0)
  const totalBoxes = cartEntries.reduce((s, [, q]) => s + q, 0)
  const cartSum = cartEntries.reduce((s, [id, boxes]) => {
    const p = products.find((x) => x.id === Number(id))
    if (!p) return s
    const boxQty = p.boxQty ?? 1
    return s + p.price * boxQty * boxes
  }, 0)

  const orderLines = cartEntries.map(([id, boxes]) => {
    const p = products.find((x) => x.id === Number(id))
    if (!p) return null
    const boxQty = p.boxQty ?? 1
    const total = (p.price * boxQty * boxes).toFixed(2)
    return { productId: p.id, title: p.title, size: p.size, boxes, boxQty, price: p.price, total }
  }).filter(Boolean)

  const getOrderText = (client) => [
    'ЗАКАЗ (по коробкам)',
    `Дата: ${new Date().toLocaleString('ru-KZ')}`,
    '',
    '--- ДАННЫЕ КЛИЕНТА ---',
    `Имя: ${client?.name || '—'}`,
    `Телефон: ${client?.phone || '—'}`,
    `Адрес поставки: ${client?.address || '—'}`,
    '',
    '--- ТОВАРЫ ---',
    ...orderLines.map((o) => `${o.title} (${o.size}) — ${o.boxes} кор. × (${o.boxQty} шт × ${o.price}₸) = ${o.total}₸`),
    '',
    `Итого: ${cartSum.toLocaleString('ru-KZ')}₸`,
  ].join('\n')

  const makePdf = (client) => {
    const div = document.createElement('div')
    div.id = 'pdf-invoice-root'
    div.innerHTML = `
      <div id="pdf-invoice-content" style="font-family: Arial, sans-serif; padding: 24px; font-size: 14px; line-height: 1.5; color: #1a1a1a; background: #fff; width: 190mm;">
        <h1 style="font-size: 22px; margin: 0 0 20px 0; border-bottom: 2px solid #333; padding-bottom: 10px;">НАКЛАДНАЯ / ЗАКАЗ</h1>
        <p style="margin: 0 0 16px 0;">Дата: ${new Date().toLocaleString('ru-KZ')}</p>
        <div style="margin: 20px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
          <h2 style="font-size: 16px; margin: 0 0 12px 0;">ДАННЫЕ КЛИЕНТА</h2>
          <p style="margin: 4px 0;"><strong>Имя:</strong> ${(client?.name || '').replace(/</g, '&lt;')}</p>
          <p style="margin: 4px 0;"><strong>Телефон:</strong> ${(client?.phone || '').replace(/</g, '&lt;')}</p>
          <p style="margin: 4px 0;"><strong>Адрес поставки:</strong> ${(client?.address || '').replace(/</g, '&lt;')}</p>
        </div>
        <h2 style="font-size: 16px; margin: 20px 0 12px 0;">ТОВАРЫ</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #eee;">
              <th style="text-align: left; padding: 10px 8px; border: 1px solid #ddd;">Товар</th>
              <th style="text-align: center; padding: 10px 8px; border: 1px solid #ddd;">Кол-во кор.</th>
              <th style="text-align: right; padding: 10px 8px; border: 1px solid #ddd;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${orderLines.map((o) => `
              <tr>
                <td style="padding: 10px 8px; border: 1px solid #ddd;">${(o.title + (o.size ? ` (${o.size})` : '')).replace(/</g, '&lt;')}</td>
                <td style="text-align: center; padding: 10px 8px; border: 1px solid #ddd;">${o.boxes} кор. × ${o.boxQty} шт</td>
                <td style="text-align: right; padding: 10px 8px; border: 1px solid #ddd;">${o.total}₸</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 18px; font-weight: bold; margin: 16px 0 0 0;">Итого: ${cartSum.toLocaleString('ru-KZ')}₸</p>
      </div>
    `
    div.style.cssText = 'position:fixed;left:0;top:0;width:210mm;z-index:999999;background:#fff;'
    document.body.appendChild(div)
    const el = div.querySelector('#pdf-invoice-content')
    html2pdf()
      .set({
        margin: 10,
        filename: `zakaz-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(el)
      .save()
      .then(() => {
        if (div.parentNode) document.body.removeChild(div)
      })
      .catch(() => {
        if (div.parentNode) document.body.removeChild(div)
      })
  }

  const openOrderModal = (whatsappNum = null) => {
    setPendingWhatsappNum(whatsappNum)
    setShowOrderModal(true)
  }

  const handleOrderConfirm = (client) => {
    const orderData = {
      client: { name: client.name, phone: client.phone, address: client.address },
      items: orderLines,
      totalSum: cartSum,
    }
    addOrder(orderData)
    makePdf(client)
    const nums = [settings.orderWhatsapp1, settings.orderWhatsapp2, settings.orderWhatsapp3, settings.orderWhatsapp4].filter((n) => n?.trim())
    const primary = nums[0] || settings.whatsapp
    const num = (pendingWhatsappNum || primary || '').replace(/\D/g, '')
    if (num) {
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(getOrderText(client))}`, '_blank')
    }
    setCart({})
    setShowOrderModal(false)
    setPendingWhatsappNum(null)
  }

  const orderNumbers = [settings.orderWhatsapp1, settings.orderWhatsapp2, settings.orderWhatsapp3, settings.orderWhatsapp4].filter((n) => n?.trim())
  const fallbackWhatsapp = (settings.whatsapp || '').trim()
  const hasWhatsapp = orderNumbers.length > 0 || fallbackWhatsapp

  if (totalBoxes === 0) {
    return (
      <div className="cart-bar">
        <span className="cart-summary">Корзина пуста</span>
      </div>
    )
  }

  return (
    <>
      <div className={`cart-bar ${open ? 'cart-bar-open' : ''}`}>
        <button
          type="button"
          className="cart-bar-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="cart-summary">Выбрано {totalBoxes} кор. ({cartSum.toLocaleString('ru-KZ')}₸)</span>
          <span className="cart-bar-chevron">{open ? '▼' : '▲'}</span>
        </button>
        {open && (
          <div className="cart-bar-content">
            <ul className="cart-list">
              {cartEntries.map(([id, boxes]) => {
                const p = products.find((x) => x.id === Number(id))
                if (!p) return null
                const boxQty = p.boxQty ?? 1
                const total = (p.price * boxQty * boxes).toLocaleString('ru-KZ')
                return (
                  <li key={id} className="cart-list-item">
                    <span>{p.title} — {boxes} кор. × ({boxQty} шт × {p.price.toLocaleString('ru-KZ')}₸) = {total}₸</span>
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
                      <span>{boxes}</span>
                      <button type="button" className="qty-btn small" onClick={() => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))}>+</button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="cart-bar-buttons">
              {hasWhatsapp ? (
                <div className="cart-whatsapp-buttons">
                  {(orderNumbers.length > 0 ? orderNumbers : [fallbackWhatsapp]).map((num, i) => {
                    const clean = (num || '').replace(/\D/g, '')
                    if (!clean) return null
                    const display = clean.length >= 10 ? `+${clean.slice(0, -10) || '7'} ${clean.slice(-10).replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2-$3-$4')}` : num
                    return (
                      <button
                        key={i}
                        type="button"
                        className="cart-whatsapp-btn"
                        onClick={() => openOrderModal(clean)}
                      >
                        Оформить заказ → {display}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <button type="button" className="cart-open-btn" onClick={() => openOrderModal()}>
                  Оформить заказ (PDF)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showOrderModal && (
        <OrderFormModal
          onConfirm={handleOrderConfirm}
          onClose={() => { setShowOrderModal(false); setPendingWhatsappNum(null); }}
        />
      )}
    </>
  )
}

export default CartBar
