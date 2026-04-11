import { create } from 'zustand'
import { settingsService } from '../services/settings'
import { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (name: string, logoUrl?: string | null, fontPrimary?: string, fontDisplay?: string, isStoreOpen?: boolean, publicMessage?: string | null) => Promise<void>
}

const updateCSSVariables = (primary: string, display: string) => {
  const root = document.documentElement;
  
  // Mapear el nombre de la fuente a la familia completa con fallbacks
  const primaryFamily = `'${primary}', -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`;
  const displayFamily = `'${display}', 'Impact', 'Arial Narrow Bold', sans-serif`;
  
  root.style.setProperty('--font-primary', primaryFamily);
  root.style.setProperty('--font-display', displayFamily);
}

const injectGoogleFonts = (primary: string, display: string) => {
  const linkId = 'brutal-system-fonts';
  let link = document.getElementById(linkId) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  
  // Reemplazar espacios con + para la URL
  const pFont = primary.replace(/ /g, '+');
  const dFont = display.replace(/ /g, '+');
  
  link.href = `https://fonts.googleapis.com/css2?family=${dFont}&family=${pFont}:wght@400;500;600;700&display=swap`;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: true,
  fetchSettings: async () => {
    try {
      const data = await settingsService.getSettings()
      set({ settings: data, loading: false })
      document.title = data.app_name
      if (data.font_primary && data.font_display) {
        injectGoogleFonts(data.font_primary, data.font_display);
        updateCSSVariables(data.font_primary, data.font_display);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
      set({ loading: false })
    }
  },
  updateSettings: async (name: string, logoUrl?: string | null, fontPrimary?: string, fontDisplay?: string, isStoreOpen?: boolean, publicMessage?: string | null) => {
    try {
      const data = await settingsService.updateSettings(name, logoUrl, fontPrimary, fontDisplay, isStoreOpen, publicMessage)
      set({ settings: data })
      document.title = data.app_name
      if (data.font_primary && data.font_display) {
        injectGoogleFonts(data.font_primary, data.font_display);
        updateCSSVariables(data.font_primary, data.font_display);
      }
    } catch (error) {
      console.error('Error in updateSettings:', error)
      throw error
    }
  }
}))
