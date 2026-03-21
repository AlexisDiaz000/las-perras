import { create } from 'zustand'
import { settingsService } from '../services/settings'
import { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (name: string, logoUrl?: string | null) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: true,
  fetchSettings: async () => {
    try {
      const data = await settingsService.getSettings()
      set({ settings: data, loading: false })
      document.title = data.app_name
    } catch (error) {
      console.error('Error in fetchSettings:', error)
      set({ loading: false })
    }
  },
  updateSettings: async (name: string, logoUrl?: string | null) => {
    try {
      const data = await settingsService.updateSettings(name, logoUrl)
      set({ settings: data })
      document.title = data.app_name
    } catch (error) {
      console.error('Error in updateSettings:', error)
      throw error
    }
  }
}))
