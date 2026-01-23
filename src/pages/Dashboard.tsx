import { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboard'
import { DashboardMetrics } from '../types'
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [salesChartData, setSalesChartData] = useState<any>(null)
  const [expensesChartData, setExpensesChartData] = useState<any>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [metricsData, salesData, expensesData, lowStockData] = await Promise.all([
        dashboardService.getMetrics(dateRange.start, dateRange.end),
        dashboardService.getSalesDataForChart(dateRange.start, dateRange.end),
        dashboardService.getExpensesDataForChart(dateRange.start, dateRange.end),
        dashboardService.getLowStockItems()
      ])

      setMetrics(metricsData)
      setLowStockItems(lowStockData)

      // Preparar datos para gráfico de ventas
      if (salesData && salesData.length > 0) {
        setSalesChartData({
          labels: salesData.map(item => item.hotdog_type),
          datasets: [{
            label: 'Ventas ($)',
            data: salesData.map(item => item.total),
            backgroundColor: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'],
            borderColor: ['#DC2626'],
            borderWidth: 1,
          }]
        })
      }

      // Preparar datos para gráfico de gastos
      if (expensesData && expensesData.length > 0) {
        setExpensesChartData({
          labels: expensesData.map(item => item.category),
          datasets: [{
            label: 'Gastos ($)',
            data: expensesData.map(item => item.total),
            backgroundColor: ['#EAB308', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
            borderWidth: 1,
          }]
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.total_sales || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.total_expenses || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ganancia Neta</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.net_profit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCartIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Socios (70%/30%)</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(metrics?.partner1_share || 0)} / {formatCurrency(metrics?.partner2_share || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Alertas de Stock Bajo</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {lowStockItems.map((item) => (
                    <li key={item.id}>
                      {item.name}: {item.current_stock} {item.unit} (mínimo: {item.min_threshold})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ventas por Tipo de Perro */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas por Tipo de Perro</h3>
          {salesChartData ? (
            <Bar data={salesChartData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Ventas por Tipo'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString('es-CO')
                    }
                  }
                }
              }
            }} />
          ) : (
            <div className="text-center text-gray-500 py-8">No hay datos de ventas</div>
          )}
        </div>

        {/* Gráfico de Gastos por Categoría */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gastos por Categoría</h3>
          {expensesChartData ? (
            <Doughnut data={expensesChartData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                },
                title: {
                  display: true,
                  text: 'Distribución de Gastos'
                }
              }
            }} />
          ) : (
            <div className="text-center text-gray-500 py-8">No hay datos de gastos</div>
          )}
        </div>
      </div>
    </div>
  )
}
