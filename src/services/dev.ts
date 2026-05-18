import { supabase } from '../lib/supabase';

export const devService = {
  /**
   * Elimina todos los datos transaccionales y de catálogo para dejar la cuenta
   * exactamente como si el usuario acabara de registrarse.
   */
  async resetDatabase() {
    try {
      // 1. Borrar Ventas
      await supabase.from('sale_items').delete().not('id', 'is', null);
      await supabase.from('sales').delete().not('id', 'is', null);

      // 2. Borrar Menú y Recetas
      await supabase.from('product_ingredients').delete().not('product_id', 'is', null);
      await supabase.from('products').delete().not('id', 'is', null);

      // 3. Borrar Inventario
      await supabase.from('inventory_movements').delete().not('id', 'is', null);
      await supabase.from('inventory_items').delete().not('id', 'is', null);

      return true;
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
};