import { useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { Navigate } from 'react-router-dom'
import { authService } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { user, isLoading, error, signIn } = useAuthStore()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendMessage(null)
    try {
      await authService.resendConfirmation(email)
      setResendMessage('Hemos reenviado el correo de confirmación. Revisa tu bandeja de entrada y spam.')
    } catch (err: any) {
      setResendMessage(err.message || 'No se pudo reenviar el correo de confirmación')
    } finally {
      setResendLoading(false)
    }
  }

  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-yellow-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Las Perras</h2>
            <p className="text-gray-600">Sistema de Gestión</p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
                {(email && /confirm/i.test(error)) && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {resendLoading ? 'Reenviando…' : 'Reenviar confirmación'}
                    </button>
                  </div>
                )}
                {resendMessage && (
                  <div className="text-sm text-center bg-yellow-50 text-yellow-800 p-2 rounded-md">
                    {resendMessage}
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo: admin@lasperras.com / admin123</p>
            <p>vendedor@lasperras.com / vendor123</p>
            <p className="mt-2 text-xs">Si ves "email not confirmed", reenvía la confirmación o solicita activación al administrador.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
