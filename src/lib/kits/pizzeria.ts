import { Kit } from './types';

export const kitPizzeria: Kit = {
  id: 'kit-pizzeria',
  name: 'Kit Pizzería',
  description: 'Plantilla ideal para negocios de pizzas artesanales. Incluye masas, queso mozzarella, carnes frías y vegetales.',
  icon: '🍕',
  inventory: [
    { tempId: 'inv-masa-personal', name: 'Masa de Pizza Personal', category: 'Panadería', unit: 'unidades', stock: 0, min_stock: 10, cost: 1500 },
    { tempId: 'inv-salsa-pizza', name: 'Salsa Napolitana', category: 'Aderezos', unit: 'gramos', stock: 0, min_stock: 1000, cost: 10 },
    { tempId: 'inv-queso-mozzarella', name: 'Queso Mozzarella', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 1000, cost: 25 },
    { tempId: 'inv-pepperoni', name: 'Pepperoni', category: 'Carnes', unit: 'gramos', stock: 0, min_stock: 500, cost: 35 },
    { tempId: 'inv-jamon', name: 'Jamón', category: 'Carnes', unit: 'gramos', stock: 0, min_stock: 500, cost: 20 },
    { tempId: 'inv-pina-calada', name: 'Piña Calada', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 500, cost: 15 },
    { tempId: 'inv-champinones', name: 'Champiñones Tajados', category: 'Complementos', unit: 'gramos', stock: 0, min_stock: 300, cost: 30 },
    { tempId: 'inv-pollo-desmechado', name: 'Pollo Desmechado', category: 'Proteínas', unit: 'gramos', stock: 0, min_stock: 500, cost: 22 },
  ],
  products: [
    {
      tempId: 'prod-pizza-pepperoni',
      name: 'Pizza Pepperoni',
      description: 'Clásica pizza de pepperoni con abundante queso mozzarella y salsa napolitana.',
      price: 18000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-masa-personal', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salsa-pizza', quantity: 100, is_optional: false },
        { inventoryTempId: 'inv-queso-mozzarella', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-pepperoni', quantity: 80, is_optional: false },
      ]
    },
    {
      tempId: 'prod-pizza-hawaiana',
      name: 'Pizza Hawaiana',
      description: 'Dulce y salada. Jamón seleccionado, piña calada y extra queso.',
      price: 17000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-masa-personal', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salsa-pizza', quantity: 100, is_optional: false },
        { inventoryTempId: 'inv-queso-mozzarella', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-jamon', quantity: 60, is_optional: false },
        { inventoryTempId: 'inv-pina-calada', quantity: 60, is_optional: false },
      ]
    },
    {
      tempId: 'prod-pizza-pollo-champ',
      name: 'Pizza Pollo y Champiñones',
      description: 'Deliciosa combinación de pollo desmechado y champiñones frescos.',
      price: 20000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-masa-personal', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salsa-pizza', quantity: 100, is_optional: false },
        { inventoryTempId: 'inv-queso-mozzarella', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-pollo-desmechado', quantity: 80, is_optional: false },
        { inventoryTempId: 'inv-champinones', quantity: 50, is_optional: false },
      ]
    },
    {
      tempId: 'prod-pizza-carnivora',
      name: 'Pizza Carnívora',
      description: 'Para los amantes de la carne: Pepperoni, Jamón y Pollo desmechado.',
      price: 22000,
      category: 'Otros',
      requires_protein_choice: false,
      show_in_web: true,
      ingredients: [
        { inventoryTempId: 'inv-masa-personal', quantity: 1, is_optional: false },
        { inventoryTempId: 'inv-salsa-pizza', quantity: 100, is_optional: false },
        { inventoryTempId: 'inv-queso-mozzarella', quantity: 150, is_optional: false },
        { inventoryTempId: 'inv-pepperoni', quantity: 40, is_optional: false },
        { inventoryTempId: 'inv-jamon', quantity: 40, is_optional: false },
        { inventoryTempId: 'inv-pollo-desmechado', quantity: 40, is_optional: false },
      ]
    }
  ]
};
