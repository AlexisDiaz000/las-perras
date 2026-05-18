import { supabase } from '../lib/supabase';

// Script para enlazar los datos de prueba (seed) con el Kit de Perrería
// Así el sistema podrá desinstalarlos si el usuario quiere.

export const linkSeedDataToKit = async () => {
  try {
    const { data: products } = await supabase.from('products').select('id, name');
    if (!products) return;

    const dogNames = [
      'Perro Sencillo',
      'Perro Especial',
      'Perro Suizo',
      'Perro Ranchero',
      'Perro Hawaiano',
      'Perro Salvaje'
    ];

    const productsToUpdate = products.filter(p => dogNames.includes(p.name));
    
    for (const prod of productsToUpdate) {
      await supabase.from('products').update({
        is_kit: true,
        kit_id: 'kit-perreria',
        kit_temp_id: `prod-${prod.name.toLowerCase().replace(/\s+/g, '-')}`
      }).eq('id', prod.id);
    }
    console.log('Seed data linked to kit-perreria successfully!');
    return true;
  } catch (error) {
    console.error('Error linking seed data:', error);
    return false;
  }
};