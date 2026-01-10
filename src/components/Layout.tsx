import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Punto de Venta', href: '/pos', icon: ShoppingCartIcon },
    { name: 'Inventario', href: '/inventory', icon: CubeIcon },
    { name: 'Gastos', href: '/expenses', icon: CurrencyDollarIcon },
    { name: 'Reportes', href: '/reports', icon: DocumentChartBarIcon },
    ...(user?.role === 'admin' ? [{ name: 'Configuración', href: '/settings', icon: CogIcon }] : [])
  ]

  const handleLogout = async () => {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (e: any) {
      setLogoutError(e?.message || 'No se pudo cerrar sesión')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center bg-red-600">
          <h1 className="text-xl font-bold text-white">Las Perras</h1>
        </div>
        
        <nav className="mt-5 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors duration-200`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
            {loggingOut ? 'Cerrando…' : 'Cerrar Sesión'}
          </button>
          {logoutError && (
            <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded">
              {logoutError}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
