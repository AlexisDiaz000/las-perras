import { supabase } from '../lib/supabase'
import { Sale, SaleItem } from '../types'
import { HOTDOG_TYPES, INGREDIENT_CONSUMPTION } from '../constants'
import { inventoryService } from './inventory'

export const salesService = {
  async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select(`
        *,
        seller:users(*)
      `)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Sale[]
  },

  async createSale(sale: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id'>[]): Promise<Sale> {
    // Crear la venta principal
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([sale])
      .select(`
        *,
        seller:users(*)
      `)
      .single()

    if (saleError) throw saleError

    // Crear los items de la venta
    const saleItems = items.map(item => ({
      ...item,
      sale_id: saleData.id
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) throw itemsError

    return saleData as Sale
  },

  async getSalesByHotdogType(startDate?: string, endDate?: string): Promise<{ hotdog_type: string; total: number; count: number }[]> {
    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        hotdog_type,
        total_price,
        quantity,
        sales!inner(created_at)
      `)

    if (error) throw error

    const filtered = data.filter((item: any) => {
      const d = new Date(item.sales.created_at).toISOString().split('T')[0]
      if (startDate && d < startDate) return false
      if (endDate && d > endDate) return false
      return true
    })

    const grouped = filtered.reduce((acc: any[], item: any) => {
      const found = acc.find((g: any) => g.hotdog_type === item.hotdog_type)
      if (found) {
        found.total += item.total_price
        found.count += item.quantity
      } else {
        acc.push({
          hotdog_type: item.hotdog_type,
          total: item.total_price,
          count: item.quantity
        })
      }
      return acc
    }, [])

    return grouped
  }
}

export async function createSaleAndConsumeInventory(
  sale: Omit<Sale, 'id' | 'created_at'>,
  items: Omit<SaleItem, 'id' | 'sale_id'>[]
): Promise<Sale> {
  const saleData = await salesService.createSale(sale, items)

  for (const item of items) {
    const config = HOTDOG_TYPES[item.hotdog_type]
    for (const ingredient of config.ingredients) {
      const consumption = INGREDIENT_CONSUMPTION[ingredient]
      const totalQty = consumption.quantity * item.quantity
      const invItem = await inventoryService.getItemByName(ingredient)
      if (!invItem) continue
      await inventoryService.createMovement({
        item_id: invItem.id,
        type: 'out',
        quantity: totalQty,
        reason: `Venta ${item.hotdog_type}`,
        user_id: sale.seller_id
      })
    }
  }

  return saleData
}
