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
            backgroundColor: ['#F4F4F5', '#E4E4E7', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B'],
            borderColor: ['#FAFAFA'],
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
            backgroundColor: ['#F4F4F5', '#E4E4E7', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B'],
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="brand-heading text-3xl">Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="brand-input sm:w-auto"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="brand-input sm:w-auto"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="brand-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-secondary-200" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Ventas Totales</p>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(metrics?.total_sales || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="brand-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-secondary-200" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Gastos Totales</p>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(metrics?.total_expenses || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="brand-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-secondary-200" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Ganancia Neta</p>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(metrics?.net_profit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="brand-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCartIcon className="h-8 w-8 text-secondary-200" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Socios (70%/30%)</p>
              <p className="text-lg font-bold text-secondary-50">
                {formatCurrency(metrics?.partner1_share || 0)} / {formatCurrency(metrics?.partner2_share || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {lowStockItems.length > 0 && (
        <div className="brand-card p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-secondary-200" />
            <div className="ml-3">
              <h3 className="text-xs font-semibold text-secondary-200 uppercase tracking-widest">Alertas de Stock Bajo</h3>
              <div className="mt-2 text-sm text-secondary-200">
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
        <div className="brand-card p-6">
          <h3 className="brand-heading text-xl mb-4">Ventas por Tipo</h3>
          {salesChartData ? (
            <Bar data={salesChartData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: { color: '#F4F4F5' as any }
                },
                title: {
                  display: true,
                  text: 'Ventas por Tipo'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(255,255,255,0.08)' as any },
                  ticks: {
                    color: '#D4D4D8' as any,
                    callback: function(value) {
                      return '$' + value.toLocaleString('es-CO')
                    }
                  }
                },
                x: {
                  ticks: { color: '#D4D4D8' as any },
                  grid: { color: 'rgba(255,255,255,0.04)' as any },
                }
              }
            }} />
          ) : (
            <div className="text-center text-secondary-400 py-8">No hay datos de ventas</div>
          )}
        </div>

        {/* Gráfico de Gastos por Categoría */}
        <div className="brand-card p-6">
          <h3 className="brand-heading text-xl mb-4">Gastos por Categoría</h3>
          {expensesChartData ? (
            <Doughnut data={expensesChartData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                  labels: { color: '#F4F4F5' as any }
                },
                title: {
                  display: true,
                  text: 'Distribución de Gastos'
                }
              }
            }} />
          ) : (
            <div className="text-center text-secondary-400 py-8">No hay datos de gastos</div>
          )}
        </div>
      </div>
    </div>
  )
}
