import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xzguchfkjiflvhepgtjk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3VjaGZramlmbHZoZXBndGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjgxMjUsImV4cCI6MjA4MzY0NDEyNX0.AROdXNWWmlnBgOaM8IhpWiJhj9wjs7-0ajLYpLqDI-g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)