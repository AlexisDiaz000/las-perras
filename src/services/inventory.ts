import { supabase } from '../lib/supabase'
import { InventoryItem, InventoryMovement } from '../types'

export const inventoryService = {
  async getItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name')

    if (error) throw error
    return data as InventoryItem[]
  },
  async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select('*')
      .single()
    if (error) throw error
    return data as InventoryItem
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('current_stock', { ascending: true })

    if (error) throw error
    return (data as InventoryItem[]).filter(item => item.current_stock <= item.min_threshold)
  },

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as InventoryItem
  },

  async createMovement(movement: Omit<InventoryMovement, 'id' | 'created_at'>): Promise<InventoryMovement> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([movement])
      .select(`
        *,
        item:inventory_items(*)
      `)
      .single()

    if (error) throw error
    return data as InventoryMovement
  },

  async getMovements(itemId?: string): Promise<InventoryMovement[]> {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        item:inventory_items(*)
      `)
      .order('created_at', { ascending: false })

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    const { data, error } = await query

    if (error) throw error
    return data as InventoryMovement[]
  }
  ,
  async getItemByName(name: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('name', name)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data as InventoryItem) || null
  }
}
