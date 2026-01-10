import { supabase } from '../lib/supabase'
import { User } from '../types'

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Obtener información adicional del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) throw userError

    return { user: userData as User, session: data.session }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return userData as User
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

    if (userError) throw userError

    return userData as User
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
  ,
  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
    return true
  }
}
