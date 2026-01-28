import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services/auth'
import { User } from '../types'
import { PlusIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function Settings() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'vendor' as 'admin' | 'vendor'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const allUsers = await authService.getAllUsers()
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      // Si falla la carga (ej. por permisos RLS), al menos mostrar el usuario actual
      if (user) {
        setUsers([user])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario? Esta acción es irreversible y podría fallar si el usuario tiene ventas asociadas.')) return
    
    try {
      await authService.deleteUser(userId)
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar el usuario. Si tiene ventas asociadas, considere desactivarlo en su lugar.')
    }
  }

  const handleToggleStatus = async (user: User) => {
    const action = user.active !== false ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Está seguro de ${action} a este usuario?`)) return

    try {
      // active es true por defecto si es undefined/null
      const currentStatus = user.active !== false
      await authService.toggleUserStatus(user.id, currentStatus)
      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Error al actualizar el estado del usuario')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authService.createUser(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      )
      setShowForm(false)
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'vendor'
      })
      loadUsers()
      alert('Usuario creado exitosamente')
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(error?.message || 'Error al crear el usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="brand-heading text-3xl">Configuración</h1>
          <p className="mt-2 text-sm text-secondary-300">Gestione la configuración del sistema</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-white/10 dark:text-secondary-50">
            Rol actual: {user?.role === 'admin' ? 'Administrador' : 'Vendedor'}
          </div>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 brand-button"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Usuario
          </button>
        )}
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="brand-card p-6 max-w-md w-full mx-4">
            <h2 className="brand-heading text-2xl mb-4">Nuevo Usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 brand-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 brand-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">Contraseña (Mínimo 6 caracteres)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mt-1 brand-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-200 uppercase tracking-widest">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'vendor'})}
                  className="mt-1 brand-input"
                >
                  <option value="vendor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 brand-button"
                >
                  Crear Usuario
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-white/10 border border-white/10 text-secondary-50 py-2 px-4 rounded-md hover:bg-white/15 uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="brand-card">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-300 uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className={u.active === false ? 'opacity-50 bg-gray-50/5' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-50">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/10 border border-white/10 text-secondary-50 uppercase tracking-widest">
                        {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.active !== false 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {u.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                      {new Date(u.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {u.id !== user?.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`${u.active !== false ? 'text-orange-400 hover:text-orange-500' : 'text-green-400 hover:text-green-500'} transition-colors`}
                            title={u.active !== false ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {u.active !== false ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                          </button>
                          {/* Mantenemos el botón de eliminar solo para usuarios sin historial, pero le damos menos protagonismo */}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Eliminar usuario permanentemente"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 brand-card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="brand-heading text-2xl mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Versión</h4>
              <p className="text-sm text-secondary-50">1.0.0</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Última Actualización</h4>
              <p className="text-sm text-secondary-50">{new Date().toLocaleDateString('es-CO')}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Base de Datos</h4>
              <p className="text-sm text-secondary-50">Supabase PostgreSQL</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-secondary-300 uppercase tracking-widest">Framework</h4>
              <p className="text-sm text-secondary-50">React + TypeScript</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
