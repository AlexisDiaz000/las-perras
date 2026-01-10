import { useState, useEffect } from 'react'
import { Expense } from '../types'
import { expensesService } from '../services/expenses'
import { EXPENSE_CATEGORIES } from '../constants'
import { useAuthStore } from '../stores/auth'
import { PlusIcon, PencilIcon, TrashIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'

export default function Expenses() {
  const { user } = useAuthStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    receipt_url: ''
  })

  useEffect(() => {
    loadData()
  }, [filterCategory, filterDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await expensesService.getExpenses(filterDate, filterDate, filterCategory)
      setExpenses(data)
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async () => {
    try {
      await expensesService.createExpense({
        ...newExpense,
        user_id: user?.id || ''
      })
      setShowAddExpense(false)
      setNewExpense({
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        category: EXPENSE_CATEGORIES[0],
        amount: 0,
        receipt_url: ''
      })
      loadData()
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Error al crear el gasto')
    }
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return
    
    try {
      await expensesService.updateExpense(editingExpense.id, editingExpense)
      setEditingExpense(null)
      loadData()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Error al actualizar el gasto')
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este gasto?')) return
    
    try {
      await expensesService.deleteExpense(id)
      loadData()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error al eliminar el gasto')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // En una implementación real, aquí se subiría el archivo a Supabase Storage
      // Por ahora, simulamos la URL
      const simulatedUrl = `https://example.com/receipts/${file.name}`
      setNewExpense({...newExpense, receipt_url: simulatedUrl})
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500">Total: {formatCurrency(totalExpenses)}</p>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Agregar Gasto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todas las categorías</option>
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCategory('')
                setFilterDate('')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Gastos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(expense.expense_date).toLocaleDateString('es-CO')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {expense.receipt_url ? (
                    <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      Ver Comprobante
                    </a>
                  ) : (
                    <span className="text-gray-400">Sin comprobante</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.user?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay gastos registrados
          </div>
        )}
      </div>

      {/* Modal para Agregar Gasto */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nuevo Gasto</h3>
            <div className="space-y-4">
              <input
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Monto"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (opcional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                {newExpense.receipt_url && (
                  <p className="text-sm text-green-600 mt-1">Comprobante cargado</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddExpense(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateExpense}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Gasto */}
      {editingExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Gasto</h3>
            <div className="space-y-4">
              <input
                type="date"
                value={editingExpense.expense_date}
                onChange={(e) => setEditingExpense({...editingExpense, expense_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={editingExpense.description}
                onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <select
                value={editingExpense.category}
                onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Monto"
                value={editingExpense.amount}
                onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateExpense}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
