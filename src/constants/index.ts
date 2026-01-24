export const HOTDOG_TYPES = {
  'Perrita': {
    price: 6000,
    ingredients: ['Pan de perro', 'Salchicha', 'Cebolla', 'Papa Fosforito', 'Queso', 'Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza']
  },
  'Perrota': {
    price: 7000,
    ingredients: ['Pan de perro', 'Salchicha', 'Cebolla', 'Papa Fosforito', 'Queso', 'Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza'],
    multipliers: { 'Salchicha': 2 }
  },
  'Perrísima': {
    price: 8000,
    ingredients: ['Pan de perro', 'Salchicha', 'Cebolla', 'Papa Fosforito', 'Queso', 'Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza'],
    multipliers: { 'Salchicha': 3 }
  },
  'La Gran Perra': {
    price: 12000,
    ingredients: ['Pan de perro', 'Salchicha', 'Cebolla', 'Papa Fosforito', 'Queso', 'Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza'],
    multipliers: { 'Salchicha': 3 },
    requiresProteinChoice: true
  },
  'La Perra Trifásica': {
    price: 14000,
    ingredients: ['Pan de perro', 'Salchicha', 'Desmechada de Res', 'Carne de Pollo', 'Carne de Cerdo', 'Cebolla', 'Papa Fosforito', 'Queso', 'Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza'],
    multipliers: { 'Salchicha': 3 }
  },
  'La Super Perra': {
    price: 15000,
    ingredients: ['Pan de perro', 'Salchicha', 'Desmechada de Res', 'Carne de Pollo', 'Tocineta', 'Huevos de Codorniz', 'Cebolla', 'Papa Fosforito', 'Queso', 'Salsa BBQ', 'Salsa Mayonesa', 'Salsa Mostaza'],
    multipliers: { 'Salchicha': 3 }
  },
  'Coca-Cola Personal 400ml': {
    price: 4000,
    ingredients: ['CocaCola Personal']
  },
  'Coca-Cola 1 litro': {
    price: 5000,
    ingredients: ['CocaCola 1L']
  },
  'Coca-Cola 1.5 litros': {
    price: 7000,
    ingredients: ['CocaCola 1.5L']
  }
} as const

export const INGREDIENT_CONSUMPTION = {
  'Pan de perro': { unit: 'unidades', quantity: 1 },
  'Salchicha': { unit: 'unidades', quantity: 1 },
  'Tocineta': { unit: 'gramos', quantity: 20 },
  'Cebolla': { unit: 'gramos', quantity: 15 },
  'Papa Fosforito': { unit: 'gramos', quantity: 20 },
  'Queso': { unit: 'gramos', quantity: 25 },
  'Salsa BBQ': { unit: 'gramos', quantity: 5 },
  'Salsa Mayonesa': { unit: 'gramos', quantity: 5 },
  'Salsa Mostaza': { unit: 'gramos', quantity: 5 },
  'Carne de Cerdo': { unit: 'gramos', quantity: 50 },
  'Carne de Pollo': { unit: 'gramos', quantity: 40 },
  'Desmechada de Res': { unit: 'gramos', quantity: 30 },
  'Huevos de Codorniz': { unit: 'unidades', quantity: 2 },
  'CocaCola Personal': { unit: 'unidades', quantity: 1 },
  'CocaCola 1L': { unit: 'unidades', quantity: 1 },
  'CocaCola 1.5L': { unit: 'unidades', quantity: 1 }
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
