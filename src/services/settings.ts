import { supabase } from '../lib/supabase'
import { AppSettings } from '../types'

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error)
      return { id: 1, app_name: 'Brutal System', font_primary: 'Inter', font_display: 'Bebas Neue', is_store_open: true, public_message: null, updated_at: new Date().toISOString() }
    }
    
    return data || { id: 1, app_name: 'Brutal System', font_primary: 'Inter', font_display: 'Bebas Neue', is_store_open: true, public_message: null, updated_at: new Date().toISOString() }
  },

  async updateSettings(appName: string, logoUrl?: string | null, fontPrimary?: string, fontDisplay?: string, isStoreOpen?: boolean, publicMessage?: string | null): Promise<AppSettings> {
    const updateData: any = { app_name: appName, updated_at: new Date().toISOString() }
    
    if (logoUrl !== undefined) updateData.logo_url = logoUrl
    if (fontPrimary !== undefined) updateData.font_primary = fontPrimary
    if (fontDisplay !== undefined) updateData.font_display = fontDisplay
    if (isStoreOpen !== undefined) updateData.is_store_open = isStoreOpen
    if (publicMessage !== undefined) updateData.public_message = publicMessage

    const { data, error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
