import { create } from 'zustand'
import { User } from './types'

interface StoreState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated })
}))