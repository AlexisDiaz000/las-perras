import { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboard'
import { getColombiaDate } from '../lib/dateUtils'
import { DashboardMetrics } from '../types'
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [salesChartData, setSalesChartData] = useState<any[]>([])
  const [expensesChartData, setExpensesChartData] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: getColombiaDate(),
    end: getColombiaDate()
  })

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'))
        }
      })
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    loadData()
  }, [dateRange, isDark])

  // Paletas de colores
  // Paleta sobria solicitada: #2E3D50, #8894A2, #C4762B, #D7B791, #FEEECD
  // Ajuste: #FEEECD es muy claro para fondos blancos, lo usaremos con precaución o borde.
  const SOBER_PALETTE = ['#2E3D50', '#C4762B', '#8894A2', '#D7B791', '#A69279'] // Reemplacé el crema muy claro por un tierra más visible
  
  const chartColors = isDark ? {
    text: '#F4F4F5',
    grid: 'rgba(255,255,255,0.08)',
    bars: SOBER_PALETTE,
    pie: SOBER_PALETTE
  } : {
    text: '#1F2937',
    grid: 'rgba(0,0,0,0.1)',
    bars: SOBER_PALETTE,
    pie: SOBER_PALETTE
  }

  const loadData = async () => {
    try {
      setLoading(true)
      // Ajustar fechas para incluir el rango completo del día en Colombia (UTC-5)
      // Esto asegura que las ventas de la noche (que en UTC son el día siguiente) se incluyan
      const startWithTime = `${dateRange.start}T00:00:00-05:00`
      const endWithTime = `${dateRange.end}T23:59:59-05:00`

      const [metricsData, salesData, expensesData, lowStockData] = await Promise.all([
        dashboardService.getMetrics(startWithTime, endWithTime),
        dashboardService.getSalesDataForChart(startWithTime, endWithTime),
        dashboardService.getExpensesDataForChart(startWithTime, endWithTime),
        dashboardService.getLowStockItems()
      ])

      setMetrics(metricsData)
      setLowStockItems(lowStockData)

      // Preparar datos para gráfico de ventas
      if (salesData && salesData.length > 0) {
        setSalesChartData(salesData.map(item => ({
          name: item.hotdog_type,
          value: item.total
        })))
      } else {
        setSalesChartData([])
      }

      // Preparar datos para gráfico de gastos
      if (expensesData && expensesData.length > 0) {
        setExpensesChartData(expensesData.map(item => ({
          name: item.category,
          value: item.total
        })))
      } else {
        setExpensesChartData([])
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <ArchiveBoxIcon className="h-8 w-8 text-secondary-200" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Costo Insumos</p>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(metrics?.cogs || 0)}
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
        <div className="brand-card p-6 flex flex-col h-[400px]">
          <h3 className="brand-heading text-xl mb-4">Ventas por Tipo</h3>
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={chartColors.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke={chartColors.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#E5E7EB',
                    borderRadius: '8px',
                    color: isDark ? '#F4F4F5' : '#1F2937'
                  }}
                  itemStyle={{
                    color: isDark ? '#F4F4F5' : '#1F2937'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {salesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors.bars[index % chartColors.bars.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary-400">
              No hay datos de ventas
            </div>
          )}
        </div>

        {/* Gráfico de Gastos por Categoría */}
        <div className="brand-card p-6 flex flex-col h-[400px]">
          <h3 className="brand-heading text-xl mb-4">Gastos por Categoría</h3>
          {expensesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors.pie[index % chartColors.pie.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#E5E7EB',
                    borderRadius: '8px',
                    color: isDark ? '#F4F4F5' : '#1F2937'
                  }}
                  itemStyle={{
                    color: isDark ? '#F4F4F5' : '#1F2937'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ color: chartColors.text }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary-400">
              No hay datos de gastos
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
