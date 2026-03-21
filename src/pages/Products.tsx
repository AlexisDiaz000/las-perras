import { useState, useEffect } from 'react'
import { Product, ProductIngredient, InventoryItem } from '../types'
import { productsService } from '../services/products'
import { inventoryService } from '../services/inventory'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, EyeIcon, EyeSlashIcon, PhotoIcon } from '@heroicons/react/24/outline'
import ImageCropper from '../components/ImageCropper'

const CATEGORIES = ['Perros Sencillos', 'Perros Especiales', 'Bebidas', 'Adicionales', 'Otros'] as const

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[0] as typeof CATEGORIES[number],
    requires_protein_choice: false,
    show_in_web: true,
    image_url: null as string | null,
    ingredients: [] as { inventory_item_id: string, quantity: string, is_optional: boolean }[]
  })

  // Sugerencia automática de inventario
  useEffect(() => {
    if (!formData.name || editingProduct) return

    // Buscar coincidencia exacta o muy cercana en inventario
    const match = inventoryItems.find(item => 
      item.name.toLowerCase() === formData.name.toLowerCase() ||
      item.name.toLowerCase().includes(formData.name.toLowerCase()) ||
      formData.name.toLowerCase().includes(item.name.toLowerCase())
    )

    if (match && formData.ingredients.length === 0) {
      // Sugerir agregar el ingrediente automáticamente
      // (Podríamos hacerlo automático o mostrar un botón, lo haré automático si está vacío para facilitar)
      setFormData(prev => ({
        ...prev,
        ingredients: [{
          inventory_item_id: match.id,
          quantity: '1', // Asumir 1 por defecto
          is_optional: false
        }]
      }))
    }
  }, [formData.name, inventoryItems, editingProduct])

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
      show_in_web: product.show_in_web ?? true,
      image_url: product.image_url || null,
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

    // Validación de costo $0
    if (formData.ingredients.length === 0) {
      if (!window.confirm('ADVERTENCIA: Estás creando un producto SIN RECETA.\n\nEsto significa que al venderlo:\n1. NO descontará nada del inventario.\n2. Su COSTO será $0 (ganancia falsa del 100%).\n\n¿Estás seguro de continuar sin enlazar ingredientes?')) {
        return
      }
    }

    try {
      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        requires_protein_choice: formData.requires_protein_choice,
        show_in_web: formData.show_in_web,
        image_url: formData.image_url,
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
        show_in_web: true,
        image_url: null,
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB for initial upload before crop)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImageToCrop(reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = (croppedBase64: string) => {
    setFormData({ ...formData, image_url: croppedBase64 })
    setImageToCrop(null)
  }

  const toggleVisibility = async (product: Product) => {
    try {
      await productsService.updateProduct(product.id, { show_in_web: !product.show_in_web }, [])
      loadData()
    } catch (error) {
      console.error('Error updating visibility:', error)
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
                <div className="flex items-center gap-2">
                  <h3 className="brand-heading text-xl">{product.name}</h3>
                  <button 
                    onClick={() => toggleVisibility(product)}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                    title={product.show_in_web ? "Visible en la web" : "Oculto en la web"}
                  >
                    {product.show_in_web ? (
                      <EyeIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-secondary-500" />
                    )}
                  </button>
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Image & Basic Info */}
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-2">
                      Foto del Producto (Opcional)
                    </label>
                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-white/10 rounded-lg hover:border-primary-500/50 transition-colors">
                      {formData.image_url ? (
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/50 group">
                          <img src={formData.image_url} alt="Vista previa" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, image_url: null })}
                              className="text-white bg-red-500/80 px-4 py-2 rounded-lg hover:bg-red-500 transition-colors text-sm"
                            >
                              Quitar Imagen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="text-center w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <PhotoIcon className="mx-auto h-12 w-12 text-secondary-500" />
                          <div className="mt-4 flex text-sm leading-6 text-secondary-400 justify-center">
                            <span className="font-semibold text-primary-400 hover:text-primary-300">Subir un archivo</span>
                            <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                          </div>
                          <p className="text-xs leading-5 text-secondary-500 mt-1">PNG, JPG, WEBP hasta 5MB</p>
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Nombre</label>
                    <input
                      required
                      className="brand-input w-full"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Descripción</label>
                    <textarea
                      className="brand-input w-full"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                {/* Right Column - Pricing & Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Precio</label>
                      <input
                        required
                        type="number"
                        className="brand-input w-full"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-secondary-300 mb-1">Categoría</label>
                      <select
                        className="brand-input w-full"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as any})}
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500 bg-transparent"
                        checked={formData.requires_protein_choice}
                        onChange={e => setFormData({...formData, requires_protein_choice: e.target.checked})}
                      />
                      <span className="text-sm text-secondary-200">Requiere elegir proteína</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500 bg-transparent"
                        checked={formData.show_in_web}
                        onChange={e => setFormData({...formData, show_in_web: e.target.checked})}
                      />
                      <div>
                        <span className="block text-sm text-secondary-200">Mostrar en Menú Web</span>
                        <span className="block text-xs text-secondary-400">Si está activo, los clientes podrán pedirlo.</span>
                      </div>
                    </label>
                  </div>

                  {/* Recipe Builder */}
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="brand-heading text-lg text-primary-400">Receta (Ingredientes)</h3>
                      <button type="button" onClick={addIngredientRow} className="text-xs bg-primary-500/20 text-primary-300 px-3 py-1 rounded hover:bg-primary-500/30">
                        + Agregar
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {formData.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <select
                            required
                            className="brand-input flex-1 text-sm py-1 px-2"
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
                            className="brand-input w-20 text-sm py-1 px-2"
                            value={ing.quantity}
                            onChange={e => updateIngredientRow(idx, 'quantity', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeIngredientRow(idx)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      {formData.ingredients.length === 0 && (
                        <p className="text-center text-sm text-secondary-500 py-2">No hay ingredientes agregados.</p>
                      )}
                    </div>
                  </div>
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
      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
          aspect={4/3}
          cropShape="rect"
        />
      )}
    </div>
  )
}
