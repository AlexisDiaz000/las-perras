import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Sale } from '../types'
import { getColombiaDate } from '../lib/dateUtils'

interface NotificationsState {
  pendingOrders: Sale[]
  activeOrders: Sale[] // Pedidos en preparación, listos, entregados, pagados (del día actual)
  isLoading: boolean
  isListening: boolean
  fetchOrders: () => Promise<void>
  startListening: () => void
  stopListening: () => void
  removeOrder: (id: string) => void
}

let subscription: ReturnType<typeof supabase.channel> | null = null

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  pendingOrders: [],
  activeOrders: [],
  isLoading: false,
  isListening: false,

  fetchOrders: async () => {
    set({ isLoading: true })
    try {
      // Traer todos los pedidos relevantes del día (incluyendo pending)
      const today = getColombiaDate()
      const start = `${today}T00:00:00-05:00`
      const end = `${today}T23:59:59-05:00`

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          seller:users!sales_seller_id_fkey(*),
          items:sale_items(*)
        `)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })

      if (error) throw error

      const sales = data as Sale[]
      const pending = sales.filter(s => s.status === 'pending_approval')
      const active = sales.filter(s => s.status !== 'pending_approval') // Aquí irán preparing, delivered, paid, voided, etc

      set({ 
        pendingOrders: pending, 
        activeOrders: active,
        isLoading: false 
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      set({ isLoading: false })
    }
  },

  startListening: () => {
    const state = get()
    if (state.isListening) return

    // Configurar la suscripción en tiempo real a TODOS los cambios en sales
    subscription = supabase
      .channel('public:sales')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE y DELETE
          schema: 'public',
          table: 'sales',
        },
        async (payload) => {
          console.log('Realtime event received:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const rawOrder = payload.new as Sale
            
            // Cuando llega un evento de realtime, no trae los `items`. 
            // Vamos a buscar la venta completa con items para que la UI no se rompa.
            const { data: fullOrderData } = await supabase
              .from('sales')
              .select(`
                *,
                seller:users!sales_seller_id_fkey(*),
                items:sale_items(*)
              `)
              .eq('id', rawOrder.id)
              .single()

            if (!fullOrderData) return

            const order = fullOrderData as Sale

            set((prev) => {
              // Separar listas
              let newPending = [...prev.pendingOrders]
              let newActive = [...prev.activeOrders]

              // Quitarlo de ambas listas primero (para evitar duplicados al actualizar)
              newPending = newPending.filter(o => o.id !== order.id)
              newActive = newActive.filter(o => o.id !== order.id)

              // Volver a insertarlo en la lista correcta
              if (order.status === 'pending_approval') {
                newPending = [order, ...newPending]
              } else {
                newActive = [order, ...newActive]
              }

              // Ordenar por fecha descendente
              newPending.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              newActive.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

              return {
                pendingOrders: newPending,
                activeOrders: newActive
              }
            })
          } 
          else if (payload.eventType === 'DELETE') {
            set((prev) => ({
              pendingOrders: prev.pendingOrders.filter(o => o.id !== payload.old.id),
              activeOrders: prev.activeOrders.filter(o => o.id !== payload.old.id)
            }))
          }
        }
      )
      .subscribe()

    set({ isListening: true })
  },

  stopListening: () => {
    if (subscription) {
      supabase.removeChannel(subscription)
      subscription = null
    }
    set({ isListening: false })
  },

  removeOrder: (id: string) => {
    set((prev) => ({
      pendingOrders: prev.pendingOrders.filter(order => order.id !== id),
      activeOrders: prev.activeOrders.filter(order => order.id !== id)
    }))
  }
}))
