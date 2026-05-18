import { supabase } from '../lib/supabase'
import { Product, ProductIngredient } from '../types'

export const productsService = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .order('name')

    if (error) throw error
    return data as Product[]
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'ingredients'>, ingredients: Omit<ProductIngredient, 'id' | 'product_id'>[]) {
    // 1. Crear el producto
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (productError) throw productError

    // 2. Crear los ingredientes
    if (ingredients.length > 0) {
      const ingredientsToInsert = ingredients.map(ing => ({
        product_id: productData.id,
        inventory_item_id: ing.inventory_item_id,
        quantity: ing.quantity,
        is_optional: ing.is_optional
      }))

      const { error: ingredientsError } = await supabase
        .from('product_ingredients')
        .insert(ingredientsToInsert)

      if (ingredientsError) {
        // Si falla, intentamos borrar el producto para no dejar basura (rollback manual)
        await supabase.from('products').delete().eq('id', productData.id)
        throw ingredientsError
      }
    }

    return productData
  },

  async updateProduct(productId: string, updates: Partial<Product>, newIngredients?: Omit<ProductIngredient, 'id' | 'product_id'>[]) {
    // 1. Actualizar producto
    const { data: productData, error: productError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()

    if (productError) throw productError

    // 2. Actualizar ingredientes (Estrategia: Borrar todos y recrear)
    if (newIngredients) {
      // Borrar existentes
      const { error: deleteError } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('product_id', productId)
      
      if (deleteError) throw deleteError

      // Insertar nuevos
      if (newIngredients.length > 0) {
        const ingredientsToInsert = newIngredients.map(ing => ({
          product_id: productId,
          inventory_item_id: ing.inventory_item_id,
          quantity: ing.quantity,
          is_optional: ing.is_optional
        }))

        const { error: insertError } = await supabase
          .from('product_ingredients')
          .insert(ingredientsToInsert)

        if (insertError) throw insertError
      }
    }

    return productData
  },

  async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error
  },

  async duplicateProduct(productId: string) {
    // 1. Obtener el producto original con sus ingredientes
    const { data: original, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          inventory_item_id,
          quantity,
          is_optional
        )
      `)
      .eq('id', productId)
      .single()

    if (fetchError || !original) throw fetchError || new Error('Producto no encontrado')

    // 2. Preparar los datos del nuevo producto
    const newProduct = {
      name: `Copia de ${original.name}`,
      category: original.category,
      price: original.price,
      description: original.description,
      image_url: original.image_url,
      active: original.active,
      requires_protein_choice: original.requires_protein_choice,
      show_in_web: original.show_in_web
    }

    // 3. Preparar los ingredientes
    const newIngredients = original.ingredients || []

    // 4. Crear el nuevo producto usando el método existente
    return await this.createProduct(newProduct, newIngredients)
  }
}
