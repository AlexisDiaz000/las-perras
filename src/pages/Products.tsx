import { useState, useEffect } from 'react'
import { Product, ProductIngredient, InventoryItem } from '../types'
import { productsService } from '../services/products'
import { inventoryService } from '../services/inventory'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const CATEGORIES = ['Perros Sencillos', 'Perros Especiales', 'Bebidas', 'Adicionales', 'Otros'] as const

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[0] as typeof CATEGORIES[number],
    requires_protein_choice: false,
    ingredients: [] as { inventory_item_id: string, quantity: string, is_optional: boolean }[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, inventoryData] = await Promise.all([
        productsService.getProducts(),
        inventoryService.getItems()
      ])
      setProducts(productsData)
      setInventoryItems(inventoryData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      requires_protein_choice: product.requires_protein_choice,
      ingredients: product.ingredients?.map(ing => ({
        inventory_item_id: ing.inventory_item_id,
        quantity: ing.quantity.toString(),
        is_optional: ing.is_optional
      })) || []
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        requires_protein_choice: formData.requires_protein_choice,
        active: true
      }

      const ingredientsPayload = formData.ingredients.map(ing => ({
        inventory_item_id: ing.inventory_item_id,
        quantity: parseFloat(ing.quantity),
        is_optional: ing.is_optional
      }))

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, productPayload, ingredientsPayload)
      } else {
        await productsService.createProduct(productPayload, ingredientsPayload)
      }

      setShowForm(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category: CATEGORIES[0],
        requires_protein_choice: false,
        ingredients: []
      })
      loadData()
      alert(editingProduct ? 'Producto actualizado' : 'Producto creado exitosamente')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error al guardar el producto')
    }
  }

  const addIngredientRow = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { inventory_item_id: '', quantity: '', is_optional: false }]
    })
  }

  const removeIngredientRow = (index: number) => {
    const newIngredients = [...formData.ingredients]
    newIngredients.splice(index, 1)
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const updateIngredientRow = (index: number, field: string, value: any) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    try {
      await productsService.deleteProduct(id)
      loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar el producto')
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando productos...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="brand-heading text-3xl">Gestión de Productos</h1>
          <p className="text-secondary-300 mt-1">Administra el menú y sus recetas</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowForm(true) }} className="brand-button">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="brand-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="brand-heading text-xl">{product.name}</h3>
                <span className="text-primary-400 font-bold">${product.price.toLocaleString('es-CO')}</span>
              </div>
              <p className="text-sm text-secondary-300 mb-4">{product.category}</p>
              
              <div className="bg-black/20 rounded p-3 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-secondary-400 mb-2">Receta:</h4>
                {product.ingredients && product.ingredients.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {product.ingredients.map(ing => (
                      <li key={ing.id} className="flex justify-between text-secondary-200">
                        <span>{ing.inventory_item?.name}</span>
                        <span>{ing.quantity} {ing.inventory_item?.unit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-secondary-500 italic">Sin ingredientes definidos</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-white/10">
              <button onClick={() => handleEdit(product)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-full">
                <PencilIcon className="h-5 w-5" />
              </button>
              <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="brand-card w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="brand-heading text-2xl">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setShowForm(false)} className="text-secondary-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Nombre</label>
                  <input
                    required
                    className="brand-input"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Precio</label>
                  <input
                    required
                    type="number"
                    className="brand-input"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Categoría</label>
                  <select
                    className="brand-input"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="flex items-center">
                   <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                      checked={formData.requires_protein_choice}
                      onChange={e => setFormData({...formData, requires_protein_choice: e.target.checked})}
                    />
                    <span className="text-sm text-secondary-200">¿Requiere elegir proteína?</span>
                   </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Descripción</label>
                <textarea
                  className="brand-input"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Recipe Builder */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="brand-heading text-lg text-primary-400">Receta (Ingredientes)</h3>
                  <button type="button" onClick={addIngredientRow} className="text-xs bg-primary-500/20 text-primary-300 px-3 py-1 rounded hover:bg-primary-500/30">
                    + Agregar Ingrediente
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <select
                        required
                        className="brand-input flex-1"
                        value={ing.inventory_item_id}
                        onChange={e => updateIngredientRow(idx, 'inventory_item_id', e.target.value)}
                      >
                        <option value="">Seleccionar insumo...</option>
                        {inventoryItems.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                        ))}
                      </select>
                      <input
                        required
                        type="number"
                        placeholder="Cant."
                        className="brand-input w-24"
                        value={ing.quantity}
                        onChange={e => updateIngredientRow(idx, 'quantity', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(idx)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {formData.ingredients.length === 0 && (
                    <p className="text-center text-sm text-secondary-500 py-2">No hay ingredientes agregados a la receta.</p>
                  )}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-white/10 flex justify-end space-x-4">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 text-secondary-300 hover:text-white uppercase tracking-widest text-sm">
                Cancelar
              </button>
              <button onClick={handleSubmit} className="brand-button px-8">
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
