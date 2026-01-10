const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xzguchfkjiflvhepgtjk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3VjaGZramlmbHZoZXBndGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjgxMjUsImV4cCI6MjA4MzY0NDEyNX0.AROdXNWWmlnBgOaM8IhpWiJhj9wjs7-0ajLYpLqDI-g'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Crear usuarios demo
const createDemoUsers = async () => {
  try {
    // Crear usuario admin
    const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
      email: 'admin@lasperras.com',
      password: 'admin123',
    })

    if (adminError && !adminError.message.includes('already')) {
      console.error('Error creando admin:', adminError)
    } else if (adminAuth.user) {
      // Crear registro en tabla users
      const { error: adminUserError } = await supabase.from('users').insert([
        {
          id: adminAuth.user.id,
          email: 'admin@lasperras.com',
          name: 'Administrador Principal',
          role: 'admin'
        }
      ])
      
      if (adminUserError) {
        console.error('Error creando registro admin:', adminUserError)
      } else {
        console.log('Usuario admin creado exitosamente')
      }
    }

    // Crear usuario vendedor
    const { data: vendorAuth, error: vendorError } = await supabase.auth.signUp({
      email: 'vendedor@lasperras.com',
      password: 'vendor123',
    })

    if (vendorError && !vendorError.message.includes('already')) {
      console.error('Error creando vendedor:', vendorError)
    } else if (vendorAuth.user) {
      // Crear registro en tabla users
      const { error: vendorUserError } = await supabase.from('users').insert([
        {
          id: vendorAuth.user.id,
          email: 'vendedor@lasperras.com',
          name: 'Vendedor 1',
          role: 'vendor'
        }
      ])
      
      if (vendorUserError) {
        console.error('Error creando registro vendedor:', vendorUserError)
      } else {
        console.log('Usuario vendedor creado exitosamente')
      }
    }

    console.log('Usuarios demo creados correctamente')
    
  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar el script
createDemoUsers()