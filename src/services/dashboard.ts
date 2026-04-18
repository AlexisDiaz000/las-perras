import { supabase } from '../lib/supabase'
import { DashboardMetrics } from '../types'

export const dashboardService = {
  async getMetrics(startDate: string, endDate: string): Promise<DashboardMetrics> {
    // Obtener ventas totales (pagadas o entregadas)
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, status')
      .in('status', ['paid', 'delivered']) // Incluir delivered por si no han cobrado aún
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (salesError) throw salesError

    const totalSales = salesData.reduce((sum, sale) => sum + sale.total_amount, 0)

    // Obtener gastos totales
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, category')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    if (expensesError) throw expensesError

    const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0)

    // 1. Obtener Costo de Mercancía Vendida (CMV) y Costo de Mermas
    // Sumar el costo de todos los movimientos de inventario tipo 'out' asociados a ventas y mermas en este rango
    const { data: inventoryMovements, error: inventoryError } = await supabase
      .from('inventory_movements')
      .select(`
        quantity,
        reason,
        item:inventory_items (name, unit_cost, unit)
      `)
      .eq('type', 'out')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (inventoryError) throw inventoryError

    let cogs = 0
    let wasteCost = 0
    const cogsMap: Record<string, any> = {}
    const wasteMap: Record<string, any> = {}

    ;(inventoryMovements || []).forEach((mov: any) => {
      const cost = mov.item?.unit_cost || 0
      const totalCost = cost * mov.quantity
      const itemName = mov.item?.name || 'Desconocido'
      const itemUnit = mov.item?.unit || 'u'
      
      // Clasificar si es merma o venta
      if (mov.reason && mov.reason.toLowerCase().includes('merma')) {
        wasteCost += totalCost
        if (!wasteMap[itemName]) wasteMap[itemName] = { name: itemName, quantity: 0, unit: itemUnit, totalCost: 0 }
        wasteMap[itemName].quantity += mov.quantity
        wasteMap[itemName].totalCost += totalCost
      } else {
        // Todo lo demás (Venta: ..., Ajuste de Inventario: ...) se considera CMV operativo
        cogs += totalCost
        if (!cogsMap[itemName]) cogsMap[itemName] = { name: itemName, quantity: 0, unit: itemUnit, totalCost: 0 }
        cogsMap[itemName].quantity += mov.quantity
        cogsMap[itemName].totalCost += totalCost
      }
    })

    const cogsDetails = Object.values(cogsMap).sort((a: any, b: any) => b.totalCost - a.totalCost)
    const wasteDetails = Object.values(wasteMap).sort((a: any, b: any) => b.totalCost - a.totalCost)

    // Calcular ganancia neta REAL:
    // Ganancia Neta = Ventas Totales - (Costo Mercancía Vendida + Costo de Mermas + Gastos Operativos Totales)
    const netProfit = totalSales - (cogs + wasteCost + totalExpenses)

    return {
      total_sales: totalSales,
      total_expenses: totalExpenses,
      cogs: cogs, // Devolver el costo de mercancía vendida
      waste_cost: wasteCost, // Devolver el costo de las mermas separadas
      net_profit: netProfit, // Permitir valores negativos para reflejar pérdidas reales
      cogs_details: cogsDetails,
      waste_details: wasteDetails,
      sales_by_hotdog_type: [], // Se llenará con getSalesDataForChart
      expenses_by_category: [] // Se llenará con getExpensesDataForChart
    }
  },

  async getSalesDataForChart(startDate: string, endDate: string): Promise<{ hotdog_type: string; total: number; count: number }[]> {
    // Calculamos manualmente filtrando por estados válidos (paid, delivered) para coincidir con las ventas totales
    const { data: manualData, error: manualError } = await supabase
      .from('sale_items')
      .select(`
        hotdog_type,
        total_price,
        quantity,
        sales!inner(id, created_at, status)
      `)
      .in('sales.status', ['paid', 'delivered'])
      .gte('sales.created_at', startDate)
      .lte('sales.created_at', endDate)

    if (manualError) throw manualError

    const grouped = (manualData || []).reduce((acc: any, item: any) => {
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

    return grouped.sort((a: any, b: any) => b.total - a.total)
  },

  async getExpensesDataForChart(startDate: string, endDate: string): Promise<{ category: string; total: number }[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    if (error) throw error

    const grouped = data.reduce((acc: any, item: any) => {
      const existing = acc.find((g: any) => g.category === item.category)
      if (existing) {
        existing.total += item.amount
      } else {
        acc.push({
          category: item.category,
          total: item.amount
        })
      }
      return acc
    }, [])

    return grouped
  },

  async getLowStockItems() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('current_stock', { ascending: true })

    if (error) throw error
    return (data || []).filter((item: any) => item.current_stock <= item.min_threshold)
  }
}
