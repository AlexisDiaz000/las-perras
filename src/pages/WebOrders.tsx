import { useEffect, useState } from 'react'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { consumeInventoryForSale } from '../services/sales'
import { LinkIcon } from '@heroicons/react/24/outline'

// Componente para el ícono de WhatsApp
const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

export default function WebOrders() {
  const { pendingOrders } = useNotificationsStore()
  const { user } = useAuthStore()
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({})
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ya no necesitamos hacer fetchOrders aquí porque el Layout se encarga de mantener el Store actualizado globalmente

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
      const { data: updatedSale, error } = await supabase
        .from('sales')
        .update({ status: 'preparing' })
        .eq('id', orderId)
        .select(`
          *,
          seller:users!sales_seller_id_fkey(*),
          items:sale_items(*)
        `)
        .single()

      if (error) throw error

      // Descontar inventario al aceptar el pedido
      const items = orderItems[orderId]
      if (items && user) {
        await consumeInventoryForSale(orderId, user.id, items)
      }
      
      // Force UI update immediately for better UX
      useNotificationsStore.getState().removeOrder(orderId)
      // Agregarlo a las órdenes activas manualmente para que aparezca en POS inmediatamente
      if (updatedSale) {
        useNotificationsStore.setState(prev => ({
          activeOrders: [updatedSale, ...prev.activeOrders]
        }))
      }
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

  const handleWhatsAppContact = (order: any) => {
    if (!order.customer_phone) {
      alert('El cliente no proporcionó un número de teléfono válido.');
      return;
    }

    // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
    let phone = order.customer_phone.replace(/\D/g, '');
    
    // Si el número no tiene código de país y asumiendo que es Colombia (+57)
    if (phone.length === 10) {
      phone = '57' + phone;
    }

    const message = `¡Hola *${order.customer_name}*! Somos Brutal System. Hemos recibido tu pedido por un total de *$${order.total_amount.toLocaleString('es-CO')}*. Estaremos atentos por este medio para confirmar tu método de pago y empezar a prepararlo.`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
          <span className="text-danger font-bold text-xl">{pendingOrders.length}</span>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-[color:var(--app-text)] uppercase">{order.customer_name}</h3>
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}/status/${order.id}`;
                        navigator.clipboard.writeText(url);
                        alert('Enlace copiado');
                      }}
                      className="text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
                      title="Copiar enlace de seguimiento"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-lg font-mono text-success font-bold">${order.total_amount.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                    order.order_type === 'delivery' ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'
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
              <div className="bg-[color:var(--app-hover)] p-4 rounded-xl border border-[color:var(--app-border)] max-h-48 overflow-y-auto custom-scrollbar">
                <p className="text-xs text-[color:var(--app-muted-2)] uppercase tracking-widest mb-3 border-b border-[color:var(--app-border)] pb-2">Detalle del Pedido</p>
                  
                  {orderItems[order.id] ? (
                    <ul className="space-y-3">
                      {orderItems[order.id].map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex gap-2">
                            <span className="font-bold text-[color:var(--app-muted-2)]">{item.quantity}x</span>
                            <div>
                              <span className="text-[color:var(--app-text)] uppercase">{item.hotdog_type}</span>
                              {item.modifiers?.protein && (
                                <span className="block text-[10px] text-yellow-500 uppercase mt-0.5 font-bold tracking-widest">
                                  + {item.modifiers.protein}
                                </span>
                              )}
                            </div>
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
              <div className="p-4 flex flex-col gap-3 border-t border-[color:var(--app-border)] bg-[color:var(--app-hover-strong)]">
                {order.customer_phone && (
                  <button
                    onClick={() => handleWhatsAppContact(order)}
                    className="w-full py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReject(order.id)}
                    className="py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs border-2 border-danger text-danger hover:bg-danger hover:text-white transition-all"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs bg-success text-white hover:bg-success-hover transition-all"
                  >
                    Aceptar
                  </button>
                </div>
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
                className="px-6 py-2 rounded-xl text-sm font-bold bg-danger text-white hover:bg-danger-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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