import { supabase } from '../lib/supabase'
import { Expense } from '../types'

export const expensesService = {
  async getExpenses(startDate?: string, endDate?: string, category?: string): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        user:users(*)
      `)
      .order('expense_date', { ascending: false })

    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Expense[]
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select(`
        *,
        user:users(*)
      `)
      .single()

    if (error) throw error
    return data as Expense
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single()

    if (error) throw error
    return data as Expense
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getExpensesByCategory(startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> {
    let query = supabase
      .from('expenses')
      .select('category, amount')

    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Agrupar por categoría
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
  }
}