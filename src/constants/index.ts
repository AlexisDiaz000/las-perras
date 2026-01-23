export const HOTDOG_TYPES = {
  'Básico': {
    price: 6000,
    ingredients: ['Pan de perro', 'Salchicha']
  },
  'Mejorado': {
    price: 7000,
    ingredients: ['Pan de perro', 'Salchicha', 'Tocineta']
  },
  'Especial': {
    price: 8000,
    ingredients: ['Pan de perro', 'Salchicha', 'Tocineta', 'Cebolla']
  },
  'Carnívoro': {
    price: 12000,
    ingredients: ['Pan de perro', 'Salchicha', 'Carne de Cerdo']
  },
  'Tricarne': {
    price: 14000,
    ingredients: ['Pan de perro', 'Salchicha', 'Carne de Cerdo', 'Carne de Pollo', 'Desmechada de Res']
  },
  'Supremo': {
    price: 15000,
    ingredients: ['Pan de perro', 'Carne de Cerdo', 'Carne de Pollo', 'Tocineta', 'Huevos de Codorniz']
  }
} as const

export const INGREDIENT_CONSUMPTION = {
  'Pan de perro': { unit: 'unidades', quantity: 1 },
  'Salchicha': { unit: 'unidades', quantity: 1 },
  'Tocineta': { unit: 'gramos', quantity: 20 },
  'Cebolla': { unit: 'gramos', quantity: 15 },
  'Carne de Cerdo': { unit: 'gramos', quantity: 50 },
  'Carne de Pollo': { unit: 'gramos', quantity: 40 },
  'Desmechada de Res': { unit: 'gramos', quantity: 30 },
  'Huevos de Codorniz': { unit: 'unidades', quantity: 2 }
} as const

export const PARTNER1_PERCENTAGE = 0.7
export const PARTNER2_PERCENTAGE = 0.3
export const DAILY_FIXED_EXPENSES = 30000

export const EXPENSE_CATEGORIES = [
  'Insumos',
  'Servicios', 
  'Transporte',
  'Alimentación',
  'Personal',
  'Otros'
] as const

export const INVENTORY_CATEGORIES = [
  'Panadería',
  'Proteínas',
  'Aderezos', 
  'Complementos',
  'Bebidas',
  'Carnes'
] as const

export const UNITS = [
  'unidades',
  'gramos',
  'litros'
] as const

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' }
] as const
