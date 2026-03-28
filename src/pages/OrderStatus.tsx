import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../stores/settings'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  FireIcon, 
  TruckIcon, 
  XCircleIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'

type OrderStatus = 'pending_approval' | 'preparing' | 'ready' | 'delivered' | 'rejected'

export default function OrderStatus() {
  const { id } = useParams()
  const { settings } = useSettingsStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadOrder()
      
      // Suscribirse a cambios en esta orden específica
      const subscription = supabase
        .channel(`public:sales:id=${id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'sales', filter: `id=eq.${id}` },
          (payload) => {
            console.log('Order updated:', payload.new)
            setOrder((prev: any) => ({ ...prev, ...payload.new }))
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [id])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          status,
          total_amount,
          customer_name,
          order_type,
          created_at,
          void_reason,
          sale_items (
            quantity,
            hotdog_type,
            total_price
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Pedido no encontrado')
      
      setOrder(data)
    } catch (err: any) {
      console.error('Error loading order:', err)
      setError('No pudimos encontrar tu pedido. Verifica que el enlace sea correcto.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--app-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--app-text)]"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[color:var(--app-bg)] flex flex-col items-center justify-center p-4 text-center">
        <XCircleIcon className="h-16 w-16 text-danger mb-4" />
        <h1 className="brand-heading text-2xl mb-2">Oops!</h1>
        <p className="text-[color:var(--app-muted-1)] mb-6">{error}</p>
        <Link to="/menu" className="brand-button">Volver al Menú</Link>
      </div>
    )
  }

  const isRejected = order.status === 'rejected' || order.status === 'voided'
  const isCompleted = order.status === 'delivered' || order.status === 'paid'

  // Determinar el paso actual
  let currentStep = 0
  if (order.status === 'pending_approval') currentStep = 1
  else if (order.status === 'preparing') currentStep = 2
  else if (order.status === 'ready') currentStep = 3
  else if (isCompleted) currentStep = 4

  const steps = [
    { 
      number: 1, 
      title: 'Recibido', 
      desc: 'Esperando confirmación', 
      icon: <ClockIcon className="h-6 w-6" /> 
    },
    { 
      number: 2, 
      title: 'Preparando', 
      desc: 'En la cocina', 
      icon: <FireIcon className="h-6 w-6" /> 
    },
    { 
      number: 3, 
      title: 'Listo', 
      desc: order.order_type === 'delivery' ? 'Esperando repartidor' : 'Acércate a la barra', 
      icon: <ShoppingBagIcon className="h-6 w-6" /> 
    },
    { 
      number: 4, 
      title: order.order_type === 'delivery' ? 'En camino' : 'Entregado', 
      desc: order.order_type === 'delivery' ? 'Llegando a tu destino' : '¡Que lo disfrutes!', 
      icon: order.order_type === 'delivery' ? <TruckIcon className="h-6 w-6" /> : <CheckCircleIcon className="h-6 w-6" /> 
    }
  ]

  return (
    <div className="min-h-screen bg-[color:var(--app-bg)] flex flex-col">
      {/* Header */}
      <header className="bg-[color:var(--brand-surface)] border-b border-[color:var(--app-border)] sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-8 w-8 object-contain rounded-md" />
            ) : (
              <div className="h-8 w-8 bg-[color:var(--app-text)] rounded-md flex items-center justify-center">
                <span className="text-[color:var(--app-bg)] font-bold text-lg font-display">B</span>
              </div>
            )}
            <h1 className="font-display text-xl tracking-wider text-[color:var(--app-text)] truncate max-w-[200px]">
              {settings?.app_name || 'Brutal System'}
            </h1>
          </div>
          <Link to="/menu" className="text-sm font-bold text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors flex items-center gap-1 uppercase tracking-widest">
            <HomeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Menú</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Encabezado del pedido */}
        <div className="text-center space-y-2 mt-4">
          <h2 className="brand-heading text-3xl">Hola, {order.customer_name}</h2>
          <p className="text-[color:var(--app-muted-1)]">Aquí puedes ver el estado de tu pedido en tiempo real.</p>
        </div>

        {/* Tarjeta Principal de Estado */}
        <div className="brand-card p-6 shadow-xl border-t-4 border-t-success">
          
          {isRejected ? (
            <div className="text-center py-6">
              <XCircleIcon className="h-20 w-20 text-danger mx-auto mb-4" />
              <h3 className="brand-heading text-2xl text-danger mb-2">Pedido Cancelado</h3>
              <p className="text-[color:var(--app-text)]">{order.void_reason || 'Lo sentimos, no pudimos procesar tu pedido en este momento.'}</p>
            </div>
          ) : (
            <>
              {/* Progreso Visual */}
              <div className="relative py-8">
                {/* Línea de fondo */}
                <div className="absolute top-14 left-8 right-8 h-1 bg-[color:var(--app-border)] rounded-full hidden sm:block"></div>
                
                {/* Línea de progreso (verde) */}
                <div 
                  className="absolute top-14 left-8 h-1 bg-success rounded-full transition-all duration-500 hidden sm:block"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-0 relative z-10">
                  {steps.map((step, index) => {
                    const isPast = step.number < currentStep
                    const isCurrent = step.number === currentStep
                    const isFuture = step.number > currentStep

                    return (
                      <div key={step.number} className="flex sm:flex-col items-center sm:w-1/4 text-left sm:text-center relative">
                        {/* Círculo */}
                        <div className={`
                          h-12 w-12 rounded-full flex items-center justify-center mb-0 sm:mb-3 shrink-0 mr-4 sm:mr-0 transition-colors duration-300
                          ${isPast ? 'bg-success text-white' : 
                            isCurrent ? 'bg-success text-white ring-4 ring-success/30' : 
                            'bg-[color:var(--app-hover-strong)] text-[color:var(--app-muted-3)] border-2 border-[color:var(--app-border)]'}
                        `}>
                          {isPast ? <CheckCircleIcon className="h-7 w-7" /> : step.icon}
                        </div>
                        
                        {/* Textos */}
                        <div>
                          <p className={`font-bold uppercase tracking-widest text-sm ${
                            isCurrent ? 'text-success' : 
                            isPast ? 'text-[color:var(--app-text)]' : 
                            'text-[color:var(--app-muted-2)]'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-[color:var(--app-muted-2)] mt-1 hidden sm:block">
                            {step.desc}
                          </p>
                        </div>
                        
                        {/* Línea vertical para móvil */}
                        {index < steps.length - 1 && (
                          <div className={`absolute left-6 top-12 bottom-[-24px] w-0.5 sm:hidden ${
                            isPast ? 'bg-success' : 'bg-[color:var(--app-border)]'
                          }`}></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Resumen del Pedido */}
        <div className="brand-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--app-muted-2)] mb-4 border-b border-[color:var(--app-border)] pb-2">
            Resumen del Pedido
          </h3>
          
          <div className="space-y-4 mb-6">
            {order.sale_items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div className="flex gap-3 items-start">
                  <span className="font-bold text-[color:var(--app-text)] bg-[color:var(--app-hover-strong)] px-2 py-1 rounded">
                    {item.quantity}x
                  </span>
                  <div>
                    <span className="text-[color:var(--app-muted-1)] font-medium block">{item.hotdog_type}</span>
                    {item.modifiers?.protein && (
                      <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest block mt-0.5">
                        + {item.modifiers.protein}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-medium mt-1">${item.total_price.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[color:var(--app-border)] pt-4 flex justify-between items-center">
            <span className="font-bold text-[color:var(--app-text)] uppercase tracking-widest">Total</span>
            <span className="text-xl font-mono font-bold text-success">
              ${order.total_amount.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

      </main>
    </div>
  )
}