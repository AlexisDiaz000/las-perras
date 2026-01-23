import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  HomeIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Punto de Venta', href: '/pos', icon: CurrencyDollarIcon, roles: ['admin', 'vendor'] },
  { name: 'Inventario', href: '/inventory', icon: ArchiveBoxIcon, roles: ['admin'] },
  { name: 'Gastos', href: '/expenses', icon: BanknotesIcon, roles: ['admin'] },
  { name: 'Reportes', href: '/reports', icon: ChartBarIcon, roles: ['admin'] },
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'] },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const filteredNavigation = navigation.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  )

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
              <div className="fixed inset-0 bg-gray-900/80" />
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
                  
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                      <h1 className="text-2xl font-bold text-primary-600">Las Perras</h1>
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
                                      ? 'bg-primary-50 text-primary-600'
                                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                  )}
                                >
                                  <item.icon
                                    className={classNames(
                                      location.pathname === item.href ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
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

        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-2xl font-bold text-primary-600">Las Perras</h1>
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
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname === item.href ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
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
                
                <li className="mt-auto">
                  <div className="flex items-center gap-x-4 py-3 text-sm font-semibold leading-6 text-gray-900 border-t border-gray-200 pt-4">
                    <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="sr-only">Tu perfil</span>
                    <div className="flex flex-col">
                      <span aria-hidden="true">{user?.name}</span>
                      <span className="text-xs text-gray-500 font-normal capitalize">{user?.role}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="ml-auto p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                      title="Cerrar Sesión"
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <span className="sr-only">Abrir menú</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
                <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
                   <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  <span className="sr-only">Tu perfil</span>
                  <span aria-hidden="true">{user?.name}</span>
                   <button
                      onClick={handleSignOut}
                      className="ml-2 p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    </button>
                </div>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
