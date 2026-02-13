import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  HomeIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Punto de Venta', href: '/pos', icon: CurrencyDollarIcon, roles: ['admin', 'vendor'] },
  { name: 'Pedidos', href: '/orders', icon: ClipboardDocumentListIcon, roles: ['admin', 'vendor'] },
  { name: 'Inventario', href: '/inventory', icon: ArchiveBoxIcon, roles: ['admin'] },
  { name: 'Productos', href: '/products', icon: ClipboardDocumentListIcon, roles: ['admin'] },
  { name: 'Gastos', href: '/expenses', icon: BanknotesIcon, roles: ['admin'] },
  { name: 'Reportes', href: '/reports', icon: ChartBarIcon, roles: ['admin'] },
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'] },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const filteredNavigation = navigation.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  )

  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', nextIsDark)
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light')
    setIsDark(nextIsDark)
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Cerrar menú</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[color:var(--brand-surface)] px-6 pb-4 border-r border-[color:var(--app-border)]">
                    <div className="flex h-16 shrink-0 items-center">
                      <h1 className="brand-logo text-3xl">Las Perras</h1>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {filteredNavigation.map((item) => (
                              <li key={item.name}>
                                <Link
                                  to={item.href}
                                  className={classNames(
                                    location.pathname === item.href
                                      ? 'bg-[color:var(--app-hover-strong)] text-[color:var(--app-text)]'
                                      : 'text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)]',
                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold uppercase tracking-widest'
                                  )}
                                >
                                  <item.icon
                                    className={classNames(
                                      location.pathname === item.href ? 'text-[color:var(--app-text)]' : 'text-[color:var(--app-muted-2)] group-hover:text-[color:var(--app-text)]',
                                      'h-6 w-6 shrink-0'
                                    )}
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex ${collapsed ? 'lg:w-20' : 'lg:w-72'} lg:flex-col transition-all duration-300 ease-in-out`}>
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[color:var(--app-border)] bg-[color:var(--brand-surface)] px-4 pb-4">
            <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
              {!collapsed && <h1 className="brand-logo text-3xl">Las Perras</h1>}
              <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-white/10 text-secondary-400">
                {collapsed ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
              </button>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {filteredNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? 'bg-[color:var(--app-hover-strong)] text-[color:var(--app-text)]'
                              : 'text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)]',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold uppercase tracking-widest',
                            collapsed ? 'justify-center' : ''
                          )}
                          title={collapsed ? item.name : ''}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname === item.href ? 'text-[color:var(--app-text)]' : 'text-[color:var(--app-muted-2)] group-hover:text-[color:var(--app-text)]',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {!collapsed && item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                
                <li className="mt-auto">
                  <div className={`flex items-center gap-x-3 py-3 text-sm font-semibold leading-6 text-[color:var(--app-text)] border-t border-[color:var(--app-border)] pt-4 ${collapsed ? 'flex-col justify-center' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-[color:var(--app-hover-strong)] flex items-center justify-center text-[color:var(--app-text)] shrink-0">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {!collapsed && (
                      <div className="flex flex-col min-w-0">
                        <span aria-hidden="true" className="truncate">{user?.name}</span>
                        <span className="text-xs text-[color:var(--app-muted-3)] font-normal capitalize">{user?.role}</span>
                      </div>
                    )}
                    {!collapsed && (
                      <>
                        <button
                          onClick={toggleTheme}
                          className="ml-auto p-2 hover:bg-[color:var(--app-hover)] rounded-full text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
                          title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                        >
                          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="p-2 hover:bg-[color:var(--app-hover)] rounded-full text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
                          title="Cerrar Sesión"
                        >
                          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {collapsed && (
                      <div className="flex flex-col gap-2 mt-2">
                         <button
                          onClick={toggleTheme}
                          className="p-2 hover:bg-[color:var(--app-hover)] rounded-full text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
                          title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                        >
                          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="p-2 hover:bg-[color:var(--app-hover)] rounded-full text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
                          title="Cerrar Sesión"
                        >
                          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[color:var(--app-border)] bg-[color:var(--brand-surface)] backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden justify-between">
            <div className="flex items-center gap-x-4">
              <button type="button" className="-m-2.5 p-2.5 text-[color:var(--app-text)] lg:hidden" onClick={() => setSidebarOpen(true)}>
                <span className="sr-only">Abrir menú</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <h1 className="brand-logo text-xl lg:hidden">Las Perras</h1>
            </div>

            <div className="flex items-center gap-x-3">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-[color:var(--app-hover)] rounded-full text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors"
              >
                {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <div className="h-8 w-8 rounded-full bg-[color:var(--app-hover-strong)] flex items-center justify-center text-[color:var(--app-text)] text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>

          <main className="py-6 lg:py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
