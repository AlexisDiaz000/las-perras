import { supabase } from '../lib/supabase'
import { Sale, SaleItem } from '../types'

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
    let query = supabase
      .from('sale_items')
      .select(`
        hotdog_type,
        sum(total_price) as total,
        sum(quantity) as count
      `)
      .eq('sales.created_at', startDate) // This is wrong, need to join

    // Usar una consulta más compleja con join
    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        hotdog_type,
        total_price,
        quantity,
        sales!inner(created_at)
      `)

    if (error) throw error

    // Agrupar manualmente
    const grouped = data.reduce((acc: any, item: any) => {
      const existing = acc.find((g: any) => g.hotdog_type === item.hotdog_type)
      if (existing) {
        existing.total += item.total_price
        existing.count += item.quantity
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