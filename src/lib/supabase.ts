// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Vite expone las variables de entorno a través de import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificación de seguridad para evitar que la app crashee si faltan las claves
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las credenciales de Supabase en el archivo .env.local')
}

// Inicializamos y exportamos el cliente para usarlo en toda la aplicación
export const supabase = createClient(supabaseUrl, supabaseAnonKey)