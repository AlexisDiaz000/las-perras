import { supabase } from '../lib/supabase'
import { DashboardMetrics } from '../types'
import { PARTNER1_PERCENTAGE, PARTNER2_PERCENTAGE, DAILY_FIXED_EXPENSES } from '../constants'

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

    // 1. Obtener Costo de Mercancía Vendida (CMV)
    // Sumar el costo de todos los movimientos de inventario tipo 'out' asociados a ventas en este rango
    const { data: inventoryMovements, error: inventoryError } = await supabase
      .from('inventory_movements')
      .select(`
        quantity,
        item:inventory_items (unit_cost)
      `)
      .eq('type', 'out')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (inventoryError) throw inventoryError

    const cogs = (inventoryMovements || []).reduce((sum, mov: any) => {
      const cost = mov.item?.unit_cost || 0
      return sum + (cost * mov.quantity)
    }, 0)

    // Calcular ganancia neta REAL:
    // Ganancia Neta = Ventas Totales - (Costo Mercancía Vendida + Gastos Operativos Totales)
    // Nota: totalExpenses ya incluye todos los gastos registrados (servicios, nómina, etc.)
    const netProfit = totalSales - (cogs + totalExpenses)

    // Calcular distribución entre socios
    const partner1Share = netProfit * PARTNER1_PERCENTAGE
    const partner2Share = netProfit * PARTNER2_PERCENTAGE

    // Obtener gastos por categoría
    const { data: expensesByCategoryData, error: expensesByCategoryError } = await supabase
      .from('expenses')
      .select(`
        category,
        sum(amount) as total
      `)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    return {
      total_sales: totalSales,
      total_expenses: totalExpenses,
      net_profit: Math.max(0, netProfit), // No permitir ganancias negativas
      partner1_share: Math.max(0, partner1Share),
      partner2_share: Math.max(0, partner2Share),
      sales_by_hotdog_type: [], // Se llenará con getSalesDataForChart
      expenses_by_category: [] // Se llenará con getExpensesDataForChart
    }
  },

  async getSalesDataForChart(startDate: string, endDate: string): Promise<{ hotdog_type: string; total: number; count: number }[]> {
    // Obtener ventas por tipo de perro con filtro de fecha
    const { data, error } = await supabase
      .rpc('get_sales_by_hotdog_type', {
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      // Si la función RPC no existe, usar consulta manual
      const { data: manualData, error: manualError } = await supabase
        .from('sale_items')
        .select(`
          hotdog_type,
          total_price,
          quantity,
          sales!inner(id, created_at)
        `)

      if (manualError) throw manualError

      // Filtrar manualmente por fecha y agrupar
      const filtered = (manualData as any[]).filter((item: any) => {
        const itemDate = new Date(item.sales.created_at).toISOString().split('T')[0]
        return itemDate >= startDate && itemDate <= endDate
      })

      const grouped = filtered.reduce((acc: any, item: any) => {
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

    return data
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
