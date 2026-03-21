import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settings'
import { UserCircleIcon, ShoppingBagIcon, TruckIcon } from '@heroicons/react/24/outline'

export default function Landing() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  
  const appName = settings?.app_name || 'Brutal System'

  return (
    <div className="min-h-screen bg-[color:var(--app-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      <div className="w-full max-w-2xl bg-[color:var(--brand-surface)] rounded-3xl shadow-2xl border border-[color:var(--app-border)] p-8 md:p-12 relative z-10">
        
        {/* Header: Logo/Name and Login Button */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            {settings?.logo_url && (
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[color:var(--app-border)] shrink-0">
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="brand-logo text-2xl md:text-3xl text-[color:var(--app-text)]">{appName}</h1>
          </div>
          
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors group"
          >
            <span className="text-sm font-semibold tracking-widest uppercase hidden sm:block">Inicio</span>
            <UserCircleIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Main Actions */}
        <div className="space-y-12 max-w-md mx-auto">
          
          {/* Order Here */}
          <div className="text-center space-y-4">
            <h2 className="brand-logo text-3xl md:text-4xl text-[color:var(--app-text)]">Tu pedido aquí!</h2>
            <button 
              onClick={() => navigate('/menu?type=local')}
              className="w-full py-6 rounded-2xl border-2 border-[color:var(--app-text)] hover:bg-[color:var(--app-hover-strong)] transition-all group flex items-center justify-center gap-4"
            >
              <ShoppingBagIcon className="w-8 h-8 text-[color:var(--app-text)] group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold text-[color:var(--app-text)] uppercase tracking-wider">Para Comer Aquí</span>
            </button>
          </div>

          {/* Order Delivery */}
          <div className="text-center space-y-4">
            <h2 className="brand-logo text-2xl md:text-3xl text-[color:var(--app-text)]">Tu pedido a domicilio</h2>
            <button 
              onClick={() => navigate('/menu?type=delivery')}
              className="w-full py-5 rounded-2xl border-2 border-[color:var(--app-muted-2)] text-[color:var(--app-muted-2)] hover:border-[color:var(--app-text)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] transition-all group flex items-center justify-center gap-4"
            >
              <TruckIcon className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
              <span className="text-lg font-bold uppercase tracking-wider">A Domicilio</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
