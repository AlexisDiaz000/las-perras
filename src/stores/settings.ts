import { create } from 'zustand'
import { settingsService } from '../services/settings'
import { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  fetchSettings: () => Promise<void>
  updateAppName: (name: string) => Promise<void>
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
  updateAppName: async (name: string) => {
    try {
      const data = await settingsService.updateAppName(name)
      set({ settings: data })
      document.title = data.app_name
    } catch (error) {
      console.error('Error in updateAppName:', error)
      throw error
    }
  }
}))
