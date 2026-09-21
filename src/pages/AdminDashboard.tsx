// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, AlertTriangle, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// Paleta de colores para el gráfico de Torta
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const { restauranteId } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  
  // Selector de Mes (Por defecto el mes actual en formato YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estados de datos
  const [metrics, setMetrics] = useState({
    ingresos: 0,
    egresos: 0,
    beneficio: 0,
    ticketPromedio: 0,
    ventasTotales: 0
  });
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (restauranteId && selectedMonth) {
      fetchDashboardData();
    }
  }, [restauranteId, selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Calcular rangos de fechas del mes seleccionado
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();

      // 2. Traer Ventas (Pagadas) con sus ítems
      const { data: ventas, error: errorVentas } = await supabase
        .from('ventas')
        .select('*, venta_items(*)')
        .eq('restaurante_id', restauranteId)
        .eq('status', 'Pagado')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (errorVentas) throw errorVentas;

      // 3. Traer Gastos
      const { data: gastos, error: errorGastos } = await supabase
        .from('gastos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .gte('fecha', startDate)
        .lte('fecha', endDate);

      if (errorGastos) throw errorGastos;

      // 4. Traer Productos (para cruzar las categorías del gráfico de torta)
      const { data: catalog } = await supabase
        .from('productos')
        .select('id, category')
        .eq('restaurante_id', restauranteId);

      const catalogMap = new Map((catalog || []).map(p => [p.id, p.category]));

      // 5. Traer Alertas Urgentes de Stock
      const hoyISO = new Date().toISOString().split('T')[0];
      const { data: insumos } = await supabase
        .from('insumos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .not('fecha_alarma', 'is', null)
        .lte('fecha_alarma', hoyISO);

      setUrgentAlerts(insumos || []);

      // ==========================================
      // PROCESAMIENTO MATEMÁTICO Y AGRUPACIONES
      // ==========================================

      // KPIs Principales
      const totalIngresos = (ventas || []).reduce((acc, v) => acc + Number(v.total), 0);
      const totalEgresos = (gastos || []).reduce((acc, g) => acc + Number(g.monto), 0);
      const cantidadVentas = (ventas || []).length;
      
      setMetrics({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        beneficio: totalIngresos - totalEgresos,
        ticketPromedio: cantidadVentas > 0 ? totalIngresos / cantidadVentas : 0,
        ventasTotales: cantidadVentas
      });

      // Gráfico de Líneas: Agrupación por día
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        dia: String(i + 1).padStart(2, '0'),
        ingresos: 0,
        egresos: 0
      }));

      (ventas || []).forEach(v => {
        const dia = new Date(v.created_at).getDate() - 1;
        dailyData[dia].ingresos += Number(v.total);
      });

      (gastos || []).forEach(g => {
        // En gastos usamos 'fecha' que es un string YYYY-MM-DD
        const dia = new Date(`${g.fecha}T12:00:00Z`).getDate() - 1; 
        if(dia >= 0 && dia < daysInMonth) dailyData[dia].egresos += Number(g.monto);
      });

      setTrendData(dailyData);

      // Agrupación para Top 5 y Gráfico de Torta
      const productSales = new Map<string, { nombre: string, cantidad: number, categoria: string }>();
      
      (ventas || []).forEach(v => {
        (v.venta_items || []).forEach((item: any) => {
          const cat = catalogMap.get(item.producto_id) || 'Otros';
          if (productSales.has(item.name)) {
            productSales.get(item.name)!.cantidad += item.quantity;
          } else {
            productSales.set(item.name, { nombre: item.name, cantidad: item.quantity, categoria: cat });
          }
        });
      });

      const allSoldProducts = Array.from(productSales.values());
      
      // Top 5 Productos
      setTopProducts(allSoldProducts.sort((a, b) => b.cantidad - a.cantidad).slice(0, 5));

      // Gráfico de Torta por Categorías
      const categorySales = new Map<string, number>();
      allSoldProducts.forEach(p => {
        categorySales.set(p.categoria, (categorySales.get(p.categoria) || 0) + p.cantidad);
      });

      setCategoryData(Array.from(categorySales.entries()).map(([name, value]) => ({ name, value })));

    } catch (error) {
      console.error('Error calculando el dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>Analizando métricas del negocio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      
      {/* CABECERA Y FILTRO DE MES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Resumen Financiero</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Visualiza el rendimiento de tu negocio.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Periodo:</span>
          <Input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-auto bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* 1. PANEL DE MÉTRICAS (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2 text-emerald-600 dark:text-emerald-400">
            <DollarSign size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Ingresos</h3>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${metrics.ingresos.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2 text-red-600 dark:text-red-400">
            <TrendingDown size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Gastos</h3>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${metrics.egresos.toLocaleString()}</p>
        </div>

        <div className={`bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1 ring-2 ${metrics.beneficio >= 0 ? 'ring-indigo-500/20' : 'ring-red-500/20'}`}>
          <div className={`flex items-center gap-3 mb-2 ${metrics.beneficio >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
            <TrendingUp size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Beneficio Neto</h3>
          </div>
          <p className={`text-3xl font-black ${metrics.beneficio >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            ${metrics.beneficio.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
            <Receipt size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">T. Promedio</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">${Math.round(metrics.ticketPromedio).toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
            <Package size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Ventas Tot.</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{metrics.ventasTotales}</p>
        </div>
      </div>

      {/* 2. GRÁFICOS (Evolución y Torta) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Líneas */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Evolución de Ingresos y Gastos</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any ) => [`$${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `Día ${label}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                <Line type="monotone" name="Ingresos" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Gastos" dataKey="egresos" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Torta */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-2">Ventas por Categoría</h3>
          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No hay datos para este mes.</div>
          ) : (
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} vendidos`, 'Cantidad']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 3. RANKING Y ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Productos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <h3 className="font-bold text-slate-800 dark:text-white">Top 5 Productos Más Vendidos</h3>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {topProducts.length === 0 ? (
                <li className="p-6 text-center text-slate-500 text-sm">Aún no hay ventas en este periodo.</li>
              ) : (
                topProducts.map((prod, index) => (
                  <li key={index} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black text-slate-300 dark:text-slate-600 w-4">{index + 1}</span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{prod.nombre}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{prod.categoria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold px-3 py-1 rounded-full text-sm">
                        {prod.cantidad} un.
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Alertas de Caducidad / Stock Crítico */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-950/20">
            <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={18} /> Alertas Críticas de Stock
            </h3>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {urgentAlerts.length === 0 ? (
                <li className="p-6 text-center text-slate-500 text-sm">Todo en orden. No hay alertas urgentes.</li>
              ) : (
                urgentAlerts.map((alerta) => (
                  <li key={alerta.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-l-4 border-red-500">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{alerta.nombre}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Stock actual: {alerta.cantidad} {alerta.unidad_medida}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        Requiere Reposición
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}