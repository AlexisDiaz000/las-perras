import { useState, useEffect } from 'react'
import { authService } from '../services/auth'
import { User } from '../types'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Settings() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'vendor' as 'admin' | 'vendor'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // En una implementación real, necesitaríamos un servicio para obtener usuarios
      // Por ahora, usaremos datos de ejemplo
      setUsers([
        {
          id: '1',
          email: 'admin@lasperras.com',
          name: 'Administrador Principal',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          email: 'vendedor@lasperras.com',
          name: 'Vendedor 1',
          role: 'vendor',
          created_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      await authService.createUser(newUser.email, newUser.password, newUser.name, newUser.role)
      setShowAddUser(false)
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'vendor'
      })
      loadUsers()
      alert('Usuario creado exitosamente')
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error al crear el usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Agregar Usuario
        </button>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      if (confirm('¿Está seguro de eliminar este usuario?')) {
                        // Implementar eliminación de usuario
                        alert('Función de eliminación no implementada en esta demo')
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay usuarios registrados
          </div>
        )}
      </div>

      {/* Modal para Agregar Usuario */}
      {showAddUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nuevo Usuario</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Nombre completo"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'vendor'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="vendor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información del Sistema */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Fecha de Instalación:</strong> {new Date().toLocaleDateString('es-CO')}</p>
          </div>
          <div>
            <p><strong>Total de Usuarios:</strong> {users.length}</p>
            <p><strong>Administradores:</strong> {users.filter(u => u.role === 'admin').length}</p>
            <p><strong>Vendedores:</strong> {users.filter(u => u.role === 'vendor').length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}