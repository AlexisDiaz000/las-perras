import { useState } from 'react'
import { dashboardService } from '../services/dashboard'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Por favor seleccione ambas fechas')
      return
    }

    try {
      setLoading(true)
      const [metrics, salesData, expensesData] = await Promise.all([
        dashboardService.getMetrics(startDate, endDate),
        dashboardService.getSalesDataForChart(startDate, endDate),
        dashboardService.getExpensesDataForChart(startDate, endDate)
      ])

      setReportData({
        metrics,
        salesData,
        expensesData
      })
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const { metrics, salesData, expensesData } = reportData

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Resumen Financiero\n"
    csvContent += `Ventas Totales,${metrics.total_sales}\n`
    csvContent += `Gastos Totales,${metrics.total_expenses}\n`
    csvContent += `Ganancia Neta,${metrics.net_profit}\n`
    csvContent += `Socio 1 (70%),${metrics.partner1_share}\n`
    csvContent += `Socio 2 (30%),${metrics.partner2_share}\n\n`

    csvContent += "Ventas por Tipo de Perro\n"
    csvContent += "Tipo,Cantidad,Total\n"
    salesData.forEach((item: any) => {
      csvContent += `${item.hotdog_type},${item.count},${item.total}\n`
    })

    csvContent += "\nGastos por Categoría\n"
    csvContent += "Categoría,Total\n"
    expensesData.forEach((item: any) => {
      csvContent += `${item.category},${item.total}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `reporte_${startDate}_a_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const salesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Ventas por Tipo de Perro Caliente',
      },
    },
  }

  const expensesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Gastos por Categoría',
      },
    },
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-2 text-sm text-gray-600">Genere reportes financieros y exporte los datos</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-500">Ventas Totales</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.metrics.total_sales)}
              </p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-500">Gastos Totales</h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.metrics.total_expenses)}
              </p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-500">Ganancia Neta</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.metrics.net_profit)}
              </p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-500">Socio 1 (70%)</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(reportData.metrics.partner1_profit)}
              </p>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <h3 className="text-sm font-medium text-gray-500">Socio 2 (30%)</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(reportData.metrics.partner2_profit)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <Bar
                options={salesChartOptions}
                data={{
                  labels: reportData.salesData.map((item: any) => item.hotdog_type),
                  datasets: [
                    {
                      label: 'Cantidad',
                      data: reportData.salesData.map((item: any) => item.count),
                      backgroundColor: 'rgba(220, 38, 38, 0.8)',
                    },
                    {
                      label: 'Total',
                      data: reportData.salesData.map((item: any) => item.total),
                      backgroundColor: 'rgba(234, 179, 8, 0.8)',
                    },
                  ],
                }}
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <Bar
                options={expensesChartOptions}
                data={{
                  labels: reportData.expensesData.map((item: any) => item.category),
                  datasets: [
                    {
                      label: 'Total',
                      data: reportData.expensesData.map((item: any) => item.total),
                      backgroundColor: [
                        'rgba(220, 38, 38, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                      ],
                    },
                  ],
                }}
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700"
            >
              Exportar a CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
