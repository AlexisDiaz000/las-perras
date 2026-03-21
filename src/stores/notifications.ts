import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Sale } from '../types'

interface NotificationsState {
  pendingOrders: Sale[]
  isLoading: boolean
  isListening: boolean
  fetchPendingOrders: () => Promise<void>
  startListening: () => void
  stopListening: () => void
  removeOrder: (id: string) => void
}

let subscription: ReturnType<typeof supabase.channel> | null = null

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  pendingOrders: [],
  isLoading: false,
  isListening: false,

  fetchPendingOrders: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ pendingOrders: data as Sale[], isLoading: false })
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      set({ isLoading: false })
    }
  },

  startListening: () => {
    const state = get()
    if (state.isListening) return

    // Primero traer los que ya existan
    state.fetchPendingOrders()

    // Configurar la suscripción en tiempo real
    subscription = supabase
      .channel('public:sales')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE y DELETE
          schema: 'public',
          table: 'sales',
        },
        (payload) => {
          console.log('Realtime event received:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Sale
            if (newOrder.status === 'pending_approval') {
              set((prev) => ({
                pendingOrders: [newOrder, ...prev.pendingOrders]
              }))
            }
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Sale
            set((prev) => {
              // Si cambió a un estado diferente de pending_approval, lo quitamos
              if (updatedOrder.status !== 'pending_approval') {
                return { pendingOrders: prev.pendingOrders.filter(o => o.id !== updatedOrder.id) }
              }
              // Si sigue siendo pending_approval (o pasó a serlo), lo actualizamos o agregamos
              const exists = prev.pendingOrders.some(o => o.id === updatedOrder.id)
              if (exists) {
                return { pendingOrders: prev.pendingOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o) }
              } else {
                return { pendingOrders: [updatedOrder, ...prev.pendingOrders] }
              }
            })
          }
          else if (payload.eventType === 'DELETE') {
            set((prev) => ({
              pendingOrders: prev.pendingOrders.filter(o => o.id !== payload.old.id)
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
      pendingOrders: prev.pendingOrders.filter(order => order.id !== id)
    }))
  }
}))
