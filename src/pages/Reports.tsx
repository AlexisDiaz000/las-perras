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
      
      const startWithTime = `${startDate}T00:00:00-05:00`
      const endWithTime = `${endDate}T23:59:59-05:00`

      const [metrics, salesData, expensesData] = await Promise.all([
        dashboardService.getMetrics(startWithTime, endWithTime),
        dashboardService.getSalesDataForChart(startWithTime, endWithTime),
        dashboardService.getExpensesDataForChart(startWithTime, endWithTime)
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
        labels: { color: '#F4F4F5' as any }
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
        labels: { color: '#F4F4F5' as any }
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
        <h1 className="brand-heading text-3xl">Reportes</h1>
        <p className="mt-2 text-sm text-secondary-300">Genere reportes financieros y exporte los datos</p>
      </div>

      {/* Filter Section */}
      <div className="brand-card p-6 mb-6">
        <h2 className="brand-heading text-xl mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary-200 mb-2 uppercase tracking-widest">
              Fecha Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="brand-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary-200 mb-2 uppercase tracking-widest">
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="brand-input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="brand-button w-full"
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
            <div className="brand-card p-5">
              <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Ventas Totales</h3>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(reportData.metrics.total_sales)}
              </p>
            </div>
            <div className="brand-card p-5">
              <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Gastos Totales</h3>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(reportData.metrics.total_expenses)}
              </p>
            </div>
            <div className="brand-card p-5">
              <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Ganancia Neta</h3>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(reportData.metrics.net_profit)}
              </p>
            </div>
            <div className="brand-card p-5">
              <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Socio 1 (70%)</h3>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(reportData.metrics.partner1_share)}
              </p>
            </div>
            <div className="brand-card p-5">
              <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Socio 2 (30%)</h3>
              <p className="text-2xl font-bold text-secondary-50">
                {formatCurrency(reportData.metrics.partner2_share)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="brand-card p-6">
              <Bar
                options={salesChartOptions}
                data={{
                  labels: reportData.salesData.map((item: any) => item.hotdog_type),
                  datasets: [
                    {
                      label: 'Cantidad',
                      data: reportData.salesData.map((item: any) => item.count),
                      backgroundColor: 'rgba(244, 244, 245, 0.85)',
                    },
                    {
                      label: 'Total',
                      data: reportData.salesData.map((item: any) => item.total),
                      backgroundColor: 'rgba(161, 161, 170, 0.85)',
                    },
                  ],
                }}
              />
            </div>
            
            <div className="brand-card p-6">
              <Bar
                options={expensesChartOptions}
                data={{
                  labels: reportData.expensesData.map((item: any) => item.category),
                  datasets: [
                    {
                      label: 'Total',
                      data: reportData.expensesData.map((item: any) => item.total),
                      backgroundColor: [
                        'rgba(244, 244, 245, 0.85)',
                        'rgba(228, 228, 231, 0.85)',
                        'rgba(212, 212, 216, 0.85)',
                        'rgba(161, 161, 170, 0.85)',
                        'rgba(113, 113, 122, 0.85)',
                        'rgba(82, 82, 91, 0.85)',
                      ],
                    },
                  ],
                }}
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="brand-card p-6 text-center">
            <button
              onClick={exportToCSV}
              className="brand-button"
            >
              Exportar a CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
