import { useState } from 'react'
import { salesService } from '../services/sales'
import { expensesService } from '../services/expenses'
import { inventoryService } from '../services/inventory'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const exportToCSV = async (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${startDate}_${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportSales = async () => {
    if (!startDate || !endDate) {
      alert('Por favor seleccione un rango de fechas')
      return
    }

    setLoading(true)
    try {
      const sales = await salesService.getSales(startDate, endDate)
      const salesData = sales.map(sale => ({
        fecha: new Date(sale.created_at).toLocaleDateString('es-CO'),
        total: sale.total_amount,
        metodo_pago: sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta',
        vendedor: sale.seller?.name || 'Desconocido'
      }))
      exportToCSV(salesData, 'ventas')
    } catch (error) {
      console.error('Error exporting sales:', error)
      alert('Error al exportar ventas')
    } finally {
      setLoading(false)
    }
  }

  const exportExpenses = async () => {
    if (!startDate || !endDate) {
      alert('Por favor seleccione un rango de fechas')
      return
    }

    setLoading(true)
    try {
      const expenses = await expensesService.getExpenses(startDate, endDate)
      const expensesData = expenses.map(expense => ({
        fecha: new Date(expense.expense_date).toLocaleDateString('es-CO'),
        descripcion: expense.description,
        categoria: expense.category,
        monto: expense.amount,
        usuario: expense.user?.name || 'Desconocido'
      }))
      exportToCSV(expensesData, 'gastos')
    } catch (error) {
      console.error('Error exporting expenses:', error)
      alert('Error al exportar gastos')
    } finally {
      setLoading(false)
    }
  }

  const exportInventory = async () => {
    setLoading(true)
    try {
      const items = await inventoryService.getItems()
      const inventoryData = items.map(item => ({
        producto: item.name,
        categoria: item.category,
        stock_actual: item.current_stock,
        stock_minimo: item.min_threshold,
        unidad: item.unit,
        costo_unitario: item.unit_cost
      }))
      exportToCSV(inventoryData, 'inventario')
    } catch (error) {
      console.error('Error exporting inventory:', error)
      alert('Error al exportar inventario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Rango de Fechas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Opciones de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <DocumentArrowDownIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Exportar Ventas</h3>
              <p className="text-sm text-gray-500">Descargar reporte de ventas en CSV</p>
            </div>
          </div>
          <button
            onClick={exportSales}
            disabled={loading || !startDate || !endDate}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Exportando...' : 'Exportar Ventas'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <DocumentArrowDownIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Exportar Gastos</h3>
              <p className="text-sm text-gray-500">Descargar reporte de gastos en CSV</p>
            </div>
          </div>
          <button
            onClick={exportExpenses}
            disabled={loading || !startDate || !endDate}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Exportando...' : 'Exportar Gastos'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <DocumentArrowDownIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Exportar Inventario</h3>
              <p className="text-sm text-gray-500">Descargar estado actual del inventario</p>
            </div>
          </div>
          <button
            onClick={exportInventory}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Exportando...' : 'Exportar Inventario'}
          </button>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Formatos de Exportación</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Los reportes se exportan en formato CSV compatible con Excel</p>
          <p>• Los archivos incluyen todos los datos del período seleccionado</p>
          <p>• Use las fechas para filtrar los datos que desea exportar</p>
          <p>• Los reportes de inventario muestran el estado actual sin filtro de fechas</p>
        </div>
      </div>
    </div>
  )
}