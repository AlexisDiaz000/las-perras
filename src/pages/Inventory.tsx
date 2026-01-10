
import { useState, useEffect } from 'react'
import { InventoryItem, InventoryMovement } from '../types'
import { inventoryService } from '../services/inventory'
import { INVENTORY_CATEGORIES, UNITS } from '../constants'
import { PlusIcon, MinusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/auth'

export default function Inventory() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [movementQuantity, setMovementQuantity] = useState('')
  const [movementReason, setMovementReason] = useState('')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    category: INVENTORY_CATEGORIES[0],
    unit: UNITS[0],
    current_stock: 0,
    min_threshold: 10,
    unit_cost: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, movementsData] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getMovements()
      ])
      setItems(itemsData)
      setMovements(movementsData)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async () => {
    try {
      await inventoryService.createItem(newItem as any)
      setShowAddItem(false)
      setNewItem({
        name: '',
        category: INVENTORY_CATEGORIES[0],
        unit: UNITS[0],
        current_stock: 0,
        min_threshold: 10,
        unit_cost: 0
      })
      loadData()
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Error al crear el item')
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    
    try {
      await inventoryService.updateItem(editingItem.id, editingItem)
      setEditingItem(null)
      loadData()
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Error al actualizar el item')
    }
  }

  const handleCreateMovement = async () => {
    if (!selectedItem || !movementQuantity || !movementReason) return

    try {
      await inventoryService.createMovement({
        item_id: selectedItem.id,
        type: movementType,
        quantity: parseFloat(movementQuantity),
        reason: movementReason,
        user_id: user?.id || ''
      })
      
      setShowMovement(false)
      setMovementQuantity('')
      setMovementReason('')
      setSelectedItem(null)
      loadData()
    } catch (error) {
      console.error('Error creating movement:', error)
      alert('Error al crear el movimiento')
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= item.min_threshold) {
      return { color: 'text-red-600 bg-red-100', text: 'Bajo' }
    } else if (item.current_stock <= item.min_threshold * 1.5) {
      return { color: 'text-yellow-600 bg-yellow-100', text: 'Medio' }
    } else {
      return { color: 'text-green-600 bg-green-100', text: 'Alto' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <button
          onClick={() => setShowAddItem(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Agregar Item
        </button>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mínimo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unit.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const status = getStockStatus(item)
              return (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.current_stock} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.min_threshold} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.unit_cost.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item)
                          setShowMovement(true)
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item)
                          setMovementType('out')
                          setShowMovement(true)
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal para Agregar Item */}
      {showAddItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nuevo Item</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {INVENTORY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Stock inicial"
                value={newItem.current_stock}
                onChange={(e) => setNewItem({...newItem, current_stock: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="number"
                placeholder="Stock mínimo"
                value={newItem.min_threshold}
                onChange={(e) => setNewItem({...newItem, min_threshold: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="number"
                placeholder="Costo unitario"
                value={newItem.unit_cost}
                onChange={(e) => setNewItem({...newItem, unit_cost: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateItem}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Movimiento */}
      {showMovement && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {movementType === 'in' ? 'Agregar' : 'Descontar'} Stock - {selectedItem.name}
            </h3>
            <div className="space-y-4">
              <input
                type="number"
                placeholder={`Cantidad a ${movementType === 'in' ? 'agregar' : 'descontar'}`}
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Motivo del movimiento"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMovement(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMovement}
                className={`px-4 py-2 rounded-md ${
                  movementType === 'in' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {movementType === 'in' ? 'Agregar' : 'Descontar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Item</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <select
                value={editingItem.category}
                onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {INVENTORY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={editingItem.unit}
                onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <input
                type="number"
                value={editingItem.min_threshold}
                onChange={(e) => setEditingItem({...editingItem, min_threshold: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="number"
                value={editingItem.unit_cost}
                onChange={(e) => setEditingItem({...editingItem, unit_cost: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateItem}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Movimientos */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Historial de Movimientos</h2>
          <ClockIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {movements.map((movement) => (
            <div key={movement.id} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{movement.item?.name}</div>
                <div className="text-sm text-gray-500">{movement.reason}</div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${
                  movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity} {movement.item?.unit}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(movement.created_at).toLocaleDateString('es-CO')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
