import { useEffect, useState } from 'react'
import { salesService } from '../services/sales'
import { Sale } from '../types'
import { useAuthStore } from '../stores/auth'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  preparing: 'En Preparación',
  delivered: 'Entregado',
  paid: 'Pagado',
  voided: 'Anulado',
  refunded: 'Reembolsado'
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-gray-400',
  preparing: 'text-yellow-400',
  delivered: 'text-blue-400',
  paid: 'text-green-400',
  voided: 'text-red-400',
  refunded: 'text-red-400'
}

export function RecentOrders() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const start = `${today}T00:00:00`
      const end = `${today}T23:59:59`
      const data = await salesService.getSales(start, end)
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkDelivered = async (saleId: string) => {
    if (!confirm('¿Marcar como entregado?')) return
    setActionLoading(saleId)
    try {
      await salesService.updateSale(saleId, { status: 'delivered' } as any)
      await loadOrders()
    } catch (error) {
      alert('Error al actualizar pedido')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePay = async (saleId: string) => {
    if (!user) return
    const method = prompt('Método de pago (cash/card):', 'cash')
    if (method !== 'cash' && method !== 'card') return

    setActionLoading(saleId)
    try {
      await salesService.finalizeSaleAndConsumeInventory(saleId, user.id, method as 'cash' | 'card')
      await loadOrders()
    } catch (error: any) {
      alert(error.message || 'Error al procesar pago')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVoid = async (sale: Sale) => {
    if (!user) return
    const reason = prompt('Motivo de anulación:')
    if (!reason) return

    setActionLoading(sale.id)
    try {
      const shouldReverse = sale.status === 'paid'
      await salesService.voidSale(sale.id, reason, user.id, shouldReverse)
      await loadOrders()
    } catch (error: any) {
      alert(error.message || 'Error al anular pedido')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="brand-card p-6 h-[55vh] lg:h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="brand-heading text-xl">Órdenes del Día</h2>
        <button onClick={loadOrders} className="text-sm text-secondary-300 hover:text-secondary-50">
          Actualizar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {loading && !orders.length ? (
          <div className="text-center text-secondary-400 py-4">Cargando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-secondary-400 py-4">No hay órdenes hoy.</div>
        ) : (
          orders.map(sale => (
            <div key={sale.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-secondary-400">
                    #{sale.id.slice(0, 8)} • {new Date(sale.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={`text-sm font-semibold ${STATUS_COLORS[sale.status || 'draft']}`}>
                    {STATUS_LABELS[sale.status || 'draft'] || sale.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-secondary-50">{formatCurrency(sale.total_amount)}</div>
                  {sale.payment_method && (
                    <div className="text-xs text-secondary-400 uppercase">{sale.payment_method}</div>
                  )}
                </div>
              </div>

              {sale.void_reason && (
                <div className="text-xs text-red-300 mb-2 italic">
                  Motivo: {sale.void_reason}
                </div>
              )}

              <div className="flex gap-2 mt-2 justify-end">
                {sale.status === 'preparing' && (
                  <button
                    onClick={() => handleMarkDelivered(sale.id)}
                    disabled={actionLoading === sale.id}
                    className="px-3 py-1 text-xs rounded bg-blue-600/20 text-blue-300 border border-blue-600/50 hover:bg-blue-600/30"
                  >
                    Entregar
                  </button>
                )}

                {sale.status === 'delivered' && (
                  <button
                    onClick={() => handlePay(sale.id)}
                    disabled={actionLoading === sale.id}
                    className="px-3 py-1 text-xs rounded bg-green-600/20 text-green-300 border border-green-600/50 hover:bg-green-600/30"
                  >
                    Cobrar
                  </button>
                )}

                {(sale.status === 'preparing' || sale.status === 'delivered' || sale.status === 'paid') && (
                  <button
                    onClick={() => handleVoid(sale)}
                    disabled={actionLoading === sale.id}
                    className="px-3 py-1 text-xs rounded bg-red-600/20 text-red-300 border border-red-600/50 hover:bg-red-600/30"
                  >
                    Anular
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
