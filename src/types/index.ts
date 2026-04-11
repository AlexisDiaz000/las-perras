export interface AppSettings {
  id: number
  app_name: string
  logo_url?: string | null
  font_primary: string
  font_display: string
  is_store_open: boolean
  public_message: string | null
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'vendor'
  name: string
  active: boolean
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
  sale_id?: string
  reversal_of?: string
  movement_group?: string
}

export interface Sale {
  id: string
  order_number?: number
  description?: string
  total_amount: number
  payment_method?: 'cash' | 'card'
  seller_id?: string
  created_at: string
  seller?: User
  status?: 'draft' | 'pending_approval' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'voided' | 'refunded' | 'rejected'
  updated_at?: string
  void_reason?: string
  voided_at?: string
  voided_by?: string
  items?: SaleItem[]
  order_type: 'pos' | 'local' | 'delivery'
  customer_name?: string
  customer_phone?: string
  delivery_address?: string
  delivery_notes?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  hotdog_type: string
  quantity: number
  unit_price: number
  total_price: number
  modifiers?: any
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
  cogs: number // Cost of Goods Sold (Costo de Mercancía Vendida)
  waste_cost: number // Costo total de mermas
  net_profit: number
  sales_by_hotdog_type: { hotdog_type: string; total: number; count: number }[]
  expenses_by_category: { category: string; total: number }[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: 'Perros Sencillos' | 'Perros Especiales' | 'Bebidas' | 'Adicionales' | 'Otros'
  image_url?: string
  active: boolean
  show_in_web: boolean
  requires_protein_choice: boolean
  ingredients?: ProductIngredient[]
  created_at: string
}

export interface ProductIngredient {
  id: string
  product_id: string
  inventory_item_id: string
  quantity: number
  is_optional: boolean
  inventory_item?: InventoryItem
}

export interface CartItem {
  id: string // product id
  name: string // product name
  price: number // product price
  cartQuantity: number // quantity in cart
  modifiers?: {
    protein?: string
  }
}
