import { useState } from 'react'
import html2pdf from 'html2pdf.js'
import { useStore } from '../context/StoreContext'
import OrderFormModal from './OrderFormModal'

function CartBar({ cart, setCart, mode, products }) {
  const [open, setOpen] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [pendingWhatsappNum, setPendingWhatsappNum] = useState(null)
  const { settings, addOrder } = useStore()

  const isRetail = mode === 'retail'
  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0)

  const { cartSum, orderLines } = (() => {
    let sum = 0
    const lines = cartEntries.map(([id, qty]) => {
      const p = products.find((x) => x.id === Number(id))
      if (!p) return null
      const priceRetail = p.priceRetail ?? p.price ?? 0
      const priceOpt = p.priceOpt ?? priceRetail * (p.boxQty ?? 1)
      const lineSum = isRetail ? qty * priceRetail : qty * priceOpt
      sum += lineSum
      return {
        productId: p.id,
        title: p.title,
        article: p.article ?? p.size,
        qty,
        price: isRetail ? priceRetail : priceOpt,
        total: lineSum.toFixed(2),
        unit: isRetail ? 'шт' : 'кор',
        boxQty: p.boxQty ?? 1,
      }
    }).filter(Boolean)
    return { cartSum: sum, orderLines: lines }
  })()

  const totalUnits = cartEntries.reduce((s, [, q]) => s + q, 0)

  const getOrderText = (client) => [
    `ЗАКАЗ (${isRetail ? 'розница' : 'опт'})`,
    `Дата: ${new Date().toLocaleString('ru-KZ')}`,
    '',
    '--- ДАННЫЕ КЛИЕНТА ---',
    `ФИО: ${client?.name || '—'}`,
    `Телефон: ${client?.phone || '—'}`,
    `Город: ${client?.city || '—'}`,
    `Адрес: ${client?.address || '—'}`,
    '',
    '--- ТОВАРЫ ---',
    ...orderLines.map((o) => `${o.title} ${o.article ? `(${o.article})` : ''} — ${o.qty} ${o.unit} × ${o.price}₸ = ${o.total}₸`),
    '',
    `Итого: ${cartSum.toLocaleString('ru-KZ')}₸`,
  ].join('\n')

  const makePdf = (client) => {
    const logoUrl = (settings.logoUrl || '').trim() || '/logo.png'
    const div = document.createElement('div')
    div.id = 'pdf-invoice-root'
    div.innerHTML = `
      <div id="pdf-invoice-content" style="font-family: Arial, sans-serif; padding: 24px; font-size: 14px; line-height: 1.5; color: #1a1a1a; background: #fff; width: 190mm;">
        <div style="margin-bottom: 16px;">
          <img src="${logoUrl}" alt="Logo" style="max-height: 48px; max-width: 180px;" onerror="this.style.display='none'"/>
        </div>
        <h1 style="font-size: 22px; margin: 0 0 20px 0; border-bottom: 2px solid #333; padding-bottom: 10px;">НАКЛАДНАЯ / ЗАКАЗ</h1>
        <p style="margin: 0 0 16px 0;">Дата: ${new Date().toLocaleString('ru-KZ')}</p>
        <div style="margin: 20px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
          <h2 style="font-size: 16px; margin: 0 0 12px 0;">ДАННЫЕ КЛИЕНТА</h2>
          <p style="margin: 4px 0;"><strong>ФИО:</strong> ${(client?.name || '').replace(/</g, '&lt;')}</p>
          <p style="margin: 4px 0;"><strong>Телефон:</strong> ${(client?.phone || '').replace(/</g, '&lt;')}</p>
          <p style="margin: 4px 0;"><strong>Город:</strong> ${(client?.city || '').replace(/</g, '&lt;')}</p>
          <p style="margin: 4px 0;"><strong>Адрес поставки:</strong> ${(client?.address || '').replace(/</g, '&lt;')}</p>
        </div>
        <h2 style="font-size: 16px; margin: 20px 0 12px 0;">ТОВАРЫ</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #eee;">
              <th style="text-align: left; padding: 10px 8px; border: 1px solid #ddd;">Товар</th>
              <th style="text-align: center; padding: 10px 8px; border: 1px solid #ddd;">Кол-во</th>
              <th style="text-align: right; padding: 10px 8px; border: 1px solid #ddd;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${orderLines.map((o) => `
              <tr>
                <td style="padding: 10px 8px; border: 1px solid #ddd;">${(o.title + (o.article ? ` (${o.article})` : '')).replace(/</g, '&lt;')}</td>
                <td style="text-align: center; padding: 10px 8px; border: 1px solid #ddd;">${o.qty} ${o.unit}</td>
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
      client: { name: client.name, phone: client.phone, city: client.city, address: client.address },
      items: orderLines,
      totalSum: cartSum,
      mode,
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

  if (totalUnits === 0) {
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
          <span className="cart-summary">
            {isRetail ? `${totalUnits} шт` : `${totalUnits} кор`} — {cartSum.toLocaleString('ru-KZ')}₸
          </span>
          <span className="cart-bar-chevron">{open ? '▼' : '▲'}</span>
        </button>
        {open && (
          <div className="cart-bar-content">
            <ul className="cart-list">
              {cartEntries.map(([id, qty]) => {
                const p = products.find((x) => x.id === Number(id))
                if (!p) return null
                const priceRetail = p.priceRetail ?? p.price ?? 0
                const priceOpt = p.priceOpt ?? priceRetail * (p.boxQty ?? 1)
                const lineSum = isRetail ? qty * priceRetail : qty * priceOpt
                return (
                  <li key={id} className="cart-list-item">
                    <span>
                      {p.title} — {qty} {isRetail ? 'шт' : 'кор'} × {isRetail ? priceRetail : priceOpt}₸ = {lineSum.toLocaleString('ru-KZ')}₸
                    </span>
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
                      <span>{qty}</span>
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
