import { supabase } from '../lib/supabase';
import { Kit } from '../lib/kits/types';

export const kitsService = {
  async installKit(kit: Kit) {
    try {
      const inventoryIdMap: Record<string, string> = {};
      const productIdMap: Record<string, string> = {};

      if (kit.inventory && kit.inventory.length > 0) {
        const kitInvNames = kit.inventory.map(i => i.name);
        
        const { data: existingInv, error: err1 } = await supabase
          .from('inventory_items')
          .select('id, name, is_hidden')
          .in('name', kitInvNames);
          
        if (err1) throw new Error(`Error leyendo inventario: ${err1.message}`);

        existingInv?.forEach(item => {
          const kitItem = kit.inventory.find(i => i.name === item.name);
          if (kitItem) inventoryIdMap[kitItem.tempId] = item.id;
        });

        const missingInv = kit.inventory.filter(i => !existingInv?.find(e => e.name === i.name));

        const hiddenExistingIds = (existingInv || []).filter(i => i.is_hidden).map(i => i.id);
        if (hiddenExistingIds.length > 0) {
          const { error: unhideError } = await supabase
            .from('inventory_items')
            .update({ is_hidden: false, hidden_reason: null })
            .in('id', hiddenExistingIds);

          if (unhideError) throw new Error(`Error reactivando inventario: ${unhideError.message}`);
        }

        if (missingInv.length > 0) {
          const inventoryToInsert = missingInv.map(item => ({
            name: item.name,
            unit: item.unit,
            current_stock: item.stock,
            min_threshold: item.min_stock,
            unit_cost: item.cost,
            category: item.category,
            is_hidden: false,
            hidden_reason: null
          }));

          const { data: insertedInv, error: err2 } = await supabase
            .from('inventory_items')
            .insert(inventoryToInsert)
            .select('id, name');

          if (err2) throw new Error(`Error creando inventario: ${err2.message}`);

          insertedInv?.forEach(item => {
            const kitItem = kit.inventory.find(i => i.name === item.name);
            if (kitItem) inventoryIdMap[kitItem.tempId] = item.id;
          });
        }
      }

      if (kit.products && kit.products.length > 0) {
        const kitTempIds = kit.products.map(p => p.tempId);
        
        const { data: existingProd, error: err3 } = await supabase
          .from('products')
          .select('id, kit_temp_id')
          .eq('kit_id', kit.id)
          .in('kit_temp_id', kitTempIds);

        if (err3) throw new Error(`Error leyendo productos: ${err3.message}`);

        existingProd?.forEach(prod => {
          if (prod.kit_temp_id) productIdMap[prod.kit_temp_id] = prod.id;
        });

        // Separar productos nuevos de los existentes
        const missingProd = kit.products.filter(p => !existingProd?.find(e => e.kit_temp_id === p.tempId));
        const existingProdToUpdate = kit.products.filter(p => existingProd?.find(e => e.kit_temp_id === p.tempId));

        // Insertar los nuevos
        if (missingProd.length > 0) {
          const productsToInsert = missingProd.map(prod => ({
            name: prod.name,
            description: prod.description,
            price: prod.price,
            category: prod.category,
            requires_protein_choice: prod.requires_protein_choice,
            show_in_web: prod.show_in_web,
            active: true,
            is_kit: true,
            kit_id: kit.id,
            kit_temp_id: prod.tempId
          }));

          const { data: insertedProd, error: err4 } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select('id, kit_temp_id');

          if (err4) throw new Error(`Error creando productos: ${err4.message}`);

          insertedProd?.forEach(prod => {
            if (prod.kit_temp_id) productIdMap[prod.kit_temp_id] = prod.id;
          });
        }

        // Reactivar los existentes (si estaban desactivados por desinstalación previa)
        if (existingProdToUpdate.length > 0 && existingProd) {
          const existingIds = existingProd.map(p => p.id);
          const { error: errUpdate } = await supabase
            .from('products')
            .update({ active: true, show_in_web: true })
            .in('id', existingIds);
            
          if (errUpdate) throw new Error(`Error reactivando productos: ${errUpdate.message}`);
        }

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
          const productIds = Object.values(productIdMap);
          if (productIds.length > 0) {
            await supabase.from('product_ingredients').delete().in('product_id', productIds);
          }

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
      const kitInvNames = kit.inventory.map(i => i.name);

      const { data: prods, error: prodFetchError } = await supabase
        .from('products')
        .select('id')
        .eq('kit_id', kit.id)
        .eq('is_kit', true);

      if (prodFetchError) throw new Error(`Error leyendo productos: ${prodFetchError.message}`);

      const prodIds = (prods || []).map(p => p.id);

      if (prodIds.length > 0) {
        const { error: ingDeleteError } = await supabase
          .from('product_ingredients')
          .delete()
          .in('product_id', prodIds);

        if (ingDeleteError) throw new Error(`Error eliminando recetas: ${ingDeleteError.message}`);

        // Eliminamos los productos por completo (Hard Delete es seguro porque las ventas solo guardan el nombre en texto)
        const { error: prodDeleteError } = await supabase
          .from('products')
          .delete()
          .in('id', prodIds);

        if (prodDeleteError) throw new Error(`Error eliminando productos: ${prodDeleteError.message}`);
      }

      if (kitInvNames.length > 0) {
        const { data: invs, error: invFetchError } = await supabase
          .from('inventory_items')
          .select('id, name')
          .in('name', kitInvNames);

        if (invFetchError) throw new Error(`Error leyendo inventario: ${invFetchError.message}`);

        const invIds = (invs || []).map(i => i.id);

        if (invIds.length > 0) {
          const { data: links, error: linkError } = await supabase
            .from('product_ingredients')
            .select('inventory_item_id, product_id, product:products(active)')
            .in('inventory_item_id', invIds);

          if (linkError) throw new Error(`Error validando uso de inventario: ${linkError.message}`);

          const inUse = new Set<string>();
          (links || []).forEach((row: any) => {
            const isActive = row.product?.active === true;
            const isSameKitProduct = prodIds.includes(row.product_id);
            if (isActive && !isSameKitProduct) inUse.add(row.inventory_item_id);
          });

          const toHide = invIds.filter(id => !inUse.has(id));
          if (toHide.length > 0) {
            const { error: hideError } = await supabase
              .from('inventory_items')
              .update({ is_hidden: true, hidden_reason: `Kit uninstall: ${kit.id}` })
              .in('id', toHide);

            if (hideError) throw new Error(`Error ocultando inventario: ${hideError.message}`);
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
