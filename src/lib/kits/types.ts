export interface KitInventoryItem {
  tempId: string;
  name: string;
  category: 'Panadería' | 'Proteínas' | 'Aderezos' | 'Complementos' | 'Bebidas' | 'Carnes';
  unit: 'unidades' | 'gramos' | 'litros';
  stock: number;
  min_stock: number;
  cost: number;
}

export interface KitProductIngredient {
  inventoryTempId: string; // Refers to KitInventoryItem.tempId
  quantity: number;
  is_optional: boolean;
}

export interface KitProduct {
  tempId: string;
  name: string;
  description: string;
  price: number;
  category: 'Perros Sencillos' | 'Perros Especiales' | 'Bebidas' | 'Adicionales' | 'Otros';
  requires_protein_choice: boolean;
  show_in_web: boolean;
  ingredients: KitProductIngredient[];
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  icon?: string;
  inventory: KitInventoryItem[];
  products: KitProduct[];
}