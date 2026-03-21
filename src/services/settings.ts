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
      return { id: 1, app_name: 'Brutal System', updated_at: new Date().toISOString() }
    }
    
    return data || { id: 1, app_name: 'Brutal System', updated_at: new Date().toISOString() }
  },

  async updateSettings(appName: string, logoUrl?: string | null): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('settings')
      .update({ app_name: appName, logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
