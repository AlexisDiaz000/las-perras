import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { useSettingsStore } from '../stores/settings'
import { 
  ArrowLeftIcon, 
  ShoppingCartIcon, 
  MapPinIcon, 
  UserIcon, 
  PhoneIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CheckCircleIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

interface CartItem extends Product {
  cartQuantity: number
  modifiers?: {
    protein?: string
  }
}

export default function PublicMenu() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const orderType = searchParams.get('type') as 'local' | 'delivery'
  
  // Protect from accessing if store is closed
  useEffect(() => {
    if (settings && settings.is_store_open === false) {
      navigate('/')
    }
  }, [settings, navigate])

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Customer Data State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [step, setStep] = useState<'menu' | 'checkout'>('menu') // First show menu, then ask for info

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Calculate cart totals
  const totalItems = cart.reduce((sum, item) => sum + item.cartQuantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0)
  const total = subtotal

  useEffect(() => {
    // If no valid order type is provided, send back to landing
    if (orderType !== 'local' && orderType !== 'delivery') {
      navigate('/')
      return
    }
    loadProducts()
  }, [orderType, navigate])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('show_in_web', true)
        .order('category')
        .order('name')

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group products by category efficiently
  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = []
      }
      acc[product.category].push(product)
      return acc
    }, {} as Record<string, Product[]>)
  }, [products])

  // Cart Functions
  const addToCart = (product: Product, modifier?: { protein?: string }) => {
    setCart(prevCart => {
      // Check if product exists WITH THE SAME MODIFIERS
      const existingItem = prevCart.find(item => {
        if (item.id !== product.id) return false
        if (!item.modifiers && !modifier) return true
        if (item.modifiers?.protein === modifier?.protein) return true
        return false
      })

      if (existingItem) {
        return prevCart.map(item => 
          item === existingItem 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, cartQuantity: 1, modifiers: modifier }]
    })
  }

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart(prevCart => prevCart.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(0, item.cartQuantity + delta)
        return { ...item, cartQuantity: newQuantity }
      }
      return item
    }).filter(item => item.cartQuantity > 0))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  
  // Modifiers Modal State
  const [selectedProductForModifier, setSelectedProductForModifier] = useState<Product | null>(null)
  const [selectedProtein, setSelectedProtein] = useState<string>('')

  const handleProductClick = (product: Product) => {
    if (product.requires_protein_choice) {
      setSelectedProductForModifier(product)
      setSelectedProtein('') // reset
    } else {
      addToCart(product)
    }
  }

  const handleModifierConfirm = () => {
    if (selectedProductForModifier && selectedProtein) {
      addToCart(selectedProductForModifier, { protein: selectedProtein })
      setSelectedProductForModifier(null)
      setSelectedProtein('')
    }
  }

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cart.length === 0) return
    
    setIsSubmitting(true)
    try {
      // Formatear los items del carrito para el RPC
      const itemsForRpc = cart.map(item => ({
        product_id: item.id,
        quantity: item.cartQuantity,
        modifiers: item.modifiers || null
      }))

      // Llamar a la función segura del servidor (El "Portero")
      const { data: saleId, error: rpcError } = await supabase.rpc('crear_pedido_publico', {
        p_order_type: orderType,
        p_customer_name: customerName,
        p_customer_phone: orderType === 'delivery' ? customerPhone : null,
        p_delivery_address: orderType === 'delivery' ? `${deliveryNeighborhood} - ${deliveryAddress}` : null,
        p_delivery_notes: orderType === 'local' ? `Mesa: ${tableNumber || 'N/A'}` : null,
        p_items: itemsForRpc
      })

      if (rpcError) {
        console.error("RPC Error:", rpcError)
        throw new Error(rpcError.message || 'Error al procesar el pedido')
      }

      // Guardar el ID para mostrar el link y cambiar de pantalla
      setCreatedOrderId(saleId)
      setOrderSuccess(true)
      setCart([])
      setIsCartOpen(false)

    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Hubo un error al enviar tu pedido. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header */}
      {step === 'menu' && (
        <header className="pt-8 pb-4 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start gap-4">
            <button 
              onClick={() => navigate('/')}
              className="mt-2 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0"
              title="Volver al inicio"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight brand-heading uppercase">NUESTRO MENÚ</h1>
              <p className="text-gray-400 text-sm md:text-base brand-heading tracking-widest uppercase">
                {orderType === 'local' ? 'PARA CONSUMIR EN EL LOCAL' : 'PARA ENVÍO A DOMICILIO'}
              </p>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {orderSuccess ? (
          <div className="max-w-md mx-auto mt-10 text-center space-y-6 animate-fade-in bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex justify-center">
              <CheckCircleIcon className="w-24 h-24 text-success" />
            </div>
            <h2 className="text-3xl font-bold brand-heading uppercase">¡Pedido Enviado!</h2>
            <p className="text-[color:var(--app-muted-1)] text-sm">
              Hemos recibido tu pedido y está pendiente de aprobación por nuestro equipo. 
              {orderType === 'local' ? ' En breve te llamaremos.' : ' Pronto lo prepararemos para envío.'}
            </p>

            <div className="bg-black/50 p-4 rounded-xl border border-white/10 mt-6 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--app-muted-2)] mb-2 text-center">
                Sigue el estado de tu pedido aquí:
              </p>
              <div className="flex items-center gap-2 bg-black rounded-lg p-2 border border-white/10">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/status/${createdOrderId}`}
                  className="bg-transparent text-xs text-[color:var(--app-text)] w-full outline-none px-2"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/status/${createdOrderId}`);
                    alert('Enlace copiado al portapapeles');
                  }}
                  className="p-2 hover:bg-white/10 rounded-md transition-colors text-[color:var(--app-muted-2)] hover:text-white"
                  title="Copiar enlace"
                >
                  <LinkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => navigate(`/status/${createdOrderId}`)}
                className="w-full bg-success text-white font-bold py-4 rounded-xl hover:bg-success-hover transition-colors uppercase tracking-widest brand-heading text-sm"
              >
                IR AL SEGUIMIENTO AHORA
              </button>
              <button 
                onClick={() => {
                  setOrderSuccess(false)
                  setStep('menu')
                  navigate('/')
                }}
                className="w-full bg-transparent border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors uppercase tracking-widest brand-heading text-xs"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        ) : step === 'checkout' ? (
          /* Step 1 (Checkout): Customer Information */
          <div className="max-w-md mx-auto mt-10 relative">
            <button 
              onClick={() => setStep('menu')}
              className="absolute -top-12 left-0 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium tracking-widest uppercase brand-heading">VOLVER AL MENÚ</span>
            </button>
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-2 text-center text-white brand-heading uppercase">
                {orderType === 'delivery' ? 'DATOS DE ENVÍO' : 'DATOS DEL PEDIDO'}
              </h2>
              <p className="text-gray-400 text-sm text-center mb-8 brand-heading tracking-widest uppercase">
                POR FAVOR, INGRESA TUS DATOS PARA FINALIZAR
              </p>

              <form onSubmit={handleCheckout} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 brand-heading">
                    <UserIcon className="w-4 h-4" /> TU NOMBRE
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="brand-input w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                {orderType === 'local' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 brand-heading">
                      <MapPinIcon className="w-4 h-4" /> NÚMERO DE MESA (OPCIONAL)
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="brand-input w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors"
                      placeholder="Ej: 5"
                    />
                  </div>
                )}

                {orderType === 'delivery' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 brand-heading">
                        <PhoneIcon className="w-4 h-4" /> TELÉFONO
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="brand-input w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors"
                        placeholder="Ej: 300 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 brand-heading">
                        <MapPinIcon className="w-4 h-4" /> BARRIO
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryNeighborhood}
                        onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                        className="brand-input w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors"
                        placeholder="Ej: El Poblado"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 brand-heading">
                        <MapPinIcon className="w-4 h-4" /> DIRECCIÓN DE ENTREGA
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="brand-input w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors"
                        placeholder="Ej: Calle 123 # 45-67, Apto 101"
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors mt-8 uppercase tracking-widest brand-heading disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'ENVIANDO...' : 'CONFIRMAR Y ENVIAR PEDIDO'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Step 2: The Menu (Redesigned) */
          <div className="flex flex-col lg:flex-row gap-8 relative">
            
            {/* Left Column: Menu Items */}
            <div className="flex-1 space-y-12 pb-24 lg:pb-0">
              {Object.keys(groupedProducts).length === 0 ? (
                <div className="text-center text-gray-500 py-20">
                  <p>No hay productos disponibles en este momento.</p>
                </div>
              ) : (
                Object.entries(groupedProducts).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2 brand-heading">
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {items.map(product => (
                        <button 
                          key={product.id} 
                          onClick={() => handleProductClick(product)}
                          className="bg-[#121212] hover:bg-[#1A1A1A] border border-white/5 hover:border-white/10 rounded-xl overflow-hidden text-left transition-all group flex flex-row min-h-[140px] w-full"
                        >
                          <div className="p-4 flex-1 flex flex-col justify-start gap-2">
                            <div>
                              <h3 className="font-bold text-sm md:text-base tracking-wide uppercase line-clamp-2 brand-heading leading-tight">{product.name}</h3>
                              <span className="text-gray-400 text-sm mt-1 block">
                                {formatCurrency(product.price)}
                              </span>
                            </div>
                            
                            <div className="mt-auto">
                              {product.description && (
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest block leading-relaxed opacity-80 mb-2">
                                  {product.description}
                                </span>
                              )}
                              {product.requires_protein_choice && (
                                <span className="text-[10px] text-yellow-500/90 font-bold uppercase tracking-widest inline-block bg-yellow-500/10 px-2 py-1 rounded">
                                  Requiere proteína
                                </span>
                              )}
                            </div>
                          </div>
                          {product.image_url ? (
                            <div className="w-[140px] h-full bg-[#1A1A1A] shrink-0 relative">
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                          ) : (
                            <div className="w-[140px] h-full bg-[#1A1A1A] shrink-0 flex items-center justify-center border-l border-white/5">
                              <span className="text-gray-600 text-xs uppercase tracking-widest">Sin imagen</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

              {/* Right Column / Floating Button: Checkout Action */}
              <div className="lg:w-80 shrink-0">
                {/* Desktop Sticky Cart Summary */}
                <div className="hidden lg:block sticky top-24 bg-[#121212] rounded-2xl border border-white/10 p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                    Tu Pedido
                    <span className="bg-white text-black text-xs px-2 py-1 rounded-full">{totalItems}</span>
                  </h3>
                  
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No has agregado nada aún</p>
                  ) : (
                    <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-start text-sm border-b border-white/5 pb-3">
                          <div className="flex gap-2">
                            <span className="text-[color:var(--app-muted-1)]">{item.cartQuantity}x</span>
                            <div>
                              <span className="uppercase text-[color:var(--app-text)] font-bold">{item.name}</span>
                              {item.modifiers?.protein && (
                                <span className="block text-[10px] text-yellow-500 uppercase mt-0.5">
                                  + {item.modifiers.protein}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[color:var(--app-text)] brand-heading tracking-widest uppercase">
                              {formatCurrency(item.price * item.cartQuantity)}
                            </span>
                            <button onClick={() => updateCartItemQuantity(index, -1)} className="text-danger hover:text-danger-hover p-1">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="border-t border-white/10 pt-4 space-y-2 mb-6 text-sm">
                   <div className="flex justify-between text-white font-bold text-lg pt-2">
                     <span className="brand-heading uppercase tracking-widest">Total (Sin envío)</span>
                     <span>{formatCurrency(total)}</span>
                   </div>
                   {orderType === 'delivery' && (
                     <p className="text-[10px] text-gray-500 text-center mt-2 uppercase tracking-widest leading-relaxed">
                       * El valor del domicilio no está incluido y será calculado por el repartidor al momento de la entrega.
                     </p>
                   )}
                </div>

                <button 
                  onClick={() => setStep('checkout')}
                  disabled={cart.length === 0}
                  className="w-full bg-white text-black font-bold text-xl py-4 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider brand-button"
                >
                  IR A PAGAR
                </button>
              </div>

              {/* Mobile Floating Button */}
              <div className="lg:hidden fixed bottom-6 left-0 right-0 px-4 z-50">
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="w-full bg-white text-black font-bold text-xl py-4 rounded-2xl shadow-2xl shadow-black flex items-center justify-between px-6 uppercase tracking-wider border border-gray-200 brand-button"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white text-xs px-2.5 py-1 rounded-full not-italic brand-heading">{totalItems}</span>
                    <span>VER CARRITO</span>
                  </div>
                  <span className="not-italic brand-heading tracking-widest text-base">{formatCurrency(total)}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Protein Modifier Modal */}
      {selectedProductForModifier && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProductForModifier(null)} />
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 w-full max-w-sm relative z-10 animate-fade-in shadow-2xl">
            <button 
              onClick={() => setSelectedProductForModifier(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-bold text-white brand-heading uppercase mb-1">{selectedProductForModifier.name}</h3>
            <p className="text-sm text-gray-400 mb-6">Elige tu proteína preferida</p>

            <div className="space-y-3 mb-8">
              {['Carne de Res', 'Pollo', 'Cerdo'].map((protein) => (
                <label 
                  key={protein}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedProtein === protein 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-white/10 hover:border-white/30 bg-black/30'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="proteinChoice" 
                    value={protein}
                    checked={selectedProtein === protein}
                    onChange={(e) => setSelectedProtein(e.target.value)}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedProtein === protein ? 'border-yellow-500' : 'border-gray-500'
                  }`}>
                    {selectedProtein === protein && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                  </div>
                  <span className={`font-bold uppercase tracking-widest text-sm ${
                    selectedProtein === protein ? 'text-yellow-500' : 'text-gray-300'
                  }`}>
                    {protein}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleModifierConfirm}
              disabled={!selectedProtein}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Añadir al Carrito
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Slide-over */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-[#121212] rounded-t-3xl shadow-2xl flex flex-col transform transition-transform border-t border-white/10">
            
            {/* Cart Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold brand-heading uppercase">Tu Pedido</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-white/5 pb-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm uppercase truncate text-[color:var(--app-text)] brand-heading">{item.name}</h4>
                      {item.modifiers?.protein && (
                        <span className="block text-[10px] text-yellow-500 uppercase mt-0.5">
                          + {item.modifiers.protein}
                        </span>
                      )}
                      <p className="text-[color:var(--app-muted-1)] text-sm mt-1 brand-heading tracking-widest">{formatCurrency(item.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-black rounded-lg border border-white/10 p-1 shrink-0">
                      <button onClick={() => updateCartItemQuantity(index, -1)} className="p-2 hover:text-white text-gray-400">
                        {item.cartQuantity === 1 ? <TrashIcon className="w-4 h-4 text-danger" /> : <MinusIcon className="w-4 h-4" />}
                      </button>
                      <span className="w-4 text-center text-sm font-bold text-[color:var(--app-text)]">{item.cartQuantity}</span>
                      <button onClick={() => updateCartItemQuantity(index, 1)} className="p-2 hover:text-white text-gray-400">
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer / Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 p-6 space-y-4 bg-black/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white font-bold text-lg pt-2 brand-heading uppercase tracking-widest">
                    <span>Total (Sin envío)</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <p className="text-[10px] text-gray-500 text-center mt-2 uppercase tracking-widest leading-relaxed">
                      * El valor del domicilio no está incluido y será calculado por el repartidor al momento de la entrega.
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setStep('checkout');
                  }}
                  className="w-full bg-white text-black font-bold text-xl py-4 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider brand-button"
                >
                  IR A PAGAR
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}