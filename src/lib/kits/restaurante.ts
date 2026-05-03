import { Kit } from './types';

export const kitRestaurante: Kit = {
  id: 'kit-restaurante',
  name: 'Kit Restaurante (Corrientazo)',
  description: 'Plantilla base para restaurantes de menú diario o "corrientazos". Incluye bases como arroz, sopas y proteínas principales.',
  icon: '🍛',
  inventory: [
    { tempId: 'inv-arroz-blanco', name: 'Arroz Blanco (Porción)', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 2000, cost: 200 },
    { tempId: 'inv-frijoles', name: 'Frijoles (Porción)', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 1500, cost: 300 },
    { tempId: 'inv-sopa-dia', name: 'Sopa del Día', category: 'Complementos', unit: 'litros', stock: 0, min_stock: 5, cost: 800 },
    { tempId: 'inv-ensalada-fresca', name: 'Ensalada Fresca', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 1000, cost: 250 },
    { tempId: 'inv-tajada-maduro', name: 'Tajada de Maduro', category: 'Complementos', unit: 'unidades', stock: 0, min_stock: 20, cost: 150 },
    
    // Proteínas
    { tempId: 'inv-pechuga-plancha', name: 'Pechuga a la Plancha', category: 'Proteínas', unit: 'unidades', stock: 0, min_stock: 10, cost: 2500 },
    { tempId: 'inv-carne-asada', name: 'Carne Asada', category: 'Carnes', unit: 'unidades', stock: 0, min_stock: 10, cost: 3000 },
    { tempId: 'inv-chicharron', name: 'Chicharrón', category: 'Carnes', unit: 'gramos', stock: 0, min_stock: 1000, cost: 30 },
    { tempId: 'inv-huevo-frito', name: 'Huevo Frito', category: 'Proteínas', unit: 'unidades', stock: 0, min_stock: 30, cost: 400 },
  ],
  products: [
    {
      tempId: 'prod-menu-pechuga',
      name: 'Menú del Día - Pechuga',
      description: 'Sopa del día, arroz, frijoles, tajada, ensalada y pechuga a la plancha.',
      price: 15000,
      category: 'Otros',
      requires_protein_choice: false, // Se podría hacer true si tuvieran una opción genérica, pero aquí es un plato fijo
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-sopa-dia', quantity: 0.5, is_optional: false }, // Media litro / plato hondo
        { inventoryTempId: 'inv-arroz-blanco', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-frijoles', quantity: 120, is_optional: false },
        { inventoryTempId: 'inv-tajada-maduro', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-ensalada-fresca', quantity: 80, is_optional: false },
        { inventoryTempId: 'inv-pechuga-plancha', quantity: 1, is_optional: false },
      ]
    },
    {
      tempId: 'prod-menu-carne',
      name: 'Menú del Día - Carne Asada',
      description: 'Sopa del día, arroz, frijoles, tajada, ensalada y carne asada.',
      price: 16000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-sopa-dia', quantity: 0.5, is_optional: false },
        { inventoryTempId: 'inv-arroz-blanco', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-frijoles', quantity: 120, is_optional: false },
        { inventoryTempId: 'inv-tajada-maduro', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-ensalada-fresca', quantity: 80, is_optional: false },
        { inventoryTempId: 'inv-carne-asada', quantity: 1, is_optional: false },
      ]
    },
    {
      tempId: 'prod-bandeja-paisa',
      name: 'Mini Bandeja Paisa',
      description: 'Arroz, frijoles, carne asada, chicharrón, huevo frito y tajada de maduro.',
      price: 22000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-arroz-blanco', quantity: 200, is_optional: false }, // Más arroz
        { inventoryTempId: 'inv-frijoles', quantity: 180, is_optional: false }, // Más frijol
        { inventoryTempId: 'inv-carne-asada', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-chicharron', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-huevo-frito', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-tajada-maduro', quantity: 2, is_optional: false },
      ]
    },
    {
      tempId: 'prod-porcion-sopa',
      name: 'Sopa Sola',
      description: 'Porción grande de la sopa del día.',
      price: 6000,
      category: 'Adicionales',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-sopa-dia', quantity: 0.8, is_optional: false },
      ]
    }
  ]
};
