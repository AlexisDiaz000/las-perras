import { useEffect, useState } from 'react'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { consumeInventoryForSale } from '../services/sales'

export default function WebOrders() {
  const { pendingOrders, fetchPendingOrders } = useNotificationsStore()
  const { user } = useAuthStore()
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({})
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPendingOrders()
  }, [fetchPendingOrders])

  // Fetch items for pending orders
  useEffect(() => {
    const fetchItems = async () => {
      if (pendingOrders.length === 0) return

      const orderIds = pendingOrders.map(o => o.id)
      
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', orderIds)

      if (error) {
        console.error('Error fetching order items:', error)
        return
      }

      // Group items by sale_id
      const itemsByOrder = data.reduce((acc, item) => {
        if (!acc[item.sale_id]) acc[item.sale_id] = []
        acc[item.sale_id].push(item)
        return acc
      }, {} as Record<string, any[]>)

      setOrderItems(itemsByOrder)
    }

    fetchItems()
  }, [pendingOrders])

  const handleApprove = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'preparing' })
        .eq('id', orderId)

      if (error) throw error

      // Descontar inventario al aceptar el pedido
      const items = orderItems[orderId]
      if (items && user) {
        await consumeInventoryForSale(orderId, user.id, items)
      }
      
      // Force UI update immediately for better UX
      useNotificationsStore.getState().removeOrder(orderId)
    } catch (error) {
      console.error('Error approving order:', error)
      alert('Error al aceptar el pedido.')
    }
  }

  const handleReject = (orderId: string) => {
    setRejectingOrderId(orderId)
    setRejectReason('')
  }

  const confirmReject = async () => {
    if (!rejectingOrderId || !rejectReason.trim()) {
      alert('Por favor ingresa un motivo para rechazar el pedido.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('sales')
        .update({ 
          status: 'rejected',
          void_reason: rejectReason.trim()
        })
        .eq('id', rejectingOrderId)

      if (error) throw error
      
      // Force UI update immediately for better UX
      useNotificationsStore.getState().removeOrder(rejectingOrderId)
      setRejectingOrderId(null)
      setRejectReason('')
    } catch (error) {
      console.error('Error rejecting order:', error)
      alert('Error al rechazar el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[color:var(--app-text)] brand-heading uppercase">Pedidos Web Entrantes</h1>
          <p className="mt-2 text-sm text-[color:var(--app-muted-2)]">
            Gestiona los pedidos que los clientes realizan desde el menú público.
          </p>
        </div>
        <div className="bg-[color:var(--app-hover-strong)] px-4 py-2 rounded-xl border border-[color:var(--app-border)]">
          <span className="text-[color:var(--app-muted-2)] text-sm font-bold mr-2 uppercase tracking-widest">Pendientes:</span>
          <span className="text-red-500 font-bold text-xl">{pendingOrders.length}</span>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-20 bg-[color:var(--brand-surface)] rounded-2xl border border-[color:var(--app-border)]">
          <p className="text-[color:var(--app-muted-2)] text-lg">No hay pedidos web pendientes en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingOrders.map((order) => (
            <div key={order.id} className="bg-[color:var(--brand-surface)] rounded-2xl border border-[color:var(--app-border)] overflow-hidden shadow-xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-[color:var(--app-border)] bg-[color:var(--app-hover-strong)]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-[color:var(--app-text)] uppercase">{order.customer_name}</h3>
                  <span className="text-lg font-mono text-green-400 font-bold">${order.total_amount.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                    order.order_type === 'delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {order.order_type === 'delivery' ? 'DOMICILIO' : 'LOCAL'}
                  </span>
                  <span className="text-xs text-[color:var(--app-muted-2)]">
                    {new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Body: Contact & Delivery Info */}
              <div className="p-5 flex-1 space-y-4">
                {order.order_type === 'delivery' && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[color:var(--app-muted-2)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span className="text-sm text-[color:var(--app-text)]">{order.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[color:var(--app-muted-2)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.08-7.074-6.97l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      <span className="text-sm text-[color:var(--app-text)]">{order.customer_phone}</span>
                    </div>
                  </div>
                )}
                {order.order_type === 'local' && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[color:var(--app-muted-2)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className="text-sm text-[color:var(--app-text)]">{order.delivery_notes || 'Sin mesa especificada'}</span>
                  </div>
                )}

                {/* Order Items List */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-[color:var(--app-muted-2)] uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Detalle del Pedido</p>
                  
                  {orderItems[order.id] ? (
                    <ul className="space-y-3">
                      {orderItems[order.id].map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex gap-2">
                            <span className="font-bold text-[color:var(--app-muted-2)]">{item.quantity}x</span>
                            <span className="text-[color:var(--app-text)] uppercase">{item.hotdog_type}</span>
                          </div>
                          <span className="text-[color:var(--app-muted-2)] font-mono shrink-0 ml-2">
                            ${item.total_price.toLocaleString('es-CO')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[color:var(--app-text)]"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 grid grid-cols-2 gap-3 border-t border-[color:var(--app-border)] bg-[color:var(--app-hover)]">
                <button
                  onClick={() => handleReject(order.id)}
                  className="py-3 rounded-xl font-bold uppercase tracking-widest text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleApprove(order.id)}
                  className="py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Rejection Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[color:var(--brand-surface)] rounded-2xl border border-[color:var(--app-border)] p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[color:var(--app-text)] uppercase tracking-widest mb-4">
              Rechazar Pedido
            </h3>
            <p className="text-sm text-[color:var(--app-muted-2)] mb-4">
              Por favor, indica el motivo por el cual estás rechazando este pedido. Este registro es obligatorio por seguridad.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: No hay stock suficiente, fuera de zona de cobertura..."
              className="w-full bg-[color:var(--app-bg)] border border-[color:var(--app-border)] rounded-xl p-3 text-[color:var(--app-text)] focus:outline-none focus:border-red-500/50 min-h-[100px] resize-none mb-6"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectingOrderId(null)
                  setRejectReason('')
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-bold text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] transition-colors disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || isSubmitting}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'RECHAZANDO...' : 'CONFIRMAR RECHAZO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}