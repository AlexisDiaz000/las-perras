export interface User {
  id: string
  email: string
  role: 'admin' | 'vendor'
  name: string
  created_at: string
}

export interface InventoryItem {
  id: string
  name: string
  category: 'Panadería' | 'Proteínas' | 'Aderezos' | 'Complementos' | 'Bebidas' | 'Carnes'
  unit: 'unidades' | 'gramos' | 'litros'
  current_stock: number
  min_threshold: number
  unit_cost: number
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  item_id: string
  type: 'in' | 'out'
  quantity: number
  reason: string
  user_id: string
  created_at: string
  item?: InventoryItem
}

export interface Sale {
  id: string
  total_amount: number
  payment_method: 'cash' | 'card'
  seller_id: string
  created_at: string
  seller?: User
}

export interface SaleItem {
  id: string
  sale_id: string
  hotdog_type: 'Básico' | 'Mejorado' | 'Especial' | 'Carnívoro' | 'Tricarne' | 'Supremo'
  quantity: number
  unit_price: number
  total_price: number
}

export interface Expense {
  id: string
  expense_date: string
  description: string
  category: 'Insumos' | 'Servicios' | 'Transporte' | 'Alimentación' | 'Personal' | 'Otros'
  amount: number
  receipt_url?: string
  user_id: string
  created_at: string
  user?: User
}

export interface DashboardMetrics {
  total_sales: number
  total_expenses: number
  net_profit: number
  partner1_share: number
  partner2_share: number
  sales_by_hotdog_type: { hotdog_type: string; total: number; count: number }[]
  expenses_by_category: { category: string; total: number }[]
}

export interface CartItem {
  hotdog_type: 'Básico' | 'Mejorado' | 'Especial' | 'Carnívoro' | 'Tricarne' | 'Supremo'
  quantity: number
  unit_price: number
  total_price: number
}
