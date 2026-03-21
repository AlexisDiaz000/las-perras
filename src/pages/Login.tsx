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
    <div className="min-h-screen flex">
      {/* Left Column - Branding (Visible only on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[color:var(--brand-surface)] border-r border-[color:var(--app-border)] items-center justify-center p-12">
        {/* Abstract background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl mix-blend-screen"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          {settings?.logo_url ? (
            <div className="w-64 h-64 md:w-80 md:h-80 mb-10 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-black">
              <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-64 h-64 md:w-80 md:h-80 mb-10 rounded-full bg-black/50 border-4 border-white/10 flex items-center justify-center">
              <span className="text-secondary-500 text-2xl font-bold tracking-widest uppercase">Sin Logo</span>
            </div>
          )}
          <h1 className="brand-logo text-6xl md:text-7xl lg:text-8xl mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-secondary-400">
            {appName}
          </h1>
          <p className="text-secondary-400 text-lg tracking-widest uppercase font-semibold">
            Sistema Integral de Gestión
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="brand-card p-8 sm:p-10 border border-white/5 shadow-2xl">
            <div className="text-center mb-10">
              {/* Show logo only on mobile, since desktop has the big one */}
              <div className="lg:hidden flex justify-center mb-6">
                 {settings?.logo_url ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-lg bg-black">
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : null}
              </div>
              
              <h2 className="brand-heading text-4xl mb-2 text-white lg:hidden">{appName}</h2>
              <h2 className="text-2xl font-bold text-white mb-2 hidden lg:block">Bienvenido de vuelta</h2>
              <p className="text-secondary-400 uppercase tracking-widest text-xs">Ingresa tus credenciales</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-secondary-300 uppercase tracking-widest mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="brand-input w-full bg-black/50"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-secondary-300 uppercase tracking-widest mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="brand-input w-full bg-black/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authError && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {authError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="brand-button w-full py-3 text-lg font-bold shadow-lg shadow-primary-500/20"
                >
                  {isLoading ? 'Verificando...' : 'Acceder al Sistema'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-[10px] text-secondary-500 uppercase tracking-widest mb-2">Cuentas de demostración</p>
              <div className="flex flex-col gap-1 text-xs text-secondary-400 font-mono bg-black/30 p-3 rounded-lg">
                <p>admin@lasperras.com / admin123</p>
                <p>vendedor@lasperras.com / vendor123</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Watermark */}
        <div className="fixed bottom-4 right-6 z-50 pointer-events-none opacity-20">
          <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">
            Powered by Brutal System
          </span>
        </div>
      </div>
    </div>
  )
}
