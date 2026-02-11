import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xzguchfkjiflvhepgtjk.supabase.co'
// Usar Service Role Key para bypass RLS durante el seeding
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3VjaGZramlmbHZoZXBndGprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA2ODEyNSwiZXhwIjoyMDgzNjQ0MTI1fQ.UBHeroA-t5rLSLatjGTz_7y7CeqIZJ7hOvtEJ9GbtXU'

const supabase = createClient(supabaseUrl, supabaseKey)

// Datos del Menú (Extraídos de la imagen)
const MENU_DATA = [
  // PERRAS SENCILLAS
  {
    name: 'Perrita',
    description: '1 salchicha + cebolla, papas ripio queso y salsas de la casa.',
    price: 6000,
    category: 'Perros Sencillos',
    requires_protein_choice: false,
    ingredients: [
      { name: 'Salchicha', quantity: 1, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Queso', quantity: 25, unit: 'gramos' },
      { name: 'Papa Fosforito', quantity: 20, unit: 'gramos' },
      { name: 'Cebolla', quantity: 15, unit: 'gramos' },
      { name: 'Salsa', quantity: 5, unit: 'gramos' } // Promedio genérico
    ]
  },
  {
    name: 'Perrota',
    description: '2 salchichas + cebolla, papas ripio queso y salsas de la casa.',
    price: 7000,
    category: 'Perros Sencillos',
    requires_protein_choice: false,
    ingredients: [
      { name: 'Salchicha', quantity: 2, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Queso', quantity: 35, unit: 'gramos' }, // Un poco más por ser doble
      { name: 'Papa Fosforito', quantity: 25, unit: 'gramos' },
      { name: 'Cebolla', quantity: 20, unit: 'gramos' },
      { name: 'Salsa', quantity: 10, unit: 'gramos' }
    ]
  },
  {
    name: 'Perrísima',
    description: '3 salchichas + cebolla, papas ripio queso y salsas de la casa.',
    price: 8000,
    category: 'Perros Sencillos',
    requires_protein_choice: false,
    ingredients: [
      { name: 'Salchicha', quantity: 3, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Queso', quantity: 45, unit: 'gramos' },
      { name: 'Papa Fosforito', quantity: 30, unit: 'gramos' },
      { name: 'Cebolla', quantity: 25, unit: 'gramos' },
      { name: 'Salsa', quantity: 15, unit: 'gramos' }
    ]
  },

  // PERRAS ESPECIALES
  {
    name: 'La Gran Perra',
    description: '3 salchichas + carne, pollo o cerdo + cebolla, papas ripio queso y salsas de la casa.',
    price: 12000,
    category: 'Perros Especiales',
    requires_protein_choice: true,
    ingredients: [
      { name: 'Salchicha', quantity: 3, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Queso', quantity: 50, unit: 'gramos' },
      { name: 'Papa Fosforito', quantity: 30, unit: 'gramos' },
      { name: 'Cebolla', quantity: 25, unit: 'gramos' },
      { name: 'Salsa', quantity: 20, unit: 'gramos' }
      // La proteína se agrega dinámicamente en el POS, pero aquí podríamos definir una base
    ]
  },
  {
    name: 'La Perra Trifásica',
    description: '3 salchichas + carne, pollo y cerdo + cebolla, papas ripio queso y salsas de la casa.',
    price: 14000,
    category: 'Perros Especiales',
    requires_protein_choice: false, // Ya trae las 3
    ingredients: [
      { name: 'Salchicha', quantity: 3, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Carne Desmechada', quantity: 30, unit: 'gramos' },
      { name: 'Pollo Desmechado', quantity: 30, unit: 'gramos' },
      { name: 'Cerdo Desmechado', quantity: 30, unit: 'gramos' },
      { name: 'Queso', quantity: 50, unit: 'gramos' },
      { name: 'Papa Fosforito', quantity: 30, unit: 'gramos' },
      { name: 'Cebolla', quantity: 25, unit: 'gramos' },
      { name: 'Salsa', quantity: 25, unit: 'gramos' }
    ]
  },
  {
    name: 'La Super Perra',
    description: '3 salchichas + carne, pollo tocineta y huevos de codorniz + cebolla, papas ripio queso y salsas de la casa.',
    price: 15000,
    category: 'Perros Especiales',
    requires_protein_choice: false,
    ingredients: [
      { name: 'Salchicha', quantity: 3, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Carne Desmechada', quantity: 30, unit: 'gramos' },
      { name: 'Pollo Desmechado', quantity: 30, unit: 'gramos' },
      { name: 'Tocineta', quantity: 20, unit: 'gramos' },
      { name: 'Huevo Codorniz', quantity: 2, unit: 'unidades' },
      { name: 'Queso', quantity: 50, unit: 'gramos' },
      { name: 'Papa Fosforito', quantity: 30, unit: 'gramos' },
      { name: 'Cebolla', quantity: 25, unit: 'gramos' },
      { name: 'Salsa', quantity: 25, unit: 'gramos' }
    ]
  },
  {
    name: 'La Perra Quesuda',
    description: '3 salchichas + Doble Porción de pollo, queso gratinado, maíz tierno, huevos de codorniz + cebolla, papas ripio queso y salsas de la casa.',
    price: 17000,
    category: 'Perros Especiales',
    requires_protein_choice: false,
    ingredients: [
      { name: 'Salchicha', quantity: 3, unit: 'unidades' },
      { name: 'Pan Perro', quantity: 1, unit: 'unidades' },
      { name: 'Pollo Desmechado', quantity: 80, unit: 'gramos' }, // Doble porción
      { name: 'Maíz Tierno', quantity: 30, unit: 'gramos' },
      { name: 'Huevo Codorniz', quantity: 2, unit: 'unidades' },
      { name: 'Queso', quantity: 80, unit: 'gramos' }, // Extra queso
      { name: 'Papa Fosforito', quantity: 30, unit: 'gramos' },
      { name: 'Cebolla', quantity: 25, unit: 'gramos' },
      { name: 'Salsa', quantity: 25, unit: 'gramos' }
    ]
  },

  // BEBIDAS
  {
    name: 'Coca-Cola Personal 400ml',
    price: 4000,
    category: 'Bebidas',
    ingredients: [
      { name: 'Coca-Cola 400ml', quantity: 1, unit: 'unidades' }
    ]
  },
  {
    name: 'Coca-Cola 1 Litro',
    price: 5000,
    category: 'Bebidas',
    ingredients: [
      { name: 'Coca-Cola 1L', quantity: 1, unit: 'unidades' }
    ]
  },
  {
    name: 'Coca-Cola 1.5 litros',
    price: 7000,
    category: 'Bebidas',
    ingredients: [
      { name: 'Coca-Cola 1.5L', quantity: 1, unit: 'unidades' }
    ]
  }
];

async function seedProducts() {
  console.log('Iniciando carga de productos...');

  // 1. Obtener todos los items de inventario para mapear nombres a IDs
  const { data: inventoryItems, error: invError } = await supabase
    .from('inventory_items')
    .select('id, name');

  if (invError) {
    console.error('Error obteniendo inventario:', invError);
    return;
  }

  // Crear mapa para búsqueda rápida (normalizando a minúsculas)
  const inventoryMap = new Map(
    inventoryItems.map(item => [item.name.toLowerCase(), item.id])
  );

  // Función auxiliar para encontrar ID de insumo (búsqueda aproximada)
  const findInventoryId = (name: string) => {
    const key = name.toLowerCase();
    // Intento 1: Coincidencia exacta
    if (inventoryMap.has(key)) return inventoryMap.get(key);
    
    // Intento 2: Búsqueda parcial
    for (const [invName, id] of inventoryMap.entries()) {
      if (invName.includes(key) || key.includes(invName)) return id;
    }
    return null;
  };

  for (const product of MENU_DATA) {
    console.log(`Procesando: ${product.name}`);

    // 2. Insertar Producto
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        requires_protein_choice: product.requires_protein_choice || false,
        active: true
      }])
      .select()
      .single();

    if (prodError) {
      console.error(`Error creando producto ${product.name}:`, prodError);
      continue;
    }

    // 3. Insertar Ingredientes (Receta)
    if (product.ingredients) {
      const ingredientsPayload = product.ingredients
        .map(ing => {
          const invId = findInventoryId(ing.name);
          if (!invId) {
            console.warn(`  [WARN] Insumo no encontrado: "${ing.name}" para ${product.name}`);
            return null;
          }
          return {
            product_id: prodData.id,
            inventory_item_id: invId,
            quantity: ing.quantity,
            is_optional: false
          };
        })
        .filter(Boolean); // Filtrar nulos

      if (ingredientsPayload.length > 0) {
        const { error: ingError } = await supabase
          .from('product_ingredients')
          .insert(ingredientsPayload);
        
        if (ingError) console.error(`Error guardando receta para ${product.name}:`, ingError);
        else console.log(`  Receta guardada con ${ingredientsPayload.length} ingredientes.`);
      }
    }
  }

  console.log('¡Proceso finalizado!');
}

seedProducts();
