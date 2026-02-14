import { supabase } from '../lib/supabase'
import { InventoryMovement, Sale, SaleItem } from '../types'
import { HOTDOG_TYPES, INGREDIENT_CONSUMPTION } from '../constants'
import { inventoryService } from './inventory'
import { getColombiaDate } from '../lib/dateUtils'

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
    // 1. Obtener los ingredientes del producto desde la base de datos (Receta Dinámica)
    // Se asume que item.product_id existe. Si usamos el sistema antiguo (hardcoded), esto fallará, 
    // pero la idea es migrar al nuevo sistema.
    // Para compatibilidad híbrida, podríamos chequear si tiene UUID o nombre.
    
    // Si el item viene del POS nuevo, tendrá un product_id o un nombre que coincida con la tabla products
    // Buscamos el producto y sus ingredientes
    const { data: productData, error } = await supabase
      .from('products')
      .select(`
        id,
        ingredients:product_ingredients(
          inventory_item_id,
          quantity,
          is_optional,
          inventory_item:inventory_items(name)
        )
      `)
      .eq('name', item.hotdog_type) // Usamos el nombre como enlace por ahora
      .single()

    if (error || !productData) {
      // Intento de fallback: buscar por coincidencia parcial si el nombre no es exacto
      // Esto ayuda si "Coca-Cola 400ml" en POS es "Coca-Cola Personal 400ml" en BD
      console.warn(`[Inventory] Producto exacto "${item.hotdog_type}" no encontrado. Intentando búsqueda flexible...`)
      
      const { data: flexibleData } = await supabase
        .from('products')
        .select(`
          id,
          ingredients:product_ingredients(
            inventory_item_id,
            quantity,
            is_optional,
            inventory_item:inventory_items(name)
          )
        `)
        .ilike('name', `%${item.hotdog_type}%`)
        .limit(1)
        .single()

      if (flexibleData) {
        console.log(`[Inventory] Encontrado producto flexible: "${item.hotdog_type}" -> ID: ${flexibleData.id}`)
        const recipeIngredients = flexibleData.ingredients
        // Reutilizar lógica de descuento
        await processIngredientsDeduction(recipeIngredients, item, saleId, sellerId, movementGroup)
        continue
      }

      console.error(`[Inventory] FALLO CRÍTICO: Producto "${item.hotdog_type}" no tiene receta. No se descontará inventario.`)
      continue
    }

    const recipeIngredients = productData.ingredients
    await processIngredientsDeduction(recipeIngredients, item, saleId, sellerId, movementGroup)

    // 4. Procesar Proteína Dinámica (Si el usuario eligió una)
    if (item.modifiers?.protein) {
      await processProteinDeduction(item.modifiers.protein, item.quantity, saleId, sellerId, movementGroup)
    }
  }
}

async function processProteinDeduction(
  proteinName: string,
  quantityMultiplier: number,
  saleId: string,
  sellerId: string,
  movementGroup: string
) {
  // Mapeo de nombres del POS a nombres del Inventario
  // POS: 'Desmechada de Res' | 'Carne de Pollo' | 'Carne de Cerdo'
  // Inventario: 'Carne Desmechada', 'Pollo Desmechado', 'Cerdo Desmechado' (aproximado)
  
  let searchTerm = ''
  if (proteinName.includes('Res') || proteinName.includes('Carne')) searchTerm = 'Carne Desmechada' // O 'Carne'
  if (proteinName.includes('Pollo')) searchTerm = 'Pollo Desmechado'
  if (proteinName.includes('Cerdo')) searchTerm = 'Cerdo Desmechado'

  if (!searchTerm) return

  // Buscar el item de inventario
  const { data: inventoryItem } = await supabase
    .from('inventory_items')
    .select('id, name')
    .ilike('name', `%${searchTerm}%`)
    .limit(1)
    .single()

  if (inventoryItem) {
    try {
      // Cantidad estándar por porción de proteína: 30g (ajustable)
      const PORTION_SIZE = 30 
      const totalQuantity = PORTION_SIZE * quantityMultiplier

      await inventoryService.createMovement({
        item_id: inventoryItem.id,
        type: 'out',
        quantity: totalQuantity,
        reason: `Venta (Proteína): ${proteinName}`,
        user_id: sellerId,
        sale_id: saleId,
        movement_group: movementGroup
      })
      console.log(`[Inventory] Descontado ${totalQuantity}g de ${inventoryItem.name}`)
    } catch (err) {
      console.error(`[Inventory] Error descontando proteína dinámica ${inventoryItem.name}:`, err)
    }
  } else {
    console.warn(`[Inventory] No se encontró item de inventario para la proteína: ${proteinName} (Buscado: ${searchTerm})`)
  }
}

async function processIngredientsDeduction(
  recipeIngredients: any[], 
  item: POSItemInput, 
  saleId: string, 
  sellerId: string, 
  movementGroup: string
) {
    // 2. Procesar Modificadores (Sin Salsa, Extra Salsa)
    // Identificamos qué ingredientes son "Salsas" (esto podría ser una categoría en el futuro, por ahora usamos nombres conocidos)
    const SAUCES_KEYWORDS = ['Salsa', 'Mayonesa', 'Mostaza', 'BBQ', 'Aderezo']

    for (const ingredient of recipeIngredients) {
      let finalQuantity = Number(ingredient.quantity)
      const ingredientName = ingredient.inventory_item?.name || ''

      // Lógica de Modificadores
      const isSauce = SAUCES_KEYWORDS.some(k => ingredientName.includes(k))
      
      if (isSauce) {
        if (item.modifiers?.noSauce) {
          finalQuantity = 0
        } else if (item.modifiers?.extraSauce) {
          finalQuantity *= 2 // Doble porción
        }
      }

      // Si la cantidad es 0, no descontamos
      if (finalQuantity <= 0) continue

      // Multiplicar por la cantidad de productos vendidos (ej. 2 Perros = 2x ingredientes)
      const totalDeduction = finalQuantity * item.quantity

      // 3. Crear el movimiento
      try {
        await inventoryService.createMovement({
          item_id: ingredient.inventory_item_id,
          type: 'out',
          quantity: totalDeduction,
          reason: `Venta: ${item.hotdog_type}`,
          user_id: sellerId,
          sale_id: saleId,
          movement_group: movementGroup
        })
      } catch (err) {
        console.error(`[Inventory] Error descontando ${ingredientName}:`, err)
      }
    }
}

export const salesService = {
  async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select(`
        *,
        seller:users!sales_seller_id_fkey(*)
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
        seller:users!sales_seller_id_fkey(*),
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
        seller:users!sales_seller_id_fkey(*)
      `)
      .single())

    if (saleError && /column .*description.* does not exist/i.test(saleError.message || '')) {
      delete payload.description
      ;({ data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([payload])
        .select(`
          *,
          seller:users!sales_seller_id_fkey(*)
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

  async finalizeSale(saleId: string, sellerId: string, paymentMethod: 'cash' | 'card'): Promise<void> {
    // Si ya es paid, no hacer nada
    // No validamos inventario aquí porque el consumo se hace al crear la venta o al enviar a preparación
    // Simplemente marcamos como pagado

    const items = await this.getSaleItems(saleId)
    const totalAmount = items.reduce((sum, it) => sum + Number(it.total_price), 0)

    await this.updateSale(saleId, {
      status: 'paid',
      payment_method: paymentMethod,
      total_amount: totalAmount,
    } as any)
  },

  async getSalesByHotdogType(startDate?: string, endDate?: string): Promise<{ hotdog_type: string; total: number; count: number }[]> {
    if (!startDate || !endDate) {
      const today = getColombiaDate()
      startDate = startDate || today
      endDate = endDate || today
    }

    const { data, error } = await supabase
      .rpc('get_sales_by_hotdog_type', { start_date: startDate, end_date: endDate })

    if (error) throw error
    return data as any
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
