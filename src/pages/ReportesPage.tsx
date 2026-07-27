import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer, ArrowLeft, Users, Layers, Loader2, ShieldAlert } from 'lucide-react';

interface Integrante {
  id: number;
  cargo?: { nombre: string };
  vecino?: { nombre: string; primerApellido: string; segundoApellido?: string; numeroCarnet: string };
}

interface Plancha {
  id: number;
  nombreFrente: string;
  color: string;
  candidato?: Integrante[];
  resultado?: { cantidadVotos: number };
}

interface Vecino {
  id: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroCarnet: string;
  direccion: string;
  manzano: string;
  tipoResidencia: string;
}

export const ReportesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [planchas, setPlanchas] = useState<Plancha[]>([]);
  const [vecinos, setVecinos] = useState<Vecino[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Controla qué reporte se muestra en la vista previa interactiva antes de imprimir
  const [vistaActiva, setVistaActiva] = useState<'ninguno' | 'padron' | 'resultados' | 'planchasIntegrantes' | 'listaPlanchas'>('ninguno');

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  const cargarDatosGenerales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resPlanchas, resVecinos] = await Promise.all([
        fetch('http://localhost:3002/api/planchas', { headers }),
        fetch('http://localhost:3002/api/vecinos', { headers })
      ]);

      if (!resPlanchas.ok || !resVecinos.ok) {
        throw new Error('No se pudieron obtener los datos de la base de datos.');
      }

      const dataPlanchas = await resPlanchas.json();
      const dataVecinos = await resVecinos.json();

      const listaPlanchas = Array.isArray(dataPlanchas) ? dataPlanchas : (dataPlanchas.data || []);
      const listaVecinos = Array.isArray(dataVecinos) ? dataVecinos : (dataVecinos.data || []);

      setPlanchas(listaPlanchas);
      setVecinos(listaVecinos);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir la ventana de impresión con un retraso seguro para evitar hojas en blanco
  const handlePrint = (tipo: 'padron' | 'resultados' | 'planchas' | 'general') => {
    setVistaActiva(tipo === 'padron' ? 'padron' : tipo === 'resultados' ? 'resultados' : tipo === 'planchas' ? 'planchasIntegrantes' : 'listaPlanchas');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans p-6">
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Módulo de Reportes Oficiales</h1>
            <p className="text-xs text-neutral-500">Generación y exportación de padrones, actas y planchas electorales.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2 print:hidden">
          <ShieldAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Cuadrícula de Reportes (Oculto al imprimir) */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        
        {/* 1. Padrón Electoral de Vecinos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText className="h-6 w-6" /></div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Padrón Electoral de Vecinos</h2>
              <p className="text-xs text-neutral-500 mt-1">Listado oficial completo de vecinos habilitados ({vecinos.length} registros).</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button onClick={() => handlePrint('padron')} className="flex-1 flex items-center justify-center gap-2 bg-[#0a254a] text-white py-2 px-4 rounded-lg text-xs font-semibold hover:bg-blue-900">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
            <button onClick={() => setVistaActiva(vistaActiva === 'padron' ? 'ninguno' : 'padron')} className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-700 py-2 px-4 rounded-lg text-xs font-semibold hover:bg-neutral-200">
              {vistaActiva === 'padron' ? 'Ocultar' : 'Ver Vista Previa'}
            </button>
          </div>
        </div>

        {/* 2. Acta de Resultados Finales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><FileText className="h-6 w-6" /></div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Acta de Resultados Finales</h2>
              <p className="text-xs text-neutral-500 mt-1">Consolidado general de votos por cada frente político.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button onClick={() => handlePrint('resultados')} className="flex-1 flex items-center justify-center gap-2 bg-[#0a254a] text-white py-2 px-4 rounded-lg text-xs font-semibold hover:bg-blue-900">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
            <button onClick={() => setVistaActiva(vistaActiva === 'resultados' ? 'ninguno' : 'resultados')} className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-700 py-2 px-4 rounded-lg text-xs font-semibold hover:bg-neutral-200">
              {vistaActiva === 'resultados' ? 'Ocultar' : 'Ver Vista Previa'}
            </button>
          </div>
        </div>

        {/* 3. Reporte de Planchas con sus Integrantes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users className="h-6 w-6" /></div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Planchas y sus Integrantes</h2>
              <p className="text-xs text-neutral-500 mt-1">Detalle de candidatos y cargos postulados por frente.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button onClick={() => handlePrint('planchas')} className="flex-1 flex items-center justify-center gap-2 bg-[#0a254a] text-white py-2 px-4 rounded-lg text-xs font-semibold hover:bg-blue-900">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
            <button onClick={() => setVistaActiva(vistaActiva === 'planchasIntegrantes' ? 'ninguno' : 'planchasIntegrantes')} className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-700 py-2 px-4 rounded-lg text-xs font-semibold hover:bg-neutral-200">
              {vistaActiva === 'planchasIntegrantes' ? 'Ocultar' : 'Ver Vista Previa'}
            </button>
          </div>
        </div>

        {/* 4. Listado General de Planchas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Layers className="h-6 w-6" /></div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Listado General de Planchas</h2>
              <p className="text-xs text-neutral-500 mt-1">Resumen oficial de frentes registrados en el sistema.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button onClick={() => handlePrint('general')} className="flex-1 flex items-center justify-center gap-2 bg-[#0a254a] text-white py-2 px-4 rounded-lg text-xs font-semibold hover:bg-blue-900">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
            <button onClick={() => setVistaActiva(vistaActiva === 'listaPlanchas' ? 'ninguno' : 'listaPlanchas')} className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-700 py-2 px-4 rounded-lg text-xs font-semibold hover:bg-neutral-200">
              {vistaActiva === 'listaPlanchas' ? 'Ocultar' : 'Ver Vista Previa'}
            </button>
          </div>
        </div>

      </div>

      {/* ÁREA DE VISTA PREVIA E IMPRESIÓN */}
      {vistaActiva !== 'ninguno' && (
        <div className="max-w-6xl mx-auto mt-8 bg-white p-8 rounded-xl shadow-sm border border-neutral-200 space-y-6 print:m-0 print:p-0 print:shadow-none print:border-none">
          
          {/* Encabezado del documento impreso */}
          <div className="border-b border-neutral-300 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900">PADRÓN VECINAL - REPORTE OFICIAL</h2>
              <p className="text-xs text-neutral-500">Fecha de emisión: {new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={() => setVistaActiva('ninguno')} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold print:hidden">
              Cerrar Vista Previa
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0a254a]" />
            </div>
          ) : (
            <div>
              {/* VISTA 1: PADRÓN ELECTORAL DE VECINOS */}
              {vistaActiva === 'padron' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase">Listado Oficial de Vecinos Empadronados</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Apellidos y Nombres</th>
                        <th className="p-2.5">Nº Carnet</th>
                        <th className="p-2.5">Dirección / Manzano</th>
                        <th className="p-2.5">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vecinos.map((v, index) => (
                        <tr key={v.id} className="border-b border-neutral-200">
                          <td className="p-2.5">{index + 1}</td>
                          <td className="p-2.5 font-bold">{v.primerApellido} {v.segundoApellido || ''}, {v.nombre}</td>
                          <td className="p-2.5">{v.numeroCarnet}</td>
                          <td className="p-2.5">{v.direccion} (Mz. {v.manzano})</td>
                          <td className="p-2.5 capitalize">{v.tipoResidencia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 2: ACTA DE RESULTADOS */}
              {vistaActiva === 'resultados' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase">Consolidado de Resultados Electorales</h3>
                  <p className="text-xs text-neutral-500">Reporte oficial generado directamente desde el módulo de cómputo de votos.</p>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300">
                        <th className="p-2.5">Frente / Plancha</th>
                        <th className="p-2.5">Color</th>
                        <th className="p-2.5 text-right">Cantidad de Votos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planchas.map((p) => (
                        <tr key={p.id} className="border-b border-neutral-200">
                          <td className="p-2.5 font-bold">{p.nombreFrente}</td>
                          <td className="p-2.5 capitalize">{p.color}</td>
                          <td className="p-2.5 text-right font-bold text-blue-900">{p.resultado?.cantidadVotos || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 3: PLANCHAS CON SUS INTEGRANTES */}
              {vistaActiva === 'planchasIntegrantes' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase">Detalle de Postulantes por Plancha</h3>
                  {planchas.map(p => (
                    <div key={p.id} className="border border-neutral-300 rounded-lg p-4 bg-neutral-50 space-y-3">
                      <h4 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide bg-neutral-200 p-2 rounded">
                        Frente: {p.nombreFrente || 'Sin nombre'}
                      </h4>
                      <table className="w-full text-left text-xs border-collapse bg-white">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-600">
                            <th className="p-2">Cargo</th>
                            <th className="p-2">Postulante</th>
                            <th className="p-2">Nº Carnet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.candidato && p.candidato.length > 0 ? (
                            p.candidato.map((c) => (
                              <tr key={c?.id || Math.random()} className="border-b border-neutral-100">
                                <td className="p-2 font-semibold text-blue-900">{c?.cargo?.nombre || 'Cargo no asignado'}</td>
                                <td className="p-2 font-bold">
                                  {c?.vecino ? `${c.vecino.primerApellido || ''} ${c.vecino.segundoApellido || ''}, ${c.vecino.nombre || ''}` : 'Vecino no asignado'}
                                </td>
                                <td className="p-2">{c?.vecino?.numeroCarnet || 'S/N'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-2 text-neutral-400 italic">No hay candidatos registrados para esta plancha.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* VISTA 4: LISTADO GENERAL DE PLANCHAS */}
              {vistaActiva === 'listaPlanchas' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase">Listado General de Frentes Registrados</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300">
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Nombre del Frente</th>
                        <th className="p-2.5">Color Identificativo</th>
                        <th className="p-2.5 text-right">Total Candidatos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planchas.map(p => (
                        <tr key={p.id} className="border-b border-neutral-200">
                          <td className="p-2.5">{p.id}</td>
                          <td className="p-2.5 font-bold">{p.nombreFrente}</td>
                          <td className="p-2.5 capitalize">{p.color}</td>
                          <td className="p-2.5 text-right font-semibold">{p.candidato?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportesPage;