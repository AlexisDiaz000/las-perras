import { Kit } from './types';

export const kitPerreria: Kit = {
  id: 'kit-perreria',
  name: 'Kit Perrería',
  description: 'Configuración inicial ideal para un negocio de perros calientes. Incluye insumos básicos, salsas y los productos más populares.',
  icon: '🌭',
  inventory: [
    { tempId: 'inv-pan-perro', name: 'Pan Perro', category: 'Panadería', unit: 'unidades', stock: 50, min_stock: 10, cost: 500 },
    { tempId: 'inv-salchicha', name: 'Salchicha', category: 'Proteínas', unit: 'unidades', stock: 50, min_stock: 10, cost: 800 },
    { tempId: 'inv-papa-chongo', name: 'Papa Chongo / Ripio', category: 'Complementos', unit: 'gramos', stock: 5000, min_stock: 500, cost: 5 },
    { tempId: 'inv-queso', name: 'Queso Rallado', category: 'Complementos', unit: 'gramos', stock: 2000, min_stock: 200, cost: 15 },
    { tempId: 'inv-salsa-rosada', name: 'Salsa Rosada', category: 'Aderezos', unit: 'gramos', stock: 3000, min_stock: 300, cost: 8 },
    { tempId: 'inv-mayonesa', name: 'Mayonesa', category: 'Aderezos', unit: 'gramos', stock: 3000, min_stock: 300, cost: 8 },
    { tempId: 'inv-pina', name: 'Salsa de Piña', category: 'Aderezos', unit: 'gramos', stock: 2000, min_stock: 200, cost: 10 },
    { tempId: 'inv-tocineta', name: 'Tocineta', category: 'Carnes', unit: 'gramos', stock: 1000, min_stock: 100, cost: 20 },
    { tempId: 'inv-coca-400', name: 'Coca-Cola 400ml', category: 'Bebidas', unit: 'unidades', stock: 24, min_stock: 6, cost: 2000 },
    { tempId: 'inv-coca-1l', name: 'Coca-Cola 1L', category: 'Bebidas', unit: 'unidades', stock: 12, min_stock: 4, cost: 3500 },
  ],
  products: [
    {
      tempId: 'prod-perro-sencillo',
      name: 'Perro Sencillo',
      description: 'Pan, salchicha, papa ripio, queso y salsas tradicionales.',
      price: 8000,
      category: 'Perros Sencillos',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-pan-perro', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salchicha', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-papa-chongo', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-queso', quantity: 20, is_optional: false },
        { inventoryTempId: 'inv-salsa-rosada', quantity: 15, is_optional: true },
        { inventoryTempId: 'inv-mayonesa', quantity: 10, is_optional: true },
        { inventoryTempId: 'inv-pina', quantity: 15, is_optional: true },
      ]
    },
    {
      tempId: 'prod-perro-especial',
      name: 'Perro Especial',
      description: 'Nuestro perro clásico con adición de tocineta crujiente.',
      price: 11000,
      category: 'Perros Especiales',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-pan-perro', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salchicha', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-tocineta', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-papa-chongo', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-queso', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-salsa-rosada', quantity: 15, is_optional: true },
        { inventoryTempId: 'inv-mayonesa', quantity: 10, is_optional: true },
        { inventoryTempId: 'inv-pina', quantity: 15, is_optional: true },
      ]
    },
    {
      tempId: 'prod-perro-suizo',
      name: 'Perro Suizo',
      description: 'Extra queso fundido para los amantes de lo clásico.',
      price: 10000,
      category: 'Perros Especiales',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-pan-perro', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salchicha', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-papa-chongo', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-queso', quantity: 60, is_optional: false }, // Doble queso
        { inventoryTempId: 'inv-salsa-rosada', quantity: 15, is_optional: true },
        { inventoryTempId: 'inv-mayonesa', quantity: 10, is_optional: true },
        { inventoryTempId: 'inv-pina', quantity: 15, is_optional: true },
      ]
    },
    {
      tempId: 'prod-coca-400',
      name: 'Coca-Cola 400ml',
      description: 'Gaseosa Coca-Cola personal de 400ml.',
      price: 3500,
      category: 'Bebidas',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-coca-400', quantity: 1, is_optional: false },
      ]
    },
    {
      tempId: 'prod-coca-1l',
      name: 'Coca-Cola 1 Litro',
      description: 'Gaseosa Coca-Cola familiar de 1 Litro.',
      price: 6000,
      category: 'Bebidas',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-coca-1l', quantity: 1, is_optional: false },
      ]
    }
  ]
};