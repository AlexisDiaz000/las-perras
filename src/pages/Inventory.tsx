
import { useState, useEffect } from 'react'
import { InventoryItem, InventoryMovement } from '../types'
import { inventoryService } from '../services/inventory'
import { INVENTORY_CATEGORIES, UNITS } from '../constants'
import { PlusIcon, MinusIcon, PencilIcon, TrashIcon, ClockIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/auth'

export default function Inventory() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  
  // New States for Waste and Stocktake
  const [showWasteModal, setShowWasteModal] = useState(false)
  const [showStocktakeModal, setShowStocktakeModal] = useState(false)
  const [stocktakeData, setStocktakeData] = useState<Record<string, string>>({})
  const [wasteData, setWasteData] = useState({ itemId: '', quantity: '', reason: '' })

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [movementQuantity, setMovementQuantity] = useState('')
  const [movementReason, setMovementReason] = useState('')
  const [editingItem, setEditingItem] = useState<{
    id: string
    name: string
    category: typeof INVENTORY_CATEGORIES[number]
    unit: typeof UNITS[number]
    current_stock: number
    min_threshold: string
    unit_cost: string
  } | null>(null)
  const [newItem, setNewItem] = useState<{
    name: string
    category: typeof INVENTORY_CATEGORIES[number]
    unit: typeof UNITS[number]
    current_stock: string
    min_threshold: string
    unit_cost: string
    // Campo auxiliar para cálculo automático
    total_cost_input: string
  }>({
    name: '',
    category: INVENTORY_CATEGORIES[0],
    unit: UNITS[0],
    current_stock: '',
    min_threshold: '',
    unit_cost: '',
    total_cost_input: ''
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
      await inventoryService.createItem({
        ...newItem,
        current_stock: parseFloat(newItem.current_stock) || 0,
        min_threshold: parseFloat(newItem.min_threshold) || 0,
        unit_cost: parseFloat(newItem.unit_cost) || 0
      } as any)
      setShowAddItem(false)
      setNewItem({
        name: '',
        category: INVENTORY_CATEGORIES[0],
        unit: UNITS[0],
        current_stock: '',
        min_threshold: '',
        unit_cost: '',
        total_cost_input: ''
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
      await inventoryService.updateItem(editingItem.id, {
        ...editingItem,
        min_threshold: parseFloat(editingItem.min_threshold) || 0,
        unit_cost: parseFloat(editingItem.unit_cost) || 0
      } as any)
      setEditingItem(null)
      loadData()
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Error al actualizar el item')
    }
  }

  const handleRegisterWaste = async () => {
    if (!wasteData.itemId || !wasteData.quantity || !wasteData.reason) return

    try {
      await inventoryService.registerWaste(
        wasteData.itemId,
        parseFloat(wasteData.quantity),
        wasteData.reason,
        user?.id || ''
      )
      setShowWasteModal(false)
      setWasteData({ itemId: '', quantity: '', reason: '' })
      loadData()
      alert('Merma registrada exitosamente')
    } catch (error) {
      console.error('Error registering waste:', error)
      alert('Error al registrar la merma')
    }
  }

  const handleStocktake = async () => {
    if (!window.confirm('¿Está seguro de realizar el cierre de inventario? Esto generará movimientos de ajuste automáticos.')) return

    try {
      const adjustments = items.map(item => {
        const realStock = stocktakeData[item.id] ? parseFloat(stocktakeData[item.id]) : item.current_stock
        return {
          itemId: item.id,
          systemStock: item.current_stock,
          realStock,
          userId: user?.id || ''
        }
      }).filter(adj => adj.realStock !== adj.systemStock) // Solo procesar diferencias

      if (adjustments.length === 0) {
        alert('No hay diferencias para ajustar.')
        setShowStocktakeModal(false)
        return
      }

      await inventoryService.processStocktake(adjustments)
      setShowStocktakeModal(false)
      setStocktakeData({})
      loadData()
      alert(`Se han generado ${adjustments.length} ajustes de inventario exitosamente.`)
    } catch (error) {
      console.error('Error processing stocktake:', error)
      alert('Error al procesar el cierre de inventario')
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
      return { 
        color: 'text-red-800 bg-red-100 border-red-200 dark:text-red-200 dark:bg-red-500/10 dark:border-red-500/20', 
        text: 'Bajo' 
      }
    } else if (item.current_stock <= item.min_threshold * 1.5) {
      return { 
        color: 'text-yellow-800 bg-yellow-100 border-yellow-200 dark:text-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20', 
        text: 'Medio' 
      }
    } else {
      return { 
        color: 'text-green-800 bg-green-100 border-green-200 dark:text-green-200 dark:bg-green-500/10 dark:border-green-500/20', 
        text: 'Alto' 
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="brand-heading text-3xl">Inventario</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowWasteModal(true)}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            Registrar Merma
          </button>
          <button
            onClick={() => setShowStocktakeModal(true)}
            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
            Cierre de Inventario
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="brand-button"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Item
          </button>
        </div>
      </div>

      {/* Modal para Registrar Merma */}
      {showWasteModal && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96">
            <div className="brand-card p-5">
              <h3 className="brand-heading text-xl mb-4 text-red-500 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
                Registrar Merma
              </h3>
              <div className="space-y-4">
                <select
                  value={wasteData.itemId}
                  onChange={(e) => setWasteData({...wasteData, itemId: e.target.value})}
                  className="brand-input"
                >
                  <option value="">Seleccione un producto</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.current_stock} {item.unit})</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Cantidad perdida"
                  value={wasteData.quantity}
                  onChange={(e) => setWasteData({...wasteData, quantity: e.target.value})}
                  className="brand-input"
                />
                <input
                  type="text"
                  placeholder="Motivo (ej. Caducado, Caída, Quemado)"
                  value={wasteData.reason}
                  onChange={(e) => setWasteData({...wasteData, reason: e.target.value})}
                  className="brand-input"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowWasteModal(false)}
                  className="px-4 py-2 text-secondary-200 hover:text-secondary-50 uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegisterWaste}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold uppercase tracking-wider"
                >
                  Registrar Pérdida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Cierre de Inventario (Stocktake) */}
      {showStocktakeModal && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="brand-card p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="brand-heading text-2xl flex items-center text-blue-400">
                <ClipboardDocumentCheckIcon className="h-8 w-8 mr-3" />
                Cierre de Inventario Físico
              </h3>
              <button onClick={() => setShowStocktakeModal(false)} className="text-secondary-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-300 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-300 uppercase">Sistema</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-300 uppercase">Real (Físico)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-300 uppercase">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {items.map((item) => {
                    const realVal = stocktakeData[item.id] !== undefined ? parseFloat(stocktakeData[item.id]) : item.current_stock
                    const diff = realVal - item.current_stock
                    return (
                      <tr key={item.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-medium text-secondary-50">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-secondary-300">{item.current_stock} {item.unit}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white w-24 focus:border-blue-500 outline-none"
                            placeholder={item.current_stock.toString()}
                            value={stocktakeData[item.id] || ''}
                            onChange={(e) => setStocktakeData({...stocktakeData, [item.id]: e.target.value})}
                          />
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold ${diff < 0 ? 'text-red-400' : diff > 0 ? 'text-green-400' : 'text-secondary-400'}`}>
                          {diff > 0 ? '+' : ''}{diff} {item.unit}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowStocktakeModal(false)}
                className="px-6 py-2 text-secondary-200 hover:text-secondary-50 uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleStocktake}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold uppercase tracking-wider"
              >
                Confirmar y Ajustar Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Inventario */}
      <div className="brand-card overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-transparent">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Mínimo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Costo Unit.</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => {
              const status = getStockStatus(item)
              return (
                <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-secondary-50">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-secondary-300">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-secondary-50">{item.current_stock} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-secondary-300">{item.min_threshold} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-secondary-50">
                    ${item.unit_cost.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem({
                          ...item,
                          min_threshold: String(item.min_threshold),
                          unit_cost: String(item.unit_cost)
                        })}
                        className="text-gray-400 hover:text-gray-600 dark:text-secondary-200 dark:hover:text-secondary-50 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item)
                          setShowMovement(true)
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:text-secondary-200 dark:hover:text-secondary-50 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item)
                          setMovementType('out')
                          setShowMovement(true)
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:text-secondary-200 dark:hover:text-secondary-50 transition-colors"
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
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96">
            <div className="brand-card p-5">
            <h3 className="brand-heading text-2xl mb-4">Agregar Nuevo Item</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="brand-input"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value as typeof INVENTORY_CATEGORIES[number]})}
                className="brand-input"
              >
                {INVENTORY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value as typeof UNITS[number]})}
                className="brand-input"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Stock inicial"
                value={newItem.current_stock}
                onChange={(e) => setNewItem({...newItem, current_stock: e.target.value})}
                className="brand-input"
              />
              <input
                type="number"
                placeholder="Stock mínimo"
                value={newItem.min_threshold}
                onChange={(e) => setNewItem({...newItem, min_threshold: e.target.value})}
                className="brand-input"
              />
              
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <label className="block text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                  Costo del Inventario Inicial
                </label>
                
                <div>
                  <input
                    type="number"
                    placeholder="Valor total pagado por el stock inicial"
                    value={newItem.total_cost_input}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0
                      const stock = parseFloat(newItem.current_stock) || 0
                      const unitCost = stock > 0 ? total / stock : 0
                      
                      setNewItem({
                        ...newItem, 
                        total_cost_input: e.target.value,
                        unit_cost: unitCost > 0 ? unitCost.toFixed(2) : '' // Guardar con 2 decimales si es posible
                      })
                    }}
                    className="brand-input mb-1"
                  />
                  <p className="text-xs text-secondary-400">
                    Ej: Si compraste un paquete de 1000g a $20.000, pon 20000.
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                  <span className="text-secondary-300">Costo Unitario Calculado:</span>
                  <span className="font-bold text-primary-400">
                    ${newItem.unit_cost ? parseFloat(newItem.unit_cost).toLocaleString('es-CO') : '0'} / {newItem.unit || 'unidad'}
                  </span>
                </div>
                
                {/* Input oculto o de solo lectura para validación manual si el usuario quiere ajustar decimales */}
                <div className="flex items-center gap-2 mt-2">
                   <label className="text-xs text-secondary-500 whitespace-nowrap">Ajuste manual unitario:</label>
                   <input
                    type="number"
                    placeholder="0.00"
                    value={newItem.unit_cost}
                    onChange={(e) => setNewItem({...newItem, unit_cost: e.target.value})}
                    className="bg-transparent border-b border-white/10 text-right text-xs text-secondary-300 w-20 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 text-secondary-200 hover:text-secondary-50 uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateItem}
                className="brand-button"
              >
                Crear
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Movimiento */}
      {showMovement && selectedItem && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96">
            <div className="brand-card p-5">
            <h3 className="brand-heading text-xl mb-4">
              {movementType === 'in' ? 'Agregar' : 'Descontar'} Stock - {selectedItem.name}
            </h3>
            <div className="space-y-4">
              <input
                type="number"
                placeholder={`Cantidad a ${movementType === 'in' ? 'agregar' : 'descontar'}`}
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                className="brand-input"
              />
              <input
                type="text"
                placeholder="Motivo del movimiento"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                className="brand-input"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMovement(false)}
                className="px-4 py-2 text-secondary-200 hover:text-secondary-50 uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMovement}
                className="brand-button"
              >
                {movementType === 'in' ? 'Agregar' : 'Descontar'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96">
            <div className="brand-card p-5">
            <h3 className="brand-heading text-2xl mb-4">Editar Item</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="brand-input"
              />
              <select
                value={editingItem.category}
                onChange={(e) => setEditingItem({...editingItem, category: e.target.value as typeof INVENTORY_CATEGORIES[number]})}
                className="brand-input"
              >
                {INVENTORY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={editingItem.unit}
                onChange={(e) => setEditingItem({...editingItem, unit: e.target.value as typeof UNITS[number]})}
                className="brand-input"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <input
                type="number"
                value={editingItem.min_threshold}
                onChange={(e) => setEditingItem({...editingItem, min_threshold: e.target.value})}
                className="brand-input"
              />
              <input
                type="number"
                value={editingItem.unit_cost}
                onChange={(e) => setEditingItem({...editingItem, unit_cost: e.target.value})}
                className="brand-input"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-secondary-200 hover:text-secondary-50 uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateItem}
                className="brand-button"
              >
                Actualizar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Movimientos */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="brand-heading text-xl">Historial de Movimientos</h2>
          <ClockIcon className="h-5 w-5 text-secondary-400" />
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {movements.map((movement) => (
            <div key={movement.id} className="flex justify-between items-center p-3 border border-white/10 rounded-lg bg-white/5">
              <div>
                <div className="font-medium text-secondary-50">{movement.item?.name}</div>
                <div className="text-sm text-secondary-300">{movement.reason}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-secondary-50">
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity} {movement.item?.unit}
                </div>
                <div className="text-xs text-secondary-400">
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
