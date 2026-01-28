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
  },

  async registerWaste(itemId: string, quantity: number, reason: string, userId: string) {
    return this.createMovement({
      item_id: itemId,
      type: 'out',
      quantity,
      reason: `Merma: ${reason}`,
      user_id: userId
    })
  },

  async processStocktake(adjustments: { itemId: string; systemStock: number; realStock: number; userId: string }[]) {
    const promises = adjustments.map(async (adj) => {
      const difference = adj.realStock - adj.systemStock
      
      if (difference === 0) return null

      return this.createMovement({
        item_id: adj.itemId,
        type: difference > 0 ? 'in' : 'out',
        quantity: Math.abs(difference),
        reason: difference > 0 
          ? 'Ajuste de Inventario: Sobrante' 
          : 'Ajuste de Inventario: Faltante',
        user_id: adj.userId
      })
    })

    const results = await Promise.all(promises)
    return results.filter(Boolean)
  },

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
