import { create } from 'zustand'
import { User } from '../types'
import { authService } from '../services/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { user } = await authService.signIn(email, password)
      set({ user, isLoading: false })
    } catch (error: any) {
      const raw = error?.message || 'Error al iniciar sesión'
      const friendly = /confirm/i.test(raw)
        ? 'Tu correo no está confirmado. Reenvía el correo de confirmación y vuelve a intentar.'
        : raw
      set({ 
        error: friendly, 
        isLoading: false 
      })
    }
  },

  signOut: async () => {
    set({ isLoading: true, user: null, error: null })
    try {
      await authService.signOut()
      set({ user: null, isLoading: false })
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cerrar sesión', 
        isLoading: false 
      })
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const user = await authService.getCurrentUser()
      set({ user, isLoading: false })
    } catch (error: any) {
      set({ 
        user: null, 
        error: error.message || 'Error al verificar autenticación', 
        isLoading: false 
      })
    }
  },

  clearError: () => set({ error: null })
}))
