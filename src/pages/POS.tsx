import { useMemo, useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { HOTDOG_TYPES, PAYMENT_METHODS } from '../constants'
import { createSaleAndConsumeInventory, salesService } from '../services/sales'
import { RecentOrders } from '../components/RecentOrders'

type ProteinChoice = 'Desmechada de Res' | 'Carne de Pollo' | 'Carne de Cerdo'

type LineModifiers = {
  protein?: ProteinChoice
  extraSauce?: boolean
  noSauce?: boolean
}

type CartLine = {
  id: string
  hotdog_type: keyof typeof HOTDOG_TYPES
  quantity: number
  modifiers?: LineModifiers
}

type OrderStage = 'draft' | 'preparing' | 'delivered'

const DOGS_SIMPLE = ['Perrita', 'Perrota', 'Perrísima'] as const
const DOGS_SPECIAL = ['La Gran Perra', 'La Perra Trifásica', 'La Super Perra'] as const
const DRINKS = ['Coca-Cola Personal 400ml', 'Coca-Cola 1 litro', 'Coca-Cola 1.5 litros'] as const

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

export default function POS() {
  const { user } = useAuthStore()
  const [stage, setStage] = useState<OrderStage>('draft')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cart, setCart] = useState<CartLine[]>([])
  const [saleId, setSaleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [proteinModal, setProteinModal] = useState<{
    open: boolean
    product?: keyof typeof HOTDOG_TYPES
    protein: ProteinChoice
  }>({ open: false, protein: 'Desmechada de Res' })

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => {
      const price = HOTDOG_TYPES[line.hotdog_type].price
      return sum + price * line.quantity
    }, 0)
    return { subtotal, total: subtotal }
  }, [cart])

  const addToCart = (product: keyof typeof HOTDOG_TYPES) => {
    const cfg: any = HOTDOG_TYPES[product]
    if (cfg.requiresProteinChoice) {
      setProteinModal({ open: true, product, protein: 'Desmechada de Res' })
      return
    }
    setCart(prev => [
      ...prev,
      { id: crypto.randomUUID(), hotdog_type: product, quantity: 1, modifiers: {} }
    ])
  }

  const confirmProtein = () => {
    if (!proteinModal.product) return
    setCart(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        hotdog_type: proteinModal.product!,
        quantity: 1,
        modifiers: { protein: proteinModal.protein }
      }
    ])
    setProteinModal({ open: false, protein: 'Desmechada de Res' })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(line => (line.id === id ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line))
    )
  }

  const removeLine = (id: string) => setCart(prev => prev.filter(line => line.id !== id))

  const toggleLineModifier = (id: string, key: keyof LineModifiers) => {
    setCart(prev =>
      prev.map(line => {
        if (line.id !== id) return line
        const next = { ...(line.modifiers || {}) }
        ;(next as any)[key] = !Boolean((next as any)[key])
        if (key === 'noSauce' && (next as any).noSauce) (next as any).extraSauce = false
        return { ...line, modifiers: next }
      })
    )
  }

  const resetOrder = () => {
    setCart([])
    setStage('draft')
    setSaleId(null)
    setMessage(null)
    setLoading(false)
  }

  const buildSaleItems = () =>
    cart.map(line => {
      const unitPrice = HOTDOG_TYPES[line.hotdog_type].price
      return {
        hotdog_type: line.hotdog_type,
        quantity: line.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * line.quantity,
        modifiers: line.modifiers
      }
    })

  const markPreparing = async () => {
    if (!user) return
    if (!cart.length) return
    if (saleId) {
      setStage('preparing')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const created = await salesService.createSale(
        {
          total_amount: totals.total,
          payment_method: paymentMethod,
          seller_id: user.id,
          status: 'preparing'
        } as any,
        buildSaleItems() as any
      )
      setSaleId(created.id)
      setStage('preparing')
      setMessage('Pedido enviado a preparación')
    } catch (e: any) {
      setMessage(e?.message || 'No se pudo crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  const markDelivered = async () => {
    if (!saleId) {
      setStage('delivered')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      await salesService.updateSale(saleId, { status: 'delivered' } as any)
      setStage('delivered')
      setMessage('Pedido entregado')
    } catch (e: any) {
      setMessage(e?.message || 'No se pudo actualizar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const voidOrder = () => {
    if (!saleId || !user) {
      resetOrder()
      setMessage('Pedido anulado')
      return
    }
    const reason = window.prompt('Motivo de anulación') || ''
    if (!reason.trim()) return
    setLoading(true)
    setMessage(null)
    salesService
      .voidSale(saleId, reason, user.id, false)
      .then(() => {
        resetOrder()
        setMessage('Pedido anulado')
      })
      .catch((e: any) => {
        setMessage(e?.message || 'No se pudo anular el pedido')
      })
      .finally(() => setLoading(false))
  }

  const chargeAndRegister = async () => {
    if (!user) return
    if (cart.length === 0) return
    if (stage !== 'delivered') {
      setMessage('Marca el pedido como entregado antes de cobrar')
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      if (saleId) {
        await salesService.finalizeSaleAndConsumeInventory(saleId, user.id, paymentMethod)
      } else {
        await createSaleAndConsumeInventory(
          {
            total_amount: totals.total,
            payment_method: paymentMethod,
            seller_id: user.id,
          },
          buildSaleItems() as any
        )
      }

      resetOrder()
      setMessage('Venta registrada')
    } catch (e: any) {
      setMessage(e?.message || 'Error al registrar venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="brand-heading text-3xl">Punto de Venta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="brand-card p-6">
            <h2 className="brand-heading text-xl mb-4">Perros Sencillas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOGS_SIMPLE.map((name) => (
                <button key={name} onClick={() => addToCart(name)} className="brand-card p-4 text-left hover:bg-white/5">
                  <div className="brand-heading text-lg">{name}</div>
                  <div className="text-sm text-secondary-300 mt-1">{formatCurrency(HOTDOG_TYPES[name].price)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="brand-card p-6">
            <h2 className="brand-heading text-xl mb-4">Perros Especiales</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOGS_SPECIAL.map((name) => (
                <button key={name} onClick={() => addToCart(name)} className="brand-card p-4 text-left hover:bg-white/5">
                  <div className="brand-heading text-lg">{name}</div>
                  <div className="text-sm text-secondary-300 mt-1">{formatCurrency(HOTDOG_TYPES[name].price)}</div>
                  {(HOTDOG_TYPES as any)[name].requiresProteinChoice && (
                    <div className="text-xs text-secondary-400 mt-1 uppercase tracking-widest">Requiere proteína</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="brand-card p-6">
            <h2 className="brand-heading text-xl mb-4">Bebidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DRINKS.map((name) => (
                <button key={name} onClick={() => addToCart(name)} className="brand-card p-4 text-left hover:bg-white/5">
                  <div className="brand-heading text-lg">{name}</div>
                  <div className="text-sm text-secondary-300 mt-1">{formatCurrency(HOTDOG_TYPES[name].price)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="brand-card p-6">
            <h2 className="brand-heading text-xl mb-4">Pedido</h2>

            {cart.length === 0 ? (
              <div className="text-sm text-secondary-400">Agrega productos desde el menú.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((line) => (
                  <div key={line.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-secondary-50">{line.hotdog_type}</div>
                        {line.modifiers?.protein && (
                          <div className="text-xs text-secondary-300 uppercase tracking-widest">Proteína: {line.modifiers.protein}</div>
                        )}
                      </div>
                      <button onClick={() => removeLine(line.id)} className="text-xs text-secondary-300 hover:text-secondary-50 uppercase tracking-widest">
                        Quitar
                      </button>
                    </div>

                    {(DOGS_SIMPLE as readonly string[]).includes(line.hotdog_type as any) || (DOGS_SPECIAL as readonly string[]).includes(line.hotdog_type as any) ? (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => toggleLineModifier(line.id, 'extraSauce')} className="px-2 py-1 text-xs rounded border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest">
                          Extra salsas {line.modifiers?.extraSauce ? 'Sí' : 'No'}
                        </button>
                        <button onClick={() => toggleLineModifier(line.id, 'noSauce')} className="px-2 py-1 text-xs rounded border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest">
                          Sin salsas {line.modifiers?.noSauce ? 'Sí' : 'No'}
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(line.id, -1)} className="px-2 py-1 text-xs rounded border border-white/10 text-secondary-50 hover:bg-white/10">
                          -
                        </button>
                        <span className="text-sm text-secondary-50">{line.quantity}</span>
                        <button onClick={() => updateQty(line.id, 1)} className="px-2 py-1 text-xs rounded border border-white/10 text-secondary-50 hover:bg-white/10">
                          +
                        </button>
                      </div>
                      <div className="text-sm text-secondary-50">
                        {formatCurrency(HOTDOG_TYPES[line.hotdog_type].price * line.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-300 uppercase tracking-widest">Total</span>
                <span className="text-lg font-semibold text-secondary-50">{formatCurrency(totals.total)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest mb-2">Método de pago</label>
                <select className="brand-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button disabled={!cart.length || stage !== 'draft' || loading} onClick={markPreparing} className="brand-button">
                  Preparando
                </button>
                <button disabled={!cart.length || stage === 'draft' || loading} onClick={markDelivered} className="brand-button">
                  Entregada
                </button>
              </div>

              <button disabled={!user || loading || !cart.length} onClick={chargeAndRegister} className="brand-button w-full">
                {loading ? 'Procesando...' : 'Cobrar y registrar'}
              </button>

              <button disabled={!cart.length} onClick={voidOrder} className="w-full px-4 py-2 rounded-md border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest">
                Anular pedido
              </button>

              {message && <div className="text-sm text-secondary-200">{message}</div>}
            </div>
          </div>

          <RecentOrders />
        </div>
      </div>

      {proteinModal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="brand-card p-6 w-full max-w-md">
            <h3 className="brand-heading text-2xl mb-4">Selecciona proteína</h3>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">Para: {proteinModal.product}</label>
              <select className="brand-input" value={proteinModal.protein} onChange={(e) => setProteinModal(p => ({ ...p, protein: e.target.value as ProteinChoice }))}>
                <option value="Desmechada de Res">Carne (res)</option>
                <option value="Carne de Pollo">Pollo</option>
                <option value="Carne de Cerdo">Cerdo</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setProteinModal({ open: false, protein: 'Desmechada de Res' })} className="px-4 py-2 rounded-md border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest">
                Cancelar
              </button>
              <button onClick={confirmProtein} className="brand-button">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
