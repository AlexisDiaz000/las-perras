import { supabase } from '../lib/supabase'
import { User } from '../types'

async function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  let timeoutId: any
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms)
  })
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      12000,
      'Tiempo de espera agotado al iniciar sesión'
    )

    if (error) throw error

    // Obtener información adicional del usuario
    const { data: userData, error: userError } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single(),
      12000,
      'Tiempo de espera agotado al cargar el perfil del usuario'
    )

    if (userError) throw userError

    return { user: userData as User, session: data.session }
  },

  async signOut() {
    const { error } = await withTimeout(
      supabase.auth.signOut(),
      12000,
      'Tiempo de espera agotado al cerrar sesión'
    )
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      12000,
      'Tiempo de espera agotado al verificar la sesión'
    )
    const user = session?.user
    if (!user) return null

    const { data: userData, error: userError } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single(),
      12000,
      'Tiempo de espera agotado al cargar el perfil del usuario'
    )
    if (userError) throw userError

    // Si el usuario es el administrador principal, asegurar que tenga el rol correcto en el cliente
    if (userData.email === 'admin@lasperras.com' && userData.role !== 'admin') {
      return { ...userData, role: 'admin' } as User
    }

    // Verificar si el usuario está activo
    if (userData.active === false) { // Usar comparación explícita por si active es null/undefined
      await supabase.auth.signOut()
      throw new Error('Este usuario ha sido desactivado por el administrador.')
    }

    return userData as User
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as User[]
  },

  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error
  },

  async toggleUserStatus(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ active: !currentStatus })
      .eq('id', userId)

    if (error) throw error
  },

  async createUser(email: string, password: string, name: string, role: 'admin' | 'vendor' = 'vendor') {
    // Primero crear el usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // Luego crear el registro en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        name,
        role,
      }])
      .select()
      .single()

    if (userError) {
      // Si el error es de clave duplicada, significa que el usuario ya existe en public.users
      // pero tal vez no se creó correctamente en auth o viceversa.
      // O simplemente estamos tratando de registrar un email que ya existe.
      if (userError.code === '23505') { // Código PostgreSQL para unique_violation
        throw new Error('El correo electrónico ya está registrado.')
      }
      throw userError
    }

    return userData as User
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
