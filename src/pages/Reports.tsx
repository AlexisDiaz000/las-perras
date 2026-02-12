import { useState } from 'react'
import { dashboardService } from '../services/dashboard'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const exportToPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    const { metrics, salesData, expensesData } = reportData

    // Config
    const pageWidth = doc.internal.pageSize.width
    const margin = 15
    let currentY = 20

    // Title
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text('LAS PERRAS', pageWidth / 2, currentY, { align: 'center' })
    
    currentY += 10
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('REPORTE FINANCIERO', pageWidth / 2, currentY, { align: 'center' })
    
    currentY += 10
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, margin, currentY)
    doc.text(`Período: ${startDate} al ${endDate}`, pageWidth - margin, currentY, { align: 'right' })

    currentY += 15

    // Section 1: Financial Summary
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Resumen Financiero', margin, currentY)
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Concepto', 'Valor']],
      body: [
        ['Ventas Totales', formatCurrency(metrics.total_sales)],
        ['Gastos Totales', formatCurrency(metrics.total_expenses)],
        ['Ganancia Neta', formatCurrency(metrics.net_profit)],
        ['Socio 1 (70%)', formatCurrency(metrics.partner1_share)],
        ['Socio 2 (30%)', formatCurrency(metrics.partner2_share)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' }
      }
    })

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15

    // Section 2: Sales Details
    doc.text('Detalle de Ventas', margin, currentY)
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Producto', 'Cantidad', 'Total']],
      body: salesData.map((item: any) => [
        item.hotdog_type,
        item.count,
        formatCurrency(item.total)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
      columnStyles: {
        2: { halign: 'right' }
      }
    })

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15

    // Section 3: Expenses Details
    doc.text('Detalle de Gastos', margin, currentY)

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Categoría', 'Total']],
      body: expensesData.map((item: any) => [
        item.category,
        formatCurrency(item.total)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
      columnStyles: {
        1: { halign: 'right' }
      }
    })

    // Footer
    const pageCount = doc.internal.pages.length - 1
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' })
    }

    doc.save(`reporte_las_perras_${startDate}_${endDate}.pdf`)
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
              onClick={exportToPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest shadow-lg transition-colors flex items-center justify-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar Reporte PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
