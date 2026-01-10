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

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('v_inventory_low_stock')
      .select('*')
      .order('current_stock', { ascending: true })

    if (error) throw error
    return data as InventoryItem[]
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

  async createItem(newItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([newItem])
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

    // Actualizar el stock del item
    const multiplier = movement.type === 'in' ? 1 : -1
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_stock: supabase.sql`current_stock + (${movement.quantity} * ${multiplier})`
      })
      .eq('id', movement.item_id)

    if (updateError) throw updateError

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
}
