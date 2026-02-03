import { create } from 'zustand'
import { User } from '../types'
import { authService } from '../services/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitializing: boolean
  authError: string | null
  initError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
  clearAuthError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitializing: true,
  authError: null,
  initError: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, authError: null })
    try {
      const { user } = await authService.signIn(email, password)
      set({ user, isLoading: false })
    } catch (error: any) {
      const raw = error?.message || 'Error al iniciar sesión'
      const friendly = /confirm/i.test(raw)
        ? 'Tu correo no está confirmado. Reenvía el correo de confirmación y vuelve a intentar.'
        : raw
      
      set({ 
        authError: friendly, 
        isLoading: false 
      })
    }
  },

  signOut: async () => {
    set({ isLoading: true, user: null, authError: null })
    try {
      await authService.signOut()
      set({ user: null, isLoading: false })
    } catch (error: any) {
      set({ 
        authError: error.message || 'Error al cerrar sesión', 
        isLoading: false 
      })
    }
  },

  checkAuth: async () => {
    const currentState = get()
    // Solo forzar estado de carga inicial si NO hay usuario cargado
    if (!currentState.user) {
      set({ isInitializing: true, initError: null })
    }
    
    try {
      const user = await authService.getCurrentUser()
      set({ user, isInitializing: false })
    } catch (error: any) {
      set({ 
        user: null, 
        initError: error?.message || 'Error al verificar autenticación', 
        isInitializing: false 
      })
    }
  },

  clearAuthError: () => set({ authError: null })
}))
