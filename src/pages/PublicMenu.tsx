import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { useSettingsStore } from '../stores/settings'
import { formatCurrency } from '../utils/format'
import { 
  ArrowLeftIcon, 
  ShoppingCartIcon, 
  MapPinIcon, 
  UserIcon, 
  PhoneIcon 
} from '@heroicons/react/24/outline'

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
  const [step, setStep] = useState<'info' | 'menu'>('info') // First ask for info, then show menu

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

          <button className="p-2 -mr-2 relative rounded-full hover:bg-[color:var(--app-hover)] text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors">
            <ShoppingCartIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {step === 'info' ? (
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
                        <MapPinIcon className="w-4 h-4" /> Dirección de Entrega
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="brand-input w-full"
                        placeholder="Ej: Calle 123 # 45-67"
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
                   Hola, {customerName} • {orderType === 'local' ? 'Para comer aquí' : 'A domicilio'}
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
                    
                    <button className="w-full py-2 rounded-lg bg-[color:var(--app-hover-strong)] text-[color:var(--app-text)] font-semibold hover:bg-primary-600 hover:text-white transition-colors mt-auto flex items-center justify-center gap-2">
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
    </div>
  )
}