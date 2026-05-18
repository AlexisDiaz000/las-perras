import { useMemo, useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { PAYMENT_METHODS } from '../constants'
import { salesService } from '../services/sales'
import { productsService } from '../services/products'
import { supabase } from '../lib/supabase'
import { Product, Sale } from '../types'

type ProteinChoice = 'Desmechada de Res' | 'Carne de Pollo' | 'Carne de Cerdo'

type LineModifiers = {
  protein?: ProteinChoice
  extraSauce?: boolean
  noSauce?: boolean
}

type CartLine = {
  id: string
  product: Product
  quantity: number
  modifiers?: LineModifiers
}

type OrderStage = 'draft' | 'preparing' | 'ready' | 'delivered'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

import { useSettingsStore } from '../stores/settings'

import { generateReceiptPDF } from '../lib/pdf'

import { DocumentArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function POS() {
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  
  const [stage, setStage] = useState<OrderStage>('draft')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [bankName, setBankName] = useState('')
  const [description, setDescription] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [saleId, setSaleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [notif, setNotif] = useState<string | null>(null)

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'primary';
    requireInput?: boolean;
    onConfirm: (input?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    onConfirm: () => {}
  });
  const [modalInput, setModalInput] = useState('');

  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [lastSaleForReceipt, setLastSaleForReceipt] = useState<Sale | null>(null)

  const [proteinModal, setProteinModal] = useState<{
    open: boolean
    product?: Product
    protein: ProteinChoice
  }>({ open: false, protein: 'Desmechada de Res' })

  // Calcular el uso actual del inventario basado en el carrito
  const inventoryUsage = useMemo(() => {
    const usage: Record<string, number> = {}
    cart.forEach(line => {
      line.product.ingredients?.forEach(ing => {
        if (!ing.is_optional && ing.inventory_item_id) {
          usage[ing.inventory_item_id] = (usage[ing.inventory_item_id] || 0) + (ing.quantity * line.quantity)
        }
      })
    })
    return usage
  }, [cart])

  // Verificar si hay stock suficiente para agregar 1 unidad más de este producto
  const canAddProduct = (product: Product) => {
    if (!product.ingredients || product.ingredients.length === 0) return true; // Productos sin receta no restan inventario

    for (const ing of product.ingredients) {
      if (ing.is_optional || !ing.inventory_item) continue;
      
      const currentUsage = inventoryUsage[ing.inventory_item_id] || 0;
      const required = ing.quantity;
      
      if (ing.inventory_item.current_stock < (currentUsage + required)) {
        return false; // Inventario insuficiente
      }
    }
    return true;
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const data = await productsService.getProducts()
      setProducts(data.filter(p => p.active)) // Solo mostrar productos activos
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => {
      return sum + line.product.price * line.quantity
    }, 0)
    return { subtotal, total: subtotal }
  }, [cart])

  // Notificación: pedidos cambiados a "ready" (listo para entregar)
  useEffect(() => {
    const channel = supabase
      .channel('sales-ready-notifier')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sales' }, (payload: any) => {
        try {
          const newRow = payload.new
          if (newRow?.status === 'ready') {
            const label = typeof newRow.order_number === 'number' ? `#${newRow.order_number}` : `#${String(newRow.id).slice(0,8)}`
            setNotif(`Pedido ${label} listo para entregar`)
            setTimeout(() => setNotif(null), 5000)
          }
        } catch {}
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [])

  const addToCart = (product: Product) => {
    if (!canAddProduct(product)) {
      setMessage(`Inventario insuficiente para: ${product.name}`)
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (product.requires_protein_choice) {
      setProteinModal({ open: true, product, protein: 'Desmechada de Res' })
      return
    }
    setCart(prev => [
      ...prev,
      { id: crypto.randomUUID(), product, quantity: 1, modifiers: {} }
    ])
  }

  const confirmProtein = () => {
    if (!proteinModal.product) return
    // Double check just in case
    if (!canAddProduct(proteinModal.product)) {
      setMessage(`Inventario insuficiente para: ${proteinModal.product.name}`)
      setTimeout(() => setMessage(null), 3000)
      setProteinModal({ open: false, protein: 'Desmechada de Res' })
      return
    }

    setCart(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product: proteinModal.product!,
        quantity: 1,
        modifiers: { protein: proteinModal.protein }
      }
    ])
    setProteinModal({ open: false, protein: 'Desmechada de Res' })
  }

  const updateQty = (id: string, delta: number) => {
    if (delta > 0) {
      const line = cart.find(l => l.id === id)
      if (line && !canAddProduct(line.product)) {
        setMessage(`Inventario insuficiente para añadir más de ${line.product.name}`)
        setTimeout(() => setMessage(null), 3000)
        return
      }
    }

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
    setDescription('')
    setBankName('')
    setMessage(null)
    setLoading(false)
  }

  const buildSaleItems = () =>
    cart.map(line => {
      return {
        hotdog_type: line.product.name, // Mantenemos compatibilidad con el backend que espera 'hotdog_type'
        quantity: line.quantity,
        unit_price: line.product.price,
        total_price: line.product.price * line.quantity,
        modifiers: line.modifiers
      }
    })

  const markPreparing = async () => {
    if (!user) return
    if (!cart.length) return
    if (saleId) {
      setLoading(true)
      setMessage(null)
      try {
        await salesService.updateSale(saleId, { status: 'preparing' } as any)
        setStage('preparing')
        setMessage('Pedido enviado a preparación')
      } catch (e: any) {
        setMessage(e?.message || 'No se pudo actualizar el pedido')
      } finally {
        setLoading(false)
      }
      return
    }

    // Validar banco si es transferencia
    if (paymentMethod === 'card' && !bankName.trim()) {
      setMessage('Por favor ingresa el nombre del banco o plataforma')
      return
    }

    setLoading(true)
    setMessage(null)
    
    // Construir descripción final
    let finalDescription = description.trim()
    if (paymentMethod === 'card' && bankName.trim()) {
      finalDescription = finalDescription 
        ? `${finalDescription} - Transferencia: ${bankName.trim()}`
        : `Transferencia: ${bankName.trim()}`
    }

    try {
      const created = await salesService.createSale(
        {
          total_amount: totals.total,
          payment_method: paymentMethod,
          seller_id: user.id,
          status: 'preparing',
          description: finalDescription || null,
        } as any,
        buildSaleItems() as any
      )
      setSaleId(created.id)
      setStage('preparing')
      setMessage('Pedido enviado a preparación')
      // Limpiar POS para nueva orden
      resetOrder()
    } catch (e: any) {
      console.error(e)
      setMessage(e?.message || 'No se pudo crear el pedido')
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
    
    setModalInput('');
    setModalState({
      isOpen: true,
      title: 'Anular Pedido',
      message: 'Por favor, ingresa el motivo de anulación:',
      type: 'warning',
      requireInput: true,
      onConfirm: (reasonInput) => {
        const reason = reasonInput || '';
        if (!reason.trim()) return;
        
        setModalState(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        setMessage(null);
        
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
    });
  }

  // Agrupar productos por categoría para renderizar
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {}
    products.forEach(p => {
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    })
    return groups
  }, [products])

  // Orden de visualización de categorías
  const categoryOrder = ['Perros Sencillos', 'Perros Especiales', 'Bebidas', 'Adicionales', 'Otros']

  const handleDownloadPDF = async (sale: Sale) => {
    try {
      const blob = generateReceiptPDF(sale, settings)
      const file = new File([blob], `Factura_${sale.id.slice(0, 8)}.pdf`, { type: 'application/pdf' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Factura ${getOrderLabel(sale)}`,
            text: `Aquí tienes el recibo de tu compra en ${settings?.app_name || 'Brutal System'}`,
            files: [file]
          })
          return
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            console.error('Error sharing:', shareError)
          } else {
            return
          }
        }
      }
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Factura_${sale.id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error generating PDF', e)
      alert('Error al generar la factura')
    }
  }

  const getOrderLabel = (sale: Sale) => {
    try {
      if (typeof sale.order_number === 'number') return `#${sale.order_number}`
      if (sale.id && typeof sale.id === 'string') return `#${sale.id.slice(0, 8)}`
      return '#???'
    } catch {
      return '#ERR'
    }
  }

  return (
    <div className="space-y-6">
      {notif && (
        <div className="brand-card p-3 text-sm text-secondary-50 bg-green-600/20 border border-green-500/30">
          {notif}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="brand-heading text-3xl">Punto de Venta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loadingProducts ? (
            <div className="text-center p-10 text-secondary-300">Cargando menú...</div>
          ) : (
            categoryOrder.map(category => {
              const categoryProducts = groupedProducts[category] || []
              if (categoryProducts.length === 0) return null

              return (
                <div key={category} className="brand-card p-6">
                  <h2 className="brand-heading text-xl mb-4">{category}</h2>
                  <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 snap-x">
                    {categoryProducts.map((product) => {
                      const outOfStock = !canAddProduct(product);
                      return (
                      <button 
                        key={product.id} 
                        onClick={() => !outOfStock && addToCart(product)} 
                        disabled={outOfStock}
                        className={`brand-card p-4 text-left min-w-[200px] md:min-w-0 snap-center transition-all duration-200 ${
                          outOfStock 
                            ? 'opacity-50 cursor-not-allowed grayscale bg-black/40 border-red-500/20' 
                            : 'hover:bg-white/5 active:scale-95 hover:brightness-110 active:brightness-90'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="brand-heading text-lg leading-tight">{product.name}</div>
                          {outOfStock && (
                            <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-widest font-sans whitespace-nowrap ml-2">
                              Agotado
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-secondary-300">{formatCurrency(product.price)}</div>
                        {product.requires_protein_choice && (
                          <div className="text-xs text-secondary-400 mt-1 uppercase tracking-widest">Requiere proteína</div>
                        )}
                      </button>
                    )})}
                  </div>
                </div>
              )
            })
          )}
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
                        <div className="text-sm font-semibold text-secondary-50">{line.product.name}</div>
                        {line.modifiers?.protein && (
                          <div className="text-xs text-secondary-300 uppercase tracking-widest">Proteína: {line.modifiers.protein}</div>
                        )}
                      </div>
                      <button onClick={() => removeLine(line.id)} className="text-xs text-secondary-300 hover:text-secondary-50 uppercase tracking-widest">
                        Quitar
                      </button>
                    </div>

                    {/* Mostrar modificadores solo si es un perro (categoría empieza con 'Perro') */}
                    {line.product.category.startsWith('Perros') ? (
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
                        {formatCurrency(line.product.price * line.quantity)}
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
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest mb-2">Descripción</label>
                <input
                  className="brand-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: sin cebolla, para llevar, mesa 3..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest mb-2">Método de pago</label>
                <select className="brand-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {paymentMethod === 'card' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest mb-2">Banco / Plataforma</label>
                  <input
                    className="brand-input"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej: Nequi, Bancolombia, Daviplata..."
                  />
                </div>
              )}

              <div>
                <button disabled={!cart.length || stage !== 'draft' || loading} onClick={markPreparing} className="brand-button w-full text-xs sm:text-sm px-2 py-3">
                ENVIAR A COCINA
              </button>
              </div>

              <button disabled={!cart.length} onClick={voidOrder} className="w-full px-4 py-2 rounded-md border border-white/10 text-secondary-200 hover:bg-white/10 uppercase tracking-widest">
                Anular pedido
              </button>

              {message && <div className="text-sm text-secondary-200">{message}</div>}
            </div>
          </div>
        </div>
      </div>

      {proteinModal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="brand-card p-6 w-full max-w-md">
            <h3 className="brand-heading text-2xl mb-4">Selecciona proteína</h3>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">Para: {proteinModal.product?.name}</label>
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

      {/* Custom Confirmation/Prompt Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="brand-card w-full max-w-md p-6 flex flex-col items-center text-center space-y-4">
            <ExclamationTriangleIcon className={`h-12 w-12 mb-2 ${
              modalState.type === 'danger' ? 'text-red-500' :
              modalState.type === 'warning' ? 'text-yellow-500' :
              'text-primary-500'
            }`} />
            <h2 className="brand-heading text-xl text-white">{modalState.title}</h2>
            <p className="text-secondary-300 whitespace-pre-line text-sm">
              {modalState.message}
            </p>

            {modalState.requireInput && (
              <div className="w-full mt-4">
                <input
                  type="text"
                  placeholder="Escribe aquí..."
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  className="brand-input w-full text-center"
                  autoFocus
                />
              </div>
            )}

            <div className="flex justify-center space-x-4 pt-4 w-full">
              <button 
                onClick={() => {
                  setModalState(prev => ({ ...prev, isOpen: false }));
                  setModalInput('');
                }} 
                className="px-6 py-2 text-secondary-300 hover:text-white uppercase tracking-widest text-sm w-1/2"
              >
                Cancelar
              </button>
              <button 
                onClick={() => modalState.onConfirm(modalInput)} 
                disabled={modalState.requireInput && !modalInput.trim()}
                className={`w-1/2 px-6 py-2 font-bold uppercase tracking-widest text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  modalState.type === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' :
                  modalState.type === 'warning' ? 'bg-yellow-500 text-black hover:bg-yellow-600' :
                  'brand-button'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
