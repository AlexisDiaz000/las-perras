import { useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { Navigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settings'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { user, isLoading, authError, signIn } = useAuthStore()
  const { settings } = useSettingsStore()

  const appName = settings?.app_name || 'Brutal System'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
    } catch {
    }
  }

  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="brand-card p-8">
          <div className="text-center">
            {settings?.logo_url && (
              <div className="mx-auto h-24 w-24 mb-4 rounded-full overflow-hidden border-2 border-white/10 shadow-lg bg-[color:var(--app-hover-strong)]">
                <img src={settings.logo_url} alt="Logo" className="h-full w-full object-cover" />
              </div>
            )}
            <h2 className="brand-logo text-6xl leading-none mb-2">{appName}</h2>
            <p className="text-secondary-300 uppercase tracking-widest text-xs">Sistema de Gestión</p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 brand-input"
                  placeholder="tu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 brand-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {authError && (
              <div className="text-secondary-50 text-sm text-center bg-white/10 border border-white/10 p-3 rounded-md">
                {authError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="brand-button w-full"
              >
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-secondary-400 uppercase tracking-widest">
              <p>Demo: admin@lasperras.com / admin123</p>
              <p>vendedor@lasperras.com / vendor123</p>
            </div>
          </div>
        </div>
      
      {/* Watermark */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-30">
        <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">
          Powered by Brutal System
        </span>
      </div>
    </div>
  )
}
