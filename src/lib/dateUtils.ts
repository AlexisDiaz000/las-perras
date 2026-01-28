export function getColombiaDate(): string {
  // Crea una fecha con la hora actual
  const now = new Date()
  
  // Convierte a la zona horaria de Bogotá ('es-CO' usa UTC-5)
  // Nota: 'es-CO' por defecto formatea como dd/mm/yyyy, pero necesitamos YYYY-MM-DD para los inputs date.
  // Usamos Intl.DateTimeFormat para extraer las partes en la zona correcta.
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value

  return `${year}-${month}-${day}`
}
