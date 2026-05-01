import { supabase } from '../lib/supabase';
import { Kit } from '../lib/kits/types';

export const kitsService = {
  async installKit(kit: Kit) {
    try {
      const inventoryIdMap: Record<string, string> = {};
      const productIdMap: Record<string, string> = {};

      // ==========================================
      // 1. INVENTARIO (Insumos)
      // ==========================================
      if (kit.inventory && kit.inventory.length > 0) {
        const kitInvNames = kit.inventory.map(i => i.name);
        
        // 1.1 Consultar qué insumos ya existen en la base de datos
        const { data: existingInv, error: err1 } = await supabase
          .from('inventory_items')
          .select('id, name')
          .in('name', kitInvNames);
          
        if (err1) throw new Error(`Error leyendo inventario: ${err1.message}`);

        // 1.2 Guardar los IDs de los que YA existen
        existingInv?.forEach(item => {
          const kitItem = kit.inventory.find(i => i.name === item.name);
          if (kitItem) inventoryIdMap[kitItem.tempId] = item.id;
        });

        // 1.3 Filtrar estrictamente los que NO existen para crearlos
        const missingInv = kit.inventory.filter(i => !existingInv?.find(e => e.name === i.name));

        if (missingInv.length > 0) {
          const inventoryToInsert = missingInv.map(item => ({
            name: item.name,
            unit: item.unit,
            current_stock: item.stock,
            min_threshold: item.min_stock,
            unit_cost: item.cost,
            category: item.category
          }));

          const { data: insertedInv, error: err2 } = await supabase
            .from('inventory_items')
            .insert(inventoryToInsert)
            .select('id, name');

          if (err2) throw new Error(`Error creando inventario: ${err2.message}`);

          // 1.4 Guardar los IDs de los recién creados
          insertedInv?.forEach(item => {
            const kitItem = kit.inventory.find(i => i.name === item.name);
            if (kitItem) inventoryIdMap[kitItem.tempId] = item.id;
          });
        }
      }

      // ==========================================
      // 2. PRODUCTOS
      // ==========================================
      if (kit.products && kit.products.length > 0) {
        const kitProdNames = kit.products.map(p => p.name);
        
        // 2.1 Consultar qué productos ya existen en la base de datos
        const { data: existingProd, error: err3 } = await supabase
          .from('products')
          .select('id, name')
          .in('name', kitProdNames);

        if (err3) throw new Error(`Error leyendo productos: ${err3.message}`);

        // 2.2 Guardar los IDs de los productos que YA existen
        existingProd?.forEach(prod => {
          const kitProd = kit.products.find(p => p.name === prod.name);
          if (kitProd) productIdMap[kitProd.tempId] = prod.id;
        });

        // 2.3 Filtrar estrictamente los que NO existen para crearlos
        const missingProd = kit.products.filter(p => !existingProd?.find(e => e.name === p.name));

        if (missingProd.length > 0) {
          const productsToInsert = missingProd.map(prod => ({
            name: prod.name,
            description: prod.description,
            price: prod.price,
            category: prod.category,
            requires_protein_choice: prod.requires_protein_choice,
            show_in_web: prod.show_in_web,
            active: true
          }));

          const { data: insertedProd, error: err4 } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select('id, name');

          if (err4) throw new Error(`Error creando productos: ${err4.message}`);

          // 2.4 Guardar los IDs de los recién creados
          insertedProd?.forEach(prod => {
            const kitProd = kit.products.find(p => p.name === prod.name);
            if (kitProd) productIdMap[kitProd.tempId] = prod.id;
          });
        }

        // ==========================================
        // 3. RECETAS (Ingredientes de productos)
        // ==========================================
        const ingredientsToInsert: any[] = [];
        
        kit.products.forEach(prod => {
          const realProductId = productIdMap[prod.tempId];
          if (!realProductId) return;

          if (prod.ingredients && prod.ingredients.length > 0) {
            prod.ingredients.forEach(ing => {
              const realInventoryId = inventoryIdMap[ing.inventoryTempId];
              if (realInventoryId) {
                ingredientsToInsert.push({
                  product_id: realProductId,
                  inventory_item_id: realInventoryId,
                  quantity: ing.quantity,
                  is_optional: ing.is_optional
                });
              }
            });
          }
        });

        if (ingredientsToInsert.length > 0) {
          // 3.1 Limpiar recetas viejas solo de estos productos para evitar duplicados
          const productIds = Object.values(productIdMap);
          if (productIds.length > 0) {
            await supabase.from('product_ingredients').delete().in('product_id', productIds);
          }

          // 3.2 Insertar las recetas correctas
          const { error: ingError } = await supabase
            .from('product_ingredients')
            .insert(ingredientsToInsert);

          if (ingError) throw new Error(`Error instalando recetas: ${ingError.message}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Kit installation failed:', error);
      throw error;
    }
  },

  async uninstallKit(kit: Kit) {
    try {
      const kitProdNames = kit.products.map(p => p.name);
      const kitInvNames = kit.inventory.map(i => i.name);

      // 1. Eliminar Productos y sus recetas
      if (kitProdNames.length > 0) {
        const { data: prods } = await supabase.from('products').select('id').in('name', kitProdNames);
        if (prods && prods.length > 0) {
          const prodIds = prods.map(p => p.id);
          // Borrar recetas explícitamente para evitar bloqueos
          await supabase.from('product_ingredients').delete().in('product_id', prodIds);
          // Borrar productos
          const { error: prodError } = await supabase.from('products').delete().in('id', prodIds);
          if (prodError) throw new Error(`Error eliminando productos: ${prodError.message}`);
        }
      }

      // 2. Manejar Insumos (Desactivarlos si tienen historial, borrarlos si no)
      if (kitInvNames.length > 0) {
        const { data: invs } = await supabase.from('inventory_items').select('id, current_stock').in('name', kitInvNames);
        if (invs && invs.length > 0) {
          const invIds = invs.map(i => i.id);
          
          // a. Borrar recetas huérfanas que usen estos insumos (las de los productos recién borrados)
          await supabase.from('product_ingredients').delete().in('inventory_item_id', invIds);
          
          // En lugar de borrar a la fuerza los movimientos y el insumo (que rompe el historial de ventas pasadas),
          // intentamos borrar el insumo de forma segura.
          const { error: deleteError } = await supabase.from('inventory_items').delete().in('id', invIds);

          // Si falla por foreign key constraint (ej. 23503), significa que hay ventas o movimientos que debemos preservar
          if (deleteError && deleteError.code === '23503') {
             console.warn('Algunos insumos no se pudieron borrar porque tienen historial. Se procederá a "Ocultarlos" llevando su stock a 0.');
             // Solución "Soft Delete": No podemos borrar la fila, así que vaciamos su stock
             // y podríamos agregarle un prefijo "[INACTIVO]" o simplemente dejar el stock en 0.
             // Para la integridad contable, creamos un movimiento de "Salida" por el stock restante.
             for (const item of invs) {
               if (item.current_stock > 0) {
                 await supabase.from('inventory_movements').insert({
                   item_id: item.id,
                   type: 'out',
                   quantity: item.current_stock,
                   reason: 'Ajuste: Desinstalación de Kit',
                   user_id: (await supabase.auth.getUser()).data.user?.id
                 });
                 // Actualizamos el stock a 0
                 await supabase.from('inventory_items').update({ current_stock: 0 }).eq('id', item.id);
               }
             }
          } else if (deleteError) {
             throw new Error(`Error eliminando inventario: ${deleteError.message}`);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Kit uninstallation failed:', error);
      throw error;
    }
  }
};