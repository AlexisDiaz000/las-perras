import { useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { HOTDOG_TYPES } from '../constants'
import { createSaleAndConsumeInventory } from '../services/sales'

export default function POS() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDemoSale = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      const price = HOTDOG_TYPES['Básico'].price
      await createSaleAndConsumeInventory(
        {
          total_amount: price,
          payment_method: 'cash',
          seller_id: user.id,
        },
        [
          {
            hotdog_type: 'Básico',
            quantity: 1,
            unit_price: price,
            total_price: price,
          },
        ]
      )
      setMessage('Venta registrada y stock descontado')
    } catch (e: any) {
      setMessage('Error al registrar venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Punto de Venta</h1>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-gray-600">Interfaz POS en construcción.</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleDemoSale}
              disabled={loading || !user}
              className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Registrar venta demo Básico'}
            </button>
            {message && <span className="text-sm text-gray-700">{message}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
