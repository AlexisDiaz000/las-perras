import { useEffect, useMemo, useState } from 'react'
import { salesService, consumeInventoryForSale } from '../services/sales'
import { getColombiaDate } from '../lib/dateUtils'
import { Sale } from '../types'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { LinkIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { generateReceiptPDF } from '../lib/pdf'
import { useSettingsStore } from '../stores/settings'
import { ReceiptPrintTemplate } from './ReceiptPrintTemplate'

// Componente para el ícono de WhatsApp
const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

const BOARD_COLUMNS = [
  { key: 'preparing', title: 'Preparación' },
  { key: 'delivered', title: 'Por Cobrar' },
  { key: 'paid', title: 'Completado' },
] as const

const STATUS_LABELS: Record<string, string> = {
  preparing: 'Preparación',
  delivered: 'Por Cobrar',
  paid: 'Completado',
  voided: 'Anulado',
  refunded: 'Reembolsado',
}

export function RecentOrders() {
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const { activeOrders, fetchOrders, isLoading } = useNotificationsStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selected, setSelected] = useState<Sale | null>(null)
  const [voidingOrder, setVoidingOrder] = useState<Sale | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [refundingOrder, setRefundingOrder] = useState<Sale | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [payMethod, setPayMethod] = useState<'cash' | 'card'>('cash')

  const [dateRange, setDateRange] = useState({
    start: getColombiaDate(),
    end: getColombiaDate()
  })
  
  const [printingSale, setPrintingSale] = useState<Sale | null>(null)
  const [whatsappSale, setWhatsappSale] = useState<Sale | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDownloadPDF = async (sale: Sale) => {
    try {
      const blob = generateReceiptPDF(sale, settings)
      
      // Crear un nombre de archivo limpio y profesional
      const orderNum = getOrderLabel(sale).replace('#', '')
      const customerName = sale.customer_name ? `_${sale.customer_name.replace(/[^a-zA-Z0-9]/g, '')}` : ''
      const fileName = `Factura_Pedido_${orderNum}${customerName}.pdf`
      
      const file = new File([blob], fileName, { type: 'application/pdf' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Factura ${getOrderLabel(sale)}`,
            text: `Aquí tienes el recibo de tu compra en ${settings?.app_name || 'Brutal System'}`,
            files: [file]
          })
          return
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            console.error('Error sharing:', shareError)
          } else {
            return
          }
        }
      }
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error generating PDF', e)
      alert('Error al generar la factura')
    }
  }

  const handlePrint = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation()
    setPrintingSale(sale)
    // Usar setTimeout para dar tiempo al navegador de renderizar el componente oculto
    setTimeout(() => {
      window.print()
      // Limpiar el estado después de imprimir (opcional, pero limpio)
      setTimeout(() => setPrintingSale(null), 1000)
    }, 100)
  }

  const handleWhatsApp = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation()
    if (sale.customer_phone) {
      sendWhatsApp(sale, sale.customer_phone)
    } else {
      // Abrir modal para pedir número
      setWhatsappSale(sale)
      setWhatsappPhone('')
    }
  }

  const sendWhatsApp = async (sale: Sale, phoneInput: string) => {
    if (!phoneInput) return
    
    // Limpiar el número de teléfono
    let phone = phoneInput.replace(/\D/g, '')
    if (phone.length === 10) {
      phone = '57' + phone
    }

    // El flujo ideal web es descargar el PDF localmente y abrir WhatsApp Web para que el usuario lo arrastre.
    const message = `¡Hola! Aquí tienes el recibo de tu compra (${getOrderLabel(sale)}) en ${settings?.app_name || 'Brutal System'} por un total de $${sale.total_amount.toLocaleString('es-CO')}.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    
    // Primero descargamos el PDF (usamos await para asegurar que se procese)
    await handleDownloadPDF(sale)
    
    // Luego abrimos WhatsApp en otra pestaña
    setTimeout(() => {
      window.open(whatsappUrl, '_blank')
    }, 500)
    
    setWhatsappSale(null)
  }

  // Ya no usamos setInterval, confiamos en la suscripción en tiempo real de notificationsStore
  // Solo cargamos los datos iniciales al cambiar de fecha si no es el día actual (porque el día actual ya lo maneja el Layout/Store)
  useEffect(() => {
    const today = getColombiaDate()
    if (dateRange.start !== today || dateRange.end !== today) {
      // Si el usuario cambia la fecha en el calendario, necesitamos hacer un fetch manual
      fetchOrders() // Idealmente este fetchOrders debería aceptar parámetros de fecha, pero por ahora lo dejamos así
    }
  }, [dateRange, fetchOrders])

  const updateStatus = async (saleId: string, status: Sale['status']) => {
    setActionLoading(saleId)
    try {
      await salesService.updateSale(saleId, { status } as any)
      
      // Descontar inventario SOLAMENTE cuando el pedido pasa a "Listo / Por cobrar" (delivered)
      if (status === 'delivered' && user) {
        const items = await salesService.getSaleItems(saleId)
        if (items && items.length > 0) {
          await consumeInventoryForSale(saleId, user.id, items)
        }
      }

      // No necesitamos llamar a loadOrders() aquí porque el websocket actualizará el estado automáticamente
    } catch (error: any) {
      alert(error?.message || 'Error al actualizar pedido')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePay = async (saleId: string, method: 'cash' | 'card') => {
    if (!user) return
    setActionLoading(saleId)
    try {
      await salesService.finalizeSale(saleId, user.id, method)
      // Websocket actualizará el estado
    } catch (error: any) {
      alert(error?.message || 'Error al procesar pago')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVoid = async () => {
    if (!user || !voidingOrder) return
    if (!voidReason.trim()) {
      alert('Por favor ingresa un motivo para anular el pedido.')
      return
    }
    setActionLoading(voidingOrder.id)
    try {
      await salesService.voidSale(voidingOrder.id, voidReason.trim(), user.id, false)
      setVoidingOrder(null)
      setVoidReason('')
      setSelected(null)
      // Websocket actualizará el estado
    } catch (error: any) {
      alert(error?.message || 'Error al anular pedido')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefund = async () => {
    if (!user || !refundingOrder) return
    if (!refundReason.trim()) {
      alert('Por favor ingresa un motivo para el reembolso.')
      return
    }
    setActionLoading(refundingOrder.id)
    try {
      await salesService.refundSale(refundingOrder.id, refundReason.trim(), user.id)
      setRefundingOrder(null)
      setRefundReason('')
      setSelected(null)
      // Websocket actualizará el estado
    } catch (error: any) {
      alert(error?.message || 'Error al reembolsar')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (!selected) return
    if (selected.payment_method === 'cash' || selected.payment_method === 'card') {
      setPayMethod(selected.payment_method)
    } else {
      setPayMethod('cash')
    }
  }, [selected])

  const getOrderLabel = (sale: Sale) => {
    try {
      if (typeof sale.order_number === 'number') return `#${sale.order_number}`
      if (sale.id && typeof sale.id === 'string') return `#${sale.id.slice(0, 8)}`
      return '#???'
    } catch {
      return '#ERR'
    }
  }

  const filteredOrders = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return activeOrders
    return activeOrders.filter(s => {
      if (!s) return false
      try {
        const label = getOrderLabel(s).toLowerCase()
        const desc = String(s.description || '').toLowerCase()
        const num = String(s.order_number ?? '').toLowerCase()
        return label.includes(q) || desc.includes(q) || num.includes(q) || (s.id && s.id.toLowerCase().includes(q))
      } catch {
        return false
      }
    })
  }, [activeOrders, debouncedSearch])

  const grouped = useMemo(() => {
    const map: Record<string, Sale[]> = {}
    for (const col of BOARD_COLUMNS) map[col.key] = []
    for (const sale of filteredOrders) {
      if (!sale) continue
      const key = (sale.status || 'draft') as string
      if (!map[key]) map[key] = []
      map[key].push(sale)
    }
    return map
  }, [filteredOrders])

  const renderItemsPreview = (sale: Sale) => {
    const items = sale.items || []
    if (!items.length) return null
    const preview = items.slice(0, 3).map(it => {
      let text = `${it.quantity}× ${it.hotdog_type}`
      if (it.modifiers?.protein) text += ` (+${it.modifiers.protein})`
      return text
    }).join(' · ')
    const extra = items.length > 3 ? ` · +${items.length - 3} más` : ''
    return `${preview}${extra}`
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="brand-heading text-3xl">Pedidos</h1>
            <div className="text-sm text-secondary-300">Caja: cobra, anula y reembolsa</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="date"
              className="brand-input w-full sm:w-auto"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <span className="hidden sm:inline text-secondary-400">-</span>
            <input
              type="date"
              className="brand-input w-full sm:w-auto"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
            <input
              className="brand-input sm:w-[22rem]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              placeholder="Buscar # pedido, descripción o id..."
            />
            <button onClick={fetchOrders} className="brand-button">
              Actualizar
            </button>
          </div>
        </div>

        {isLoading && !activeOrders.length ? (
          <div className="brand-card p-6 text-secondary-300">Cargando...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="brand-card p-6 text-secondary-300">No hay pedidos hoy.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BOARD_COLUMNS.map(col => (
              <div key={col.key} className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="text-sm font-semibold uppercase tracking-widest text-secondary-50">{col.title}</div>
                  <div className="text-xs bg-white/10 px-2 py-1 rounded-full text-secondary-200 font-mono">
                    {(grouped[col.key] || []).length}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {(grouped[col.key] || []).length === 0 ? (
                    <div className="text-sm text-secondary-400 italic p-4 text-center border border-dashed border-white/5 rounded-lg">
                      Vacío
                    </div>
                  ) : (
                    (grouped[col.key] || []).map(sale => (
                      <div
                        key={sale.id}
                        onClick={() => setSelected(sale)}
                        className="w-full text-left brand-card p-4 hover:bg-white/5 transition-colors group relative overflow-hidden cursor-pointer"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white block">{getOrderLabel(sale)}</span>
                            <span className="text-xs text-gray-500 dark:text-secondary-400">
                              {new Date(sale.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                            {formatCurrency(Number(sale.total_amount || 0))}
                          </span>
                        </div>

                        {sale.description && (
                          <div className="mb-3 text-sm text-gray-600 dark:text-secondary-300 bg-gray-100 dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/5">
                            "{sale.description}"
                          </div>
                        )}

                        <div className="space-y-1">
                          {renderItemsPreview(sale) && (
                            <div className="text-sm text-gray-600 dark:text-secondary-200">
                              {renderItemsPreview(sale)}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                           <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded ${
                             sale.status === 'preparing' ? 'bg-warning/10 text-warning dark:bg-warning/20' :
                             sale.status === 'delivered' ? 'bg-info/10 text-info dark:bg-info/20' :
                             'bg-success/10 text-success dark:bg-success/20'
                           }`}>
                             {STATUS_LABELS[sale.status || 'draft']}
                           </span>

                           {sale.status === 'paid' ? (
                             <div className="flex gap-2 relative z-10">
                               <button 
                                 onClick={(e) => handleWhatsApp(sale, e)}
                                 className="p-1.5 border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366] rounded transition-all"
                                 title="Enviar por WhatsApp"
                               >
                                 <WhatsAppIcon className="w-5 h-5" />
                               </button>
                               <button 
                                 onClick={(e) => handlePrint(sale, e)}
                                 className="p-1.5 border border-secondary-400 text-secondary-400 hover:bg-white/10 hover:text-white rounded transition-all"
                                 title="Imprimir Ticket"
                               >
                                 <PrinterIcon className="w-5 h-5" />
                               </button>
                             </div>
                           ) : (
                             <span className="text-xs text-gray-500 dark:text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-white transition-colors">
                                Ver detalles →
                              </span>
                            )}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="brand-card p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="brand-heading text-2xl flex flex-wrap items-center gap-3">
                  {getOrderLabel(selected)}
                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}/status/${selected.id}`;
                      navigator.clipboard.writeText(url);
                      alert('Enlace de seguimiento copiado al portapapeles');
                    }}
                    className="text-xs font-sans normal-case tracking-normal bg-[color:var(--app-hover)] text-[color:var(--app-text)] px-2 py-1 rounded-md flex items-center gap-1 hover:bg-[color:var(--app-hover-strong)] transition-colors border border-[color:var(--app-border)]"
                    title="Copiar enlace de seguimiento"
                  >
                    <LinkIcon className="h-3 w-3" /> Copiar Link
                  </button>

                  <button 
                    onClick={() => handleDownloadPDF(selected)}
                    className="text-xs font-sans normal-case tracking-normal bg-[color:var(--app-hover)] text-[color:var(--app-text)] px-2 py-1 rounded-md flex items-center gap-1 hover:bg-[color:var(--app-hover-strong)] transition-colors border border-[color:var(--app-border)]"
                    title="Generar Factura PDF"
                  >
                    <DocumentArrowDownIcon className="h-3 w-3" /> Factura PDF
                  </button>
                </div>
                <div className="text-sm text-secondary-300 mt-1">
                  {new Date(selected.created_at).toLocaleString('es-CO')} · {STATUS_LABELS[selected.status || 'draft'] || selected.status}
                </div>
                {selected.description && (
                  <div className="text-sm text-secondary-200 mt-3">
                    {selected.description}
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="px-3 py-2 rounded-md border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest text-xs">
                Cerrar
              </button>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-secondary-300 mb-3">Items</div>
              <div className="space-y-2">
                {(selected.items || []).length === 0 ? (
                  <div className="text-sm text-secondary-400">Sin items.</div>
                ) : (
                  (selected.items || []).map((it: any) => (
                    <div key={it.id} className="flex items-start justify-between gap-3 border border-white/10 rounded-lg p-3 bg-white/5">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-secondary-50">
                          {it.quantity}× {it.hotdog_type}
                        </div>
                        {it.modifiers?.protein && (
                          <div className="text-xs text-secondary-300 uppercase tracking-widest mt-1">
                            Proteína: {it.modifiers.protein}
                          </div>
                        )}
                        {(it.modifiers?.extraSauce || it.modifiers?.noSauce) && (
                          <div className="text-xs text-secondary-400 mt-1">
                            {it.modifiers?.noSauce ? 'Sin salsas' : null}
                            {it.modifiers?.noSauce && it.modifiers?.extraSauce ? ' · ' : null}
                            {it.modifiers?.extraSauce ? 'Extra salsas' : null}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-secondary-200">
                        {formatCurrency(Number(it.total_price || 0))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selected.status === 'delivered' && (
              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-secondary-300 mb-3">Cobro</div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPayMethod('cash')}
                      className={`px-3 py-2 rounded-md border text-xs uppercase tracking-widest ${
                        payMethod === 'cash' ? 'bg-white/10 border-white/20 text-secondary-50' : 'border-white/10 text-secondary-200 hover:bg-white/10'
                      }`}
                    >
                      Efectivo
                    </button>
                    <button
                      onClick={() => setPayMethod('card')}
                      className={`px-3 py-2 rounded-md border text-xs uppercase tracking-widest ${
                        payMethod === 'card' ? 'bg-white/10 border-white/20 text-secondary-50' : 'border-white/10 text-secondary-200 hover:bg-white/10'
                      }`}
                    >
                      Tarjeta
                    </button>
                  </div>
                  <div className="text-sm text-secondary-200">
                    Total: <span className="font-semibold text-secondary-50">{formatCurrency(Number(selected.total_amount || 0))}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-end">
              {(selected.status === 'draft' || selected.status === 'preparing' || selected.status === 'delivered') && (
                <button
                  onClick={() => setVoidingOrder(selected)}
                  disabled={actionLoading === selected.id}
                  className="px-4 py-2 rounded-md border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest text-xs"
                >
                  Anular
                </button>
              )}

              {selected.status === 'paid' && (
                <button
                  onClick={() => setRefundingOrder(selected)}
                  disabled={actionLoading === selected.id}
                  className="px-4 py-2 rounded-md border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest text-xs"
                >
                  Reembolsar
                </button>
              )}

              {selected.status === 'preparing' && (
                <button
                  onClick={async () => {
                    await updateStatus(selected.id, 'delivered')
                    setSelected(null)
                  }}
                  disabled={actionLoading === selected.id}
                  className="brand-button"
                >
                  Marcar Listo / Por Cobrar
                </button>
              )}

              {selected.status === 'delivered' && (
                <button
                  onClick={async () => {
                    await handlePay(selected.id, payMethod)
                    setSelected(null)
                  }}
                  disabled={actionLoading === selected.id}
                  className="brand-button"
                >
                  Cobrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para anular pedido */}
      {voidingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[color:var(--brand-surface)] rounded-2xl border border-[color:var(--app-border)] p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[color:var(--app-text)] uppercase tracking-widest mb-4">
              Anular Pedido {getOrderLabel(voidingOrder)}
            </h3>
            <p className="text-sm text-[color:var(--app-muted-2)] mb-4">
              Por favor, indica el motivo por el cual estás anulando este pedido. Los ingredientes serán retornados al inventario si corresponde.
            </p>
            
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ej: El cliente canceló, error en el registro..."
              className="w-full bg-[color:var(--app-bg)] border border-[color:var(--app-border)] rounded-xl p-3 text-[color:var(--app-text)] focus:outline-none focus:border-red-500/50 min-h-[100px] resize-none mb-6"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setVoidingOrder(null)
                  setVoidReason('')
                }}
                disabled={actionLoading === voidingOrder.id}
                className="px-4 py-2 rounded-xl text-sm font-bold text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] transition-colors disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || actionLoading === voidingOrder.id}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-danger text-white hover:bg-danger-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === voidingOrder.id ? 'ANULANDO...' : 'CONFIRMAR ANULACIÓN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para reembolsar pedido */}
      {refundingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[color:var(--brand-surface)] rounded-2xl border border-[color:var(--app-border)] p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[color:var(--app-text)] uppercase tracking-widest mb-4">
              Reembolsar Pedido {getOrderLabel(refundingOrder)}
            </h3>
            <p className="text-sm text-[color:var(--app-muted-2)] mb-4">
              Por favor, indica el motivo del reembolso. Esto registrará la devolución del dinero.
            </p>
            
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Ej: Inconformidad del cliente, cobro doble..."
              className="w-full bg-[color:var(--app-bg)] border border-[color:var(--app-border)] rounded-xl p-3 text-[color:var(--app-text)] focus:outline-none focus:border-red-500/50 min-h-[100px] resize-none mb-6"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRefundingOrder(null)
                  setRefundReason('')
                }}
                disabled={actionLoading === refundingOrder.id}
                className="px-4 py-2 rounded-xl text-sm font-bold text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] transition-colors disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim() || actionLoading === refundingOrder.id}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-warning text-white hover:bg-warning-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === refundingOrder.id ? 'REEMBOLSANDO...' : 'CONFIRMAR REEMBOLSO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para solicitar número de WhatsApp si no hay */}
      {whatsappSale && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[color:var(--brand-surface)] rounded-2xl border border-[color:var(--app-border)] p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[color:var(--app-text)] uppercase tracking-widest mb-2 flex items-center gap-2">
              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" /> Enviar Factura
            </h3>
            <p className="text-sm text-[color:var(--app-muted-2)] mb-4">
              Este pedido no tiene un teléfono registrado. Ingresa el número del cliente para enviarle el recibo por WhatsApp.
            </p>
            
            <input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="Ej: 3001234567"
              className="w-full bg-[color:var(--app-bg)] border border-[color:var(--app-border)] rounded-xl p-3 text-[color:var(--app-text)] focus:outline-none focus:border-success/50 mb-6 font-mono text-lg"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setWhatsappSale(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] transition-colors"
              >
                CANCELAR
              </button>
              <button
                onClick={() => sendWhatsApp(whatsappSale, whatsappPhone)}
                disabled={whatsappPhone.length < 10}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                ENVIAR Y DESCARGAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Template */}
      {printingSale && (
        <ReceiptPrintTemplate sale={printingSale} settings={settings} />
      )}
    </>
  )
}
