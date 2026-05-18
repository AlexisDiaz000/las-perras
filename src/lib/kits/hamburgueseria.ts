import { Kit } from './types';

export const kitHamburgueseria: Kit = {
  id: 'kit-hamburgueseria',
  name: 'Kit Hamburguesería',
  description: 'Todo lo necesario para arrancar una hamburguesería. Incluye panes, carnes, quesos, vegetales y combos clásicos.',
  icon: '🍔',
  inventory: [
    { tempId: 'inv-pan-hamburguesa', name: 'Pan de Hamburguesa', category: 'Panadería', unit: 'unidades', stock: 0, min_stock: 12, cost: 800 },
    { tempId: 'inv-carne-res', name: 'Carne de Res 150g', category: 'Carnes', unit: 'unidades', stock: 0, min_stock: 15, cost: 2500 },
    { tempId: 'inv-queso-cheddar', name: 'Queso Cheddar', category: 'Complementos', unit: 'unidades', stock: 0, min_stock: 20, cost: 400 },
    { tempId: 'inv-tocineta', name: 'Tocineta Premium', category: 'Carnes', unit: 'gramos', stock: 0, min_stock: 200, cost: 25 },
    { tempId: 'inv-lechuga', name: 'Lechuga Crespa', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 300, cost: 5 },
    { tempId: 'inv-tomate', name: 'Tomate en Rodajas', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 300, cost: 4 },
    { tempId: 'inv-papas-francesa', name: 'Papas a la Francesa', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 2000, cost: 8 },
    { tempId: 'inv-salsa-tomate', name: 'Salsa de Tomate', category: 'Aderezos', unit: 'gramos', stock: 0, min_stock: 500, cost: 6 },
    { tempId: 'inv-mayonesa', name: 'Mayonesa', category: 'Aderezos', unit: 'gramos', stock: 0, min_stock: 500, cost: 8 },
  ],
  products: [
    {
      tempId: 'prod-hamburguesa-clasica',
      name: 'Hamburguesa Clásica',
      description: 'Pan artesanal, carne de res 150g, lechuga fresca, tomate y salsas de la casa.',
      price: 15000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-pan-hamburguesa', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-carne-res', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-lechuga', quantity: 20, is_optional: false },
        { inventoryTempId: 'inv-tomate', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-salsa-tomate', quantity: 15, is_optional: true },
        { inventoryTempId: 'inv-mayonesa', quantity: 10, is_optional: true },
      ]
    },
    {
      tempId: 'prod-hamburguesa-queso',
      name: 'Cheeseburger',
      description: 'Nuestra clásica pero con doble queso cheddar fundido.',
      price: 17000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-pan-hamburguesa', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-carne-res', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-queso-cheddar', quantity: 2, is_optional: false }, // Doble queso
        { inventoryTempId: 'inv-lechuga', quantity: 20, is_optional: false },
        { inventoryTempId: 'inv-tomate', quantity: 30, is_optional: false },
        { inventoryTempId: 'inv-salsa-tomate', quantity: 15, is_optional: true },
        { inventoryTempId: 'inv-mayonesa', quantity: 10, is_optional: true },
      ]
    },
    {
      tempId: 'prod-hamburguesa-bacon',
      name: 'Bacon Burger',
      description: 'Carne de res, queso cheddar, tocineta crujiente y salsa BBQ.',
      price: 19000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-pan-hamburguesa', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-carne-res', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-queso-cheddar', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-tocineta', quantity: 40, is_optional: false },
        { inventoryTempId: 'inv-salsa-tomate', quantity: 15, is_optional: true },
        { inventoryTempId: 'inv-mayonesa', quantity: 10, is_optional: true },
      ]
    },
    {
      tempId: 'prod-papas-frit',
      name: 'Porción de Papas Fritas',
      description: 'Papas a la francesa crocantes.',
      price: 6000,
      category: 'Adicionales',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-papas-francesa', quantity: 150, is_optional: false },
      ]
    }
  ]
};
