import { Sale } from '../types'
import { AppSettings } from '../types'

interface ReceiptPrintTemplateProps {
  sale: Sale | null
  settings: AppSettings | null
}

export function ReceiptPrintTemplate({ sale, settings }: ReceiptPrintTemplateProps) {
  if (!sale) return null

  const appName = settings?.app_name || 'Brutal System'
  const shortId = sale.id ? sale.id.split('-')[0].toUpperCase() : 'ERR'
  const date = new Date(sale.created_at).toLocaleString('es-CO')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div id="print-receipt-container" className="hidden print:block fixed inset-0 bg-white text-black z-[9999] p-4 text-sm font-sans w-[80mm] mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold uppercase">{appName}</h1>
        <div className="text-xs mt-1">TICKET: #{shortId}</div>
        <div className="text-xs">FECHA: {date}</div>
        {sale.customer_name && <div className="text-xs mt-1">CLIENTE: {sale.customer_name}</div>}
        {sale.order_type === 'delivery' && sale.delivery_address && (
          <div className="text-xs mt-1">DOMICILIO: {sale.delivery_address}</div>
        )}
      </div>

      <hr className="border-t border-black border-dashed my-2" />

      {/* Items */}
      <table className="w-full text-xs mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1 w-8">Cant</th>
            <th className="text-left py-1">Producto</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1 align-top">{item.quantity}</td>
              <td className="py-1 align-top">
                {item.hotdog_type}
                {item.modifiers?.protein && (
                  <div className="text-[10px] uppercase text-gray-600">(+ {item.modifiers.protein})</div>
                )}
              </td>
              <td className="py-1 text-right align-top">{formatCurrency(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="border-t border-black border-dashed my-2" />

      {/* Totals */}
      <div className="flex justify-between font-bold text-base my-2">
        <span>TOTAL:</span>
        <span>{formatCurrency(sale.total_amount)}</span>
      </div>

      <hr className="border-t border-black border-dashed my-2" />

      {/* Footer */}
      <div className="text-center text-xs mt-4">
        <p>¡Gracias por tu compra!</p>
        <p>Sigue tu pedido en nuestra web</p>
      </div>
    </div>
  )
}
