import { useState, useEffect } from 'react'
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
  CheckCircleIcon
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
}

export default function PublicMenu() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const orderType = searchParams.get('type') as 'local' | 'delivery'
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')

  // Customer Data State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [step, setStep] = useState<'info' | 'menu'>('info') // First ask for info, then show menu

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Calculate cart totals
  const totalItems = cart.reduce((sum, item) => sum + item.cartQuantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0)
  // Assuming a fixed delivery fee for now, or 0 if local
  const deliveryFee = orderType === 'delivery' ? 5000 : 0
  const total = subtotal + deliveryFee

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
        .order('category')
        .order('name')

      if (error) throw error

      setProducts(data || [])
      
      const uniqueCategories = Array.from(new Set((data || []).map(p => p.category)))
      setCategories(['Todos', ...uniqueCategories])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('menu')
  }

  const filteredProducts = selectedCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  // Cart Functions
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, cartQuantity: 1 }]
    })
  }

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.cartQuantity + delta)
        return { ...item, cartQuantity: newQuantity }
      }
      return item
    }).filter(item => item.cartQuantity > 0))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    
    setIsSubmitting(true)
    try {
      // 1. Create the sale record
      const saleData = {
        total_amount: total,
        status: 'pending_approval',
        order_type: orderType,
        customer_name: customerName,
        customer_phone: orderType === 'delivery' ? customerPhone : null,
        delivery_address: orderType === 'delivery' ? `${deliveryNeighborhood} - ${deliveryAddress}` : null,
        delivery_notes: orderType === 'local' ? `Mesa: ${tableNumber || 'N/A'}` : null
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Create the sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        hotdog_type: item.name,
        quantity: item.cartQuantity,
        unit_price: item.price,
        total_price: item.price * item.cartQuantity
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // 3. Success state
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
      <div className="min-h-screen bg-[color:var(--app-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[color:var(--app-bg)] text-[color:var(--app-text)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[color:var(--brand-surface)]/80 backdrop-blur-md border-b border-[color:var(--app-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => step === 'menu' ? setStep('info') : navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-[color:var(--app-hover)] text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 font-bold">
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-[color:var(--app-border)]" />
            )}
            <span className="brand-logo text-xl tracking-wider">{settings?.app_name || 'Brutal System'}</span>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 -mr-2 relative rounded-full hover:bg-[color:var(--app-hover)] text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
          >
            <ShoppingCartIcon className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {orderSuccess ? (
          <div className="max-w-md mx-auto mt-10 text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <CheckCircleIcon className="w-24 h-24 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">¡Pedido Enviado!</h2>
            <p className="text-[color:var(--app-muted-2)]">
              Hemos recibido tu pedido y está pendiente de aprobación por nuestro equipo. 
              {orderType === 'local' ? ' En breve te llamaremos.' : ' Pronto lo prepararemos para envío.'}
            </p>
            <button 
              onClick={() => {
                setOrderSuccess(false)
                setStep('info')
                navigate('/')
              }}
              className="brand-button w-full mt-8"
            >
              Volver al Inicio
            </button>
          </div>
        ) : step === 'info' ? (
          /* Step 1: Customer Information */
          <div className="max-w-md mx-auto mt-10">
            <div className="brand-card p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-2 text-center">
                {orderType === 'delivery' ? 'Datos de Envío' : 'Datos del Pedido'}
              </h2>
              <p className="text-[color:var(--app-muted-2)] text-sm text-center mb-8">
                Por favor, ingresa tus datos para continuar
              </p>

              <form onSubmit={handleInfoSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Tu Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="brand-input w-full"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                {orderType === 'local' && (
                  <div>
                    <label className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" /> Número de Mesa (Opcional)
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="brand-input w-full"
                      placeholder="Ej: 5"
                    />
                  </div>
                )}

                {orderType === 'delivery' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" /> Teléfono
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="brand-input w-full"
                        placeholder="Ej: 300 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" /> Barrio
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryNeighborhood}
                        onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                        className="brand-input w-full"
                        placeholder="Ej: El Poblado"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" /> Dirección de Entrega
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="brand-input w-full"
                        placeholder="Ej: Calle 123 # 45-67, Apto 101"
                      />
                    </div>
                  </>
                )}

                <button type="submit" className="brand-button w-full mt-8 py-3 text-lg">
                  Ver Menú
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Step 2: The Menu */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               <div>
                 <h2 className="text-2xl font-bold">Nuestro Menú</h2>
                 <p className="text-sm text-[color:var(--app-muted-2)]">
                   Hola, {customerName} • {orderType === 'local' ? `Mesa ${tableNumber || 'N/A'}` : `Envío a ${deliveryNeighborhood}`}
                 </p>
               </div>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-[color:var(--app-text)] text-[color:var(--app-bg)]' 
                      : 'bg-[color:var(--brand-surface)] text-[color:var(--app-muted-2)] border border-[color:var(--app-border)] hover:bg-[color:var(--app-hover)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="brand-card overflow-hidden group cursor-pointer hover:border-primary-500/50 transition-colors flex flex-col h-full">
                  {product.image_url ? (
                    <div className="h-48 w-full overflow-hidden bg-[color:var(--app-hover-strong)]">
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-[color:var(--app-hover)] flex items-center justify-center border-b border-[color:var(--app-border)]">
                      <span className="text-[color:var(--app-muted-3)] uppercase tracking-widest text-xs font-bold">Sin Imagen</span>
                    </div>
                  )}
                  
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                      <span className="font-bold text-primary-500 whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-[color:var(--app-muted-2)] line-clamp-2 mb-4 flex-1">
                        {product.description}
                      </p>
                    )}
                    
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full py-2 rounded-lg bg-[color:var(--app-hover-strong)] text-[color:var(--app-text)] font-semibold hover:bg-primary-600 hover:text-white transition-colors mt-auto flex items-center justify-center gap-2"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>

      {/* Cart Sidebar (Slide-over) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full h-full bg-[color:var(--brand-surface)] shadow-2xl flex flex-col transform transition-transform border-l border-[color:var(--app-border)]">
              
              {/* Cart Header */}
              <div className="px-6 py-4 border-b border-[color:var(--app-border)] flex items-center justify-between bg-[color:var(--app-bg)]">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCartIcon className="w-6 h-6" />
                  Tu Pedido
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-[color:var(--app-hover)] text-[color:var(--app-muted-2)] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[color:var(--app-muted-2)] space-y-4">
                    <ShoppingCartIcon className="w-16 h-16 opacity-20" />
                    <p>Tu carrito está vacío</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-primary-500 font-semibold hover:underline"
                    >
                      Ver menú
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 items-start border-b border-[color:var(--app-border)] pb-6 last:border-0 last:pb-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-[color:var(--app-hover-strong)] shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCartIcon className="w-8 h-8 text-[color:var(--app-muted-3)]" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between min-h-[5rem]">
                        <div>
                          <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                          <p className="text-primary-500 font-bold text-sm mt-1">{formatCurrency(item.price)}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center bg-[color:var(--app-bg)] rounded-lg border border-[color:var(--app-border)]">
                            <button 
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="p-1.5 hover:text-primary-500 transition-colors"
                            >
                              {item.cartQuantity === 1 ? <TrashIcon className="w-4 h-4 text-red-500" /> : <MinusIcon className="w-4 h-4" />}
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.cartQuantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="p-1.5 hover:text-primary-500 transition-colors"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right font-bold">
                        {formatCurrency(item.price * item.cartQuantity)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer / Checkout */}
              {cart.length > 0 && (
                <div className="border-t border-[color:var(--app-border)] bg-[color:var(--app-bg)] p-6 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[color:var(--app-muted-2)]">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-[color:var(--app-muted-2)]">
                        <span>Costo de envío</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-[color:var(--app-border)]">
                      <span>Total</span>
                      <span className="text-primary-500">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full brand-button py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}