import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BarChart3, PieChart, Award, Users, Loader2, ShieldAlert, LayoutList } from 'lucide-react';

interface Resultado {
  id: number;
  planchaId: number;
  cantidadVotos: number;
  plancha?: {
    id: number;
    nombreFrente?: string;
    nombre?: string;
    color: string;
  };
}

export const ResultadosPage: React.FC = () => {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para alternar entre vistas dentro de la misma página
  const [vistaActiva, setVistaActiva] = useState<'cuadros' | 'graficos'>('cuadros');

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resResultados, resPlanchas] = await Promise.all([
        fetch('http://localhost:3001/api/resultados', { headers }),
        fetch('http://localhost:3001/api/planchas', { headers })
      ]);

      if (!resResultados.ok || !resPlanchas.ok) {
        throw new Error('No se pudieron cargar los datos estadísticos.');
      }

      const dataResultados = await resResultados.json();
      const dataPlanchas = await resPlanchas.json();

      const listaResultados = Array.isArray(dataResultados) ? dataResultados : (dataResultados.data || []);
      const listaPlanchas = Array.isArray(dataPlanchas) ? dataPlanchas : (dataPlanchas.data || []);

      const resultadosConPlancha = listaResultados.map((item: any) => {
        const planchaEncontrada = listaPlanchas.find((p: any) => p.id === item.planchaId);
        return {
          ...item,
          plancha: planchaEncontrada || { id: item.planchaId, nombreFrente: `Plancha #${item.planchaId}`, color: 'neutral' }
        };
      });

      setResultados(resultadosConPlancha);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const totalVotos = resultados.reduce((acc, curr) => acc + Number(curr.cantidadVotos || 0), 0);

  const resultadosPlanchasReales = resultados.filter(r => {
    const nombre = (r.plancha?.nombreFrente || r.plancha?.nombre || '').toLowerCase();
    return !nombre.includes('nulo') && !nombre.includes('blanco');
  });

  const votosNulosObj = resultados.find(r => {
    const nombre = (r.plancha?.nombreFrente || r.plancha?.nombre || '').toLowerCase();
    return nombre.includes('nulo');
  });

  const votosBlancosObj = resultados.find(r => {
    const nombre = (r.plancha?.nombreFrente || r.plancha?.nombre || '').toLowerCase();
    return nombre.includes('blanco');
  });

  const totalNulos = Number(votosNulosObj?.cantidadVotos || 0);
  const totalBlancos = Number(votosBlancosObj?.cantidadVotos || 0);
  const totalValidos = resultadosPlanchasReales.reduce((acc, curr) => acc + Number(curr.cantidadVotos || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#1e40af]" /> Resultados y Estadísticas de Votación
            </h1>
            <p className="text-xs text-neutral-500">Consolidado general de la elección y distribución de votos.</p>
          </div>
        </div>

        {/* Botones para alternar vistas en la misma página */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold">
          <button
            onClick={() => setVistaActiva('cuadros')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              vistaActiva === 'cuadros' 
                ? 'bg-white text-[#1e40af] shadow-sm' 
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LayoutList className="h-4 w-4" /> Cuadros Estadísticos
          </button>
          <button
            onClick={() => setVistaActiva('graficos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              vistaActiva === 'graficos' 
                ? 'bg-white text-[#1e40af] shadow-sm' 
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieChart className="h-4 w-4" /> Vista Gráfica
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Tarjetas Resumen Superiores incluyendo el Total General */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Total General (Planchas + Nulos + Blancos)</p>
              <h3 className="text-2xl font-extrabold text-[#1e40af] mt-1">{totalVotos}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-[#1e40af] rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Votos Válidos (Planchas)</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{totalValidos}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Nulos y Blancos</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{totalNulos + totalBlancos}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <PieChart className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* CONTENIDO CONDICIONAL SEGÚN EL BOTÓN SELECCIONADO */}
        {vistaActiva === 'cuadros' ? (
          /* VISTA 1: CUADROS ESTADÍSTICOS Y BARRAS DE PORCENTAJE */
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-neutral-200 font-bold text-xs text-neutral-900 bg-neutral-50 flex items-center justify-between">
              <span>Distribución de Votos por Frente / Plancha</span>
              <span className="text-neutral-500 font-normal">Porcentaje sobre votos totales</span>
            </div>
            <div className="p-6 space-y-5">
              {resultadosPlanchasReales.length > 0 ? (
                resultadosPlanchasReales.map((item) => {
                  const nombreFrente = item.plancha?.nombreFrente || item.plancha?.nombre || `Plancha #${item.planchaId}`;
                  const cantidad = Number(item.cantidadVotos || 0);
                  const porcentaje = totalVotos > 0 ? ((cantidad / totalVotos) * 100).toFixed(1) : '0';

                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-900">{nombreFrente}</span>
                        <span className="text-neutral-600">{cantidad} votos ({porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-[#1e40af] h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-neutral-400 text-xs py-4">No hay resultados de planchas registrados aún.</p>
              )}

              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-700">Votos Nulos</span>
                    <span className="text-neutral-600">{totalNulos} votos ({totalVotos > 0 ? ((totalNulos / totalVotos) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${totalVotos > 0 ? (totalNulos / totalVotos) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-700">Votos Blancos</span>
                    <span className="text-neutral-600">{totalBlancos} votos ({totalVotos > 0 ? ((totalBlancos / totalVotos) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-neutral-400 h-2.5 rounded-full" style={{ width: `${totalVotos > 0 ? (totalBlancos / totalVotos) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA 2: BLOQUE DE GRÁFICOS VISUALES */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1e40af]" /> Comparativa de Votos Válidos
              </h3>
              <div className="space-y-3 pt-2">
                {resultadosPlanchasReales.map(item => {
                  const nombre = item.plancha?.nombreFrente || item.plancha?.nombre || `Plancha #${item.planchaId}`;
                  const cant = Number(item.cantidadVotos || 0);
                  const maxVotos = Math.max(...resultadosPlanchasReales.map(r => Number(r.cantidadVotos || 0)), 1);
                  const anchoBarra = (cant / maxVotos) * 100;

                  return (
                    <div key={item.id} className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-neutral-800">
                        <span>{nombre}</span>
                        <span className="text-[#1e40af]">{cant} votos</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${anchoBarra}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 mb-4">
                  <PieChart className="h-4 w-4 text-[#1e40af]" /> Proporción General de la Elección
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-900 rounded-lg font-semibold border border-blue-100">
                    <span>Total General Emitidos</span>
                    <span className="text-sm font-bold">{totalVotos} (100%)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-lg font-semibold border border-emerald-100">
                    <span>Total Votos Válidos</span>
                    <span className="text-sm font-bold">{totalValidos} ({totalVotos > 0 ? ((totalValidos / totalVotos) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-800 rounded-lg font-semibold border border-amber-100">
                    <span>Total Votos Nulos</span>
                    <span className="text-sm font-bold">{totalNulos} ({totalVotos > 0 ? ((totalNulos / totalVotos) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-100 text-neutral-800 rounded-lg font-semibold border border-neutral-200">
                    <span>Total Votos Blancos</span>
                    <span className="text-sm font-bold">{totalBlancos} ({totalVotos > 0 ? ((totalBlancos / totalVotos) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 text-center pt-2">
                Los gráficos se actualizan de forma automática según el registro de actas.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};



