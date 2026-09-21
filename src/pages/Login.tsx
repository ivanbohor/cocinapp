// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para el ojito
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      if (data.user) navigate('/admin/dashboard');
    } catch (error: any) {
      console.error("Error de login:", error);
      setErrorMsg("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal con imagen de fondo
    <div 
      className="min-h-screen w-full relative flex items-center justify-center lg:justify-end lg:pr-24 p-4"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Capa oscura semi-transparente para resaltar la tarjeta blanca */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      {/* Tarjeta flotante del formulario */}
      <div className="relative z-10 w-full max-w-[450px] bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-orange-500 tracking-tight mb-1">CocinApp</h1>
          <h2 className="text-xl font-bold text-slate-900">Ingresa a tu cuenta</h2>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle size={16} />
            <p>{errorMsg}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo electrónico o usuario *</label>
            <Input 
              required
              type="email" 
              placeholder="Ingresa tu correo o usuario" 
              className="w-full h-12 bg-slate-50 border-transparent focus:bg-white rounded-xl text-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contraseña *</label>
            <div className="relative">
              <Input 
                required
                type={showPassword ? "text" : "password"} 
                placeholder="Ingresa tu contraseña" 
                className="w-full h-12 bg-slate-50 border-transparent focus:bg-white rounded-xl pr-12 text-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4" />
              Recordarme
            </label>
            <a href="#" className="font-semibold text-slate-900 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="pt-4 space-y-3">
            <Button type="submit" disabled={loading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Iniciar sesión'}
            </Button>

            <Button type="button" variant="outline" className="w-full h-12 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-base font-bold transition-all">
              Quiero crear mi tienda
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}