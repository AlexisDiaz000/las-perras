import { useState, useEffect } from 'react'
import { CartItem } from '../types'
import { HOTDOG_TYPES, INGREDIENT_CONSUMPTION, PAYMENT_METHODS } from '../constants'
import { salesService } from '../services/sales'
import { inventoryService } from '../services/inventory'
import { useAuthStore } from '../stores/auth'
import { PlusIcon, MinusIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/outline'

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuthStore()

  const addToCart = (hotdogType: keyof typeof HOTDOG_TYPES) => {
    const existingItem = cart.find(item => item.hotdog_type === hotdogType)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.hotdog_type === hotdogType
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ))
    } else {
      const price = HOTDOG_TYPES[hotdogType].price
      setCart([...cart, {
        hotdog_type: hotdogType,
        quantity: 1,
        unit_price: price,
        total_price: price
      }])
    }
  }

  const updateQuantity = (hotdogType: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.hotdog_type === hotdogType) {
        const newQuantity = Math.max(0, item.quantity + delta)
        if (newQuantity === 0) return item
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.unit_price
        }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (hotdogType: string) => {
    setCart(cart.filter(item => item.hotdog_type !== hotdogType))
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.total_price, 0)
  }

  const handleSale = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío')
      return
    }

    if (!user) {
      alert('Usuario no autenticado')
      return
    }

    setIsProcessing(true)

    try {
      // Verificar inventario antes de procesar la venta
      for (const cartItem of cart) {
        const ingredients = HOTDOG_TYPES[cartItem.hotdog_type].ingredients
        
        for (const ingredientName of ingredients) {
          const items = await inventoryService.getItems()
          const ingredient = items.find(item => item.name === ingredientName)
          
          if (ingredient) {
            const consumption = INGREDIENT_CONSUMPTION[ingredientName as keyof typeof INGREDIENT_CONSUMPTION]
            const requiredQuantity = consumption.quantity * cartItem.quantity
            
            if (ingredient.current_stock < requiredQuantity) {
              alert(`Stock insuficiente para ${ingredientName}. Disponible: ${ingredient.current_stock} ${ingredient.unit}, Requerido: ${requiredQuantity} ${consumption.unit}`)
              setIsProcessing(false)
              return
            }
          }
        }
      }

      // Crear la venta
      const totalAmount = getTotal()
      const sale = {
        total_amount: totalAmount,
        payment_method: paymentMethod,
        seller_id: user.id
      }

      const saleItems = cart.map(item => ({
        hotdog_type: item.hotdog_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))

      await salesService.createSale(sale, saleItems)

      // Descontar del inventario
      for (const cartItem of cart) {
        const ingredients = HOTDOG_TYPES[cartItem.hotdog_type].ingredients
        
        for (const ingredientName of ingredients) {
          const items = await inventoryService.getItems()
          const ingredient = items.find(item => item.name === ingredientName)
          
          if (ingredient) {
            const consumption = INGREDIENT_CONSUMPTION[ingredientName as keyof typeof INGREDIENT_CONSUMPTION]
            const consumedQuantity = consumption.quantity * cartItem.quantity
            
            await inventoryService.createMovement({
              item_id: ingredient.id,
              type: 'out',
              quantity: consumedQuantity,
              reason: `Venta: ${cartItem.hotdog_type} x${cartItem.quantity}`,
              user_id: user.id
            })
          }
        }
      }

      alert(`Venta realizada exitosamente por ${totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`)
      
      // Imprimir ticket (simulado)
      printTicket()
      
      clearCart()
    } catch (error) {
      console.error('Error procesando venta:', error)
      alert('Error al procesar la venta')
    } finally {
      setIsProcessing(false)
    }
  }

  const printTicket = () => {
    const ticketContent = `
      LAS PERRAS
      TICKET DE VENTA
      Fecha: ${new Date().toLocaleString('es-CO')}
      Vendedor: ${user?.name}
      
      ${cart.map(item => `${item.hotdog_type} x${item.quantity} - ${item.total_price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`).join('\n')}
      
      Total: ${getTotal().toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
      Pago: ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
      
      ¡Gracias por su compra!
    `
    
    const printWindow = window.open('', '', 'width=300,height=400')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - Las Perras</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="center bold">LAS PERRAS</div>
            <div class="center">TICKET DE VENTA</div>
            <div>Fecha: ${new Date().toLocaleString('es-CO')}</div>
            <div>Vendedor: ${user?.name}</div>
            <hr>
            ${cart.map(item => `<div>${item.hotdog_type} x${item.quantity}</div><div class="right">${item.total_price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>`).join('')}
            <hr>
            <div class="right bold">Total: ${getTotal().toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
            <div>Pago: ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</div>
            <br>
            <div class="center">¡Gracias por su compra!</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
        <div className="flex space-x-4">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          <button
            onClick={clearCart}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector de Productos */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Productos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(HOTDOG_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => addToCart(type as keyof typeof HOTDOG_TYPES)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors duration-200"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{type}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {config.ingredients.slice(0, 3).join(', ')}
                      {config.ingredients.length > 3 && '...'}
                    </div>
                    <div className="text-xl font-bold text-red-600 mt-2">
                      ${config.price.toLocaleString('es-CO')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Carrito</h2>
          
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.hotdog_type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.hotdog_type}</div>
                    <div className="text-sm text-gray-500">
                      ${item.unit_price.toLocaleString('es-CO')} c/u
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.hotdog_type, -1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button
                      onClick={() => updateQuantity(item.hotdog_type, 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => removeFromCart(item.hotdog_type)}
                      className="p-1 rounded-full hover:bg-red-100 text-red-600 ml-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="font-medium text-gray-900">
                      ${item.total_price.toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-red-600">
                    ${getTotal().toLocaleString('es-CO')}
                  </span>
                </div>
                
                <button
                  onClick={handleSale}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    'Procesando...'
                  ) : (
                    <>
                      <PrinterIcon className="h-5 w-5 mr-2" />
                      Procesar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}