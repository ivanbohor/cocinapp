// src/lib/supabase.ts
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🔍 ESCÁNER DE DIAGNÓSTICO: Verificamos qué URL está intentando usar el navegador
if (!supabaseUrl) {
  console.error("🚨 ERROR: VITE_SUPABASE_URL está vacía o indefinida.");
} else {
  console.log("🔌 Intentando conectar a Supabase en la URL:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);