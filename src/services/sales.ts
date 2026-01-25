import { supabase } from '../lib/supabase'
import { InventoryMovement, Sale, SaleItem } from '../types'
import { HOTDOG_TYPES, INGREDIENT_CONSUMPTION } from '../constants'
import { inventoryService } from './inventory'

type ProteinChoice = 'Desmechada de Res' | 'Carne de Pollo' | 'Carne de Cerdo'

type POSItemInput = Omit<SaleItem, 'id' | 'sale_id'> & {
  modifiers?: {
    protein?: ProteinChoice
    extraSauce?: boolean
    noSauce?: boolean
  }
}

const SAUCES = ['Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza'] as const

async function consumeInventoryForSale(saleId: string, sellerId: string, items: POSItemInput[]) {
  const movementGroup = crypto.randomUUID()

  for (const item of items) {
    const config = HOTDOG_TYPES[item.hotdog_type]
    const baseIngredients = [...config.ingredients]

    if ((config as any).requiresProteinChoice) {
      const protein = item.modifiers?.protein
      if (!protein) {
        throw new Error(`Falta seleccionar proteína para ${item.hotdog_type}`)
      }
      baseIngredients.push(protein)
    }

    const noSauce = Boolean(item.modifiers?.noSauce)
    const extraSauce = Boolean(item.modifiers?.extraSauce)

    for (const ingredient of baseIngredients) {
      const consumption = INGREDIENT_CONSUMPTION[ingredient as keyof typeof INGREDIENT_CONSUMPTION]
      if (!consumption) continue

      let ingredientMultiplier = 1

      const multipliers = (config as any).multipliers as Record<string, number> | undefined
      if (multipliers && multipliers[ingredient]) ingredientMultiplier = multipliers[ingredient]

      if (SAUCES.includes(ingredient as any)) {
        if (noSauce) ingredientMultiplier = 0
        else ingredientMultiplier = extraSauce ? 2 : 1
      }

      const totalQty = consumption.quantity * item.quantity * ingredientMultiplier
      if (totalQty === 0) continue
      const invItem = await inventoryService.getItemByName(ingredient)
      if (!invItem) continue
      await inventoryService.createMovement({
        item_id: invItem.id,
        type: 'out',
        quantity: totalQty,
        reason: `Venta ${item.hotdog_type}`,
        user_id: sellerId,
        sale_id: saleId,
        movement_group: movementGroup
      })
    }
  }
}

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

  async getSalesWithItems(startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select(`
        *,
        seller:users(*),
        items:sale_items(*)
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
    const payload: any = { ...sale }
    if (payload.description == null || String(payload.description).trim() === '') {
      delete payload.description
    }

    let saleData: any
    let saleError: any

    ;({ data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([payload])
      .select(`
        *,
        seller:users(*)
      `)
      .single())

    if (saleError && /column .*description.* does not exist/i.test(saleError.message || '')) {
      delete payload.description
      ;({ data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([payload])
        .select(`
          *,
          seller:users(*)
        `)
        .single())
    }

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

  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    const { data, error } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)

    if (error) throw error
    return data as SaleItem[]
  },

  async getMovementsBySaleId(saleId: string): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as InventoryMovement[]
  },

  async voidSale(saleId: string, reason: string, userId: string, reverseInventory: boolean): Promise<void> {
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        status: 'voided',
        void_reason: reason,
        voided_at: new Date().toISOString(),
        voided_by: userId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', saleId)

    if (updateError) throw updateError

    if (!reverseInventory) return

    const movements = await this.getMovementsBySaleId(saleId)
    const originals = movements.filter(m => !m.reversal_of)
    if (!originals.length) return

    const group = crypto.randomUUID()
    const reversals = originals.map(m => ({
      item_id: m.item_id,
      type: m.type === 'out' ? 'in' : 'out',
      quantity: m.quantity,
      reason: `Reverso venta ${saleId}: ${reason}`,
      user_id: userId,
      sale_id: saleId,
      reversal_of: m.id,
      movement_group: group,
    }))

    const { error: insertError } = await supabase
      .from('inventory_movements')
      .insert(reversals as any)

    if (insertError) throw insertError
  },

  async refundSale(saleId: string, reason: string, userId: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        status: 'refunded',
        void_reason: reason,
        voided_at: new Date().toISOString(),
        voided_by: userId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', saleId)

    if (updateError) throw updateError

    const movements = await this.getMovementsBySaleId(saleId)
    const originals = movements.filter(m => !m.reversal_of)
    if (!originals.length) return

    const group = crypto.randomUUID()
    const reversals = originals.map(m => ({
      item_id: m.item_id,
      type: m.type === 'out' ? 'in' : 'out',
      quantity: m.quantity,
      reason: `Reverso venta ${saleId}: ${reason}`,
      user_id: userId,
      sale_id: saleId,
      reversal_of: m.id,
      movement_group: group,
    }))

    const { error: insertError } = await supabase
      .from('inventory_movements')
      .insert(reversals as any)

    if (insertError) throw insertError
  },

  async updateSale(saleId: string, updates: Partial<Sale>): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', saleId)
    if (error) throw error
  },

  async finalizeSaleAndConsumeInventory(saleId: string, sellerId: string, paymentMethod: 'cash' | 'card'): Promise<void> {
    const movements = await this.getMovementsBySaleId(saleId)
    const alreadyConsumed = movements.some(m => !m.reversal_of)
    if (alreadyConsumed) {
      throw new Error('Este pedido ya descontó inventario')
    }

    const items = await this.getSaleItems(saleId)
    const totalAmount = items.reduce((sum, it) => sum + Number(it.total_price), 0)

    await this.updateSale(saleId, {
      status: 'paid',
      payment_method: paymentMethod,
      total_amount: totalAmount,
    } as any)

    await consumeInventoryForSale(saleId, sellerId, items as any)
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
  items: POSItemInput[]
): Promise<Sale> {
  const saleData = await salesService.createSale(sale, items)
  await consumeInventoryForSale(saleData.id, sale.seller_id, items)

  return saleData
}
