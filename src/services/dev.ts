import { supabase } from '../lib/supabase';

export const devService = {
  /**
   * Elimina todos los datos transaccionales y de catálogo para dejar la cuenta
   * exactamente como si el usuario acabara de registrarse.
   */
  async resetDatabase() {
    try {
      const listAllReceiptPaths = async () => {
        const paths: string[] = [];
        const limit = 100;
        let offset = 0;

        while (true) {
          const { data, error } = await supabase.storage
            .from('receipts')
            .list('', { limit, offset });

          if (error) throw error;
          if (!data?.length) break;

          for (const item of data) {
            if (item.name) paths.push(item.name);
          }

          if (data.length < limit) break;
          offset += data.length;
        }

        return paths;
      };

      // 1. Borrar Ventas
      await supabase.from('sale_items').delete().not('id', 'is', null);
      await supabase.from('sales').delete().not('id', 'is', null);

      // 2. Borrar Menú y Recetas
      await supabase.from('product_ingredients').delete().not('product_id', 'is', null);
      await supabase.from('products').delete().not('id', 'is', null);

      // 3. Borrar Inventario
      await supabase.from('inventory_movements').delete().not('id', 'is', null);
      await supabase.from('inventory_items').delete().not('id', 'is', null);

      // 4. Borrar Gastos
      await supabase.from('expenses').delete().not('id', 'is', null);

      const receiptPaths = await listAllReceiptPaths();
      for (let i = 0; i < receiptPaths.length; i += 100) {
        const chunk = receiptPaths.slice(i, i + 100);
        const { error } = await supabase.storage.from('receipts').remove(chunk);
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
};
