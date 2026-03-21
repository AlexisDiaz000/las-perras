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
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          {settings?.logo_url ? (
            <div className="w-64 h-64 md:w-80 md:h-80 mb-10 rounded-full overflow-hidden border-4 border-[color:var(--app-border)] shadow-2xl bg-[color:var(--brand-surface)] flex items-center justify-center">
              <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-64 h-64 md:w-80 md:h-80 mb-10 rounded-full bg-[color:var(--app-hover)] border-4 border-[color:var(--app-border)] flex items-center justify-center">
              <span className="text-[color:var(--app-muted-2)] text-2xl font-bold tracking-widest uppercase">Sin Logo</span>
            </div>
          )}
          <h1 className="brand-logo text-6xl md:text-7xl lg:text-8xl leading-tight bg-clip-text text-transparent bg-gradient-to-br from-[color:var(--app-text)] to-[color:var(--app-muted-2)] drop-shadow-sm">
            {appName}
          </h1>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-[color:var(--app-bg)] relative">
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-50">
          <button 
            onClick={() => window.location.href = '/'}
            className="p-2 text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] rounded-full transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium tracking-widest uppercase hidden sm:block brand-heading">VOLVER A LA TIENDA</span>
          </button>
        </div>
        
        <div className="max-w-md w-full space-y-8 relative z-10 mt-12 sm:mt-0">
          <div className="brand-card p-8 sm:p-10 border border-[color:var(--app-border)] shadow-2xl bg-[color:var(--brand-surface)]">
            {/* Show logo only on mobile, since desktop has the big one */}
              <div className="lg:hidden flex justify-center mb-6">
                 {settings?.logo_url ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[color:var(--app-border)] shadow-lg bg-[color:var(--brand-surface)] flex items-center justify-center">
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : null}
              </div>
            <div className="text-center mb-10">
                 <h2 className="brand-heading text-4xl mb-2 text-[color:var(--app-text)] lg:hidden uppercase">{appName}</h2>
                 <h2 className="text-2xl font-bold text-[color:var(--app-text)] mb-2 hidden lg:block brand-heading uppercase">BIENVENIDO AL SISTEMA</h2>
                 <p className="text-[color:var(--app-muted-2)] uppercase tracking-widest text-xs brand-heading">INGRESA TUS CREDENCIALES</p>
               </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 brand-heading">CORREO ELECTRÓNICO</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="brand-input w-full"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 brand-heading">CONTRASEÑA</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="brand-input w-full"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authError && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-3 rounded-lg brand-heading">
                  {authError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="brand-button w-full py-3 text-lg font-bold shadow-lg shadow-primary-500/20 uppercase tracking-widest"
                >
                  {isLoading ? 'VERIFICANDO...' : 'ACCEDER AL SISTEMA'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[color:var(--app-border)] text-center">
              <p className="text-[10px] text-[color:var(--app-muted-2)] uppercase tracking-widest mb-2 brand-heading">Cuentas de demostración</p>
              <div className="flex flex-col gap-1 text-xs text-[color:var(--app-muted-1)] font-mono bg-[color:var(--app-hover)] p-3 rounded-lg">
                <p>admin@lasperras.com / admin123</p>
                <p>vendedor@lasperras.com / vendor123</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Watermark */}
        <div className="absolute bottom-4 right-6 z-50 pointer-events-none opacity-40">
          <span className="text-[10px] font-bold text-[color:var(--app-text)] uppercase tracking-widest">
            Powered by Brutal System
          </span>
        </div>
      </div>
    </div>
  )
}
