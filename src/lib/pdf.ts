import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Sale } from '../types'
import { AppSettings } from '../types'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

export const generateReceiptPDF = (sale: Sale, settings: AppSettings | null) => {
  const appName = settings?.app_name || 'Brutal System'
  
  // Tamaño de tirilla estándar: 80mm de ancho (largo dinámico)
  // Dejamos un largo fijo inicial pero en jspdf-autotable no importa tanto si se pasa de largo
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  })

  const pageWidth = 80
  let currentY = 10

  // Configurar fuente
  doc.setFont('helvetica')

  // --- HEADER ---
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  // Centrar el nombre de la app
  const appNameWidth = doc.getTextWidth(appName)
  doc.text(appName.toUpperCase(), (pageWidth - appNameWidth) / 2, currentY)
  currentY += 8

  // Datos del ticket
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const shortId = sale.id.split('-')[0].toUpperCase()
  const date = new Date(sale.created_at).toLocaleString('es-CO')
  
  doc.text(`TICKET: #${shortId}`, 5, currentY)
  currentY += 5
  doc.text(`FECHA: ${date}`, 5, currentY)
  currentY += 5
  
  if (sale.customer_name) {
    doc.text(`CLIENTE: ${sale.customer_name}`, 5, currentY)
    currentY += 5
  }
  
  if (sale.order_type === 'delivery' && sale.delivery_address) {
    doc.text(`DOMICILIO: ${sale.delivery_address}`, 5, currentY)
    currentY += 5
  }

  currentY += 2
  doc.line(5, currentY, pageWidth - 5, currentY) // Línea separadora
  currentY += 5

  // --- ITEMS (Usando autoTable) ---
  const tableData = sale.items?.map(item => {
    let description = item.hotdog_type
    if (item.modifiers?.protein) {
      description += `\n(+ ${item.modifiers.protein})`
    }
    return [
      item.quantity.toString(),
      description,
      formatCurrency(item.total_price)
    ]
  }) || []

  // @ts-ignore
  doc.autoTable({
    startY: currentY,
    head: [['Cant', 'Producto', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 1,
      font: 'helvetica'
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: 20
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 5, right: 5 }
  })

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 5

  doc.line(5, currentY, pageWidth - 5, currentY) // Línea separadora
  currentY += 6

  // --- TOTALES ---
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const totalText = `TOTAL: ${formatCurrency(sale.total_amount)}`
  const totalWidth = doc.getTextWidth(totalText)
  doc.text(totalText, pageWidth - 5 - totalWidth, currentY)
  
  currentY += 12

  // --- FOOTER ---
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const footer1 = "¡Gracias por tu compra!"
  const footer2 = "Sigue tu pedido en nuestra web"
  
  doc.text(footer1, (pageWidth - doc.getTextWidth(footer1)) / 2, currentY)
  currentY += 5
  doc.text(footer2, (pageWidth - doc.getTextWidth(footer2)) / 2, currentY)

  // Retornar el blob del PDF en lugar de descargarlo directamente
  // para poder usar Web Share API
  return doc.output('blob')
}
