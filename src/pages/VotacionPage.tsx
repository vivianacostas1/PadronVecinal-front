import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, ShieldAlert, CheckCircle2, BarChart3, Lock, AlertTriangle } from 'lucide-react';

interface Plancha {
  id: number;
  nombreFrente?: string;
  nombre?: string;
  color: string;
}

export const VotacionPage: React.FC = () => {
  const navigate = useNavigate();

  const esAdministrador = () => {
    const userObj = localStorage.getItem('user') || localStorage.getItem('usuario');
    if (userObj) {
      try {
        const parsed = JSON.parse(userObj);
        if (parsed?.rol === 'administrador' || parsed?.role === 'administrador') {
          return true;
        }
      } catch (e) {
        console.error("Error al parsear el usuario del localStorage", e);
      }
    }
    const roleDirecto = localStorage.getItem('rol') || localStorage.getItem('role');
    return roleDirecto === 'administrador';
  };

  const isAdmin = esAdministrador();

  const [planchasReales, setPlanchasReales] = useState<Plancha[]>([]);
  const [planchaNulosId, setPlanchaNulosId] = useState<number | null>(null);
  const [planchaBlancosId, setPlanchaBlancosId] = useState<number | null>(null);

  const [votosPorPlancha, setVotosPorPlancha] = useState<{ [key: number]: string }>({});
  const [votosNulos, setVotosNulos] = useState<string>('0');
  const [votosBlancos, setVotosBlancos] = useState<string>('0');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [votacionCerrada, setVotacionCerrada] = useState<boolean>(false);

  // Estado para controlar el modal de confirmación
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState<boolean>(false);

  useEffect(() => {
    if (isAdmin) {
      verificarEstadoYcargarDatos();
    }
  }, [isAdmin]);

  const verificarEstadoYcargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const resResultados = await fetch('http://localhost:3001/api/resultados', { headers }).catch(() => null);
      if (resResultados && resResultados.ok) {
        const dataRes = await resResultados.json();
        const listaRes = Array.isArray(dataRes) ? dataRes : (dataRes.data || []);
        if (listaRes.length > 0) {
          setVotacionCerrada(true);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('http://localhost:3001/api/planchas', { headers });
      if (!response.ok) throw new Error('No se pudo cargar la lista de planchas.');

      const data = await response.json();
      const listaPlanchas: Plancha[] = Array.isArray(data) ? data : (data.data || []);

      const nulosObj = listaPlanchas.find(p => {
        const nombre = (p.nombreFrente || p.nombre || '').toLowerCase();
        return nombre.includes('nulo');
      });

      const blancosObj = listaPlanchas.find(p => {
        const nombre = (p.nombreFrente || p.nombre || '').toLowerCase();
        return nombre.includes('blanco');
      });

      if (nulosObj) setPlanchaNulosId(nulosObj.id);
      if (blancosObj) setPlanchaBlancosId(blancosObj.id);

      const reales = listaPlanchas.filter(p => p.id !== nulosObj?.id && p.id !== blancosObj?.id);
      setPlanchasReales(reales);

      const inicialVotos: { [key: number]: string } = {};
      reales.forEach((p) => {
        inicialVotos[p.id] = '0';
      });
      setVotosPorPlancha(inicialVotos);

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCambioVotoPlancha = (planchaId: number, valor: string) => {
    setVotosPorPlancha(prev => ({
      ...prev,
      [planchaId]: valor
    }));
  };

  // Función que se ejecuta cuando el usuario hace clic en el botón inicial del formulario
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarModalConfirmacion(true);
  };

  // Función que realmente ejecuta el guardado tras confirmar en el modal
  const confirmarGuardarVotacion = async () => {
    setMostrarModalConfirmacion(false);
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      const usuarioStr = localStorage.getItem('usuario') || localStorage.getItem('user');
      let registradoPorId = 1; 
      
      if (usuarioStr) {
        try {
          const usuarioObj = JSON.parse(usuarioStr);
          registradoPorId = usuarioObj.id || usuarioObj.usuarioId || 1;
        } catch (e) {
          registradoPorId = Number(usuarioStr) || 1;
        }
      }

      const peticiones: Promise<any>[] = [];

      Object.keys(votosPorPlancha).forEach(pId => {
        const payload = {
          planchaId: Number(pId),
          cantidadVotos: Number(votosPorPlancha[Number(pId)]) || 0,
          registradoPorId: Number(registradoPorId)
        };

        peticiones.push(
          fetch('http://localhost:3001/api/resultados', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al registrar la votación.');
            return data;
          })
        );
      });

      if (planchaNulosId !== null) {
        const payloadNulos = {
          planchaId: planchaNulosId,
          cantidadVotos: Number(votosNulos) || 0,
          registradoPorId: Number(registradoPorId)
        };

        peticiones.push(
          fetch('http://localhost:3001/api/resultados', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadNulos)
          }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al registrar votos nulos.');
            return data;
          })
        );
      }

      if (planchaBlancosId !== null) {
        const payloadBlancos = {
          planchaId: planchaBlancosId,
          cantidadVotos: Number(votosBlancos) || 0,
          registradoPorId: Number(registradoPorId)
        };

        peticiones.push(
          fetch('http://localhost:3001/api/resultados', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadBlancos)
          }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al registrar votos blancos.');
            return data;
          })
        );
      }

      await Promise.all(peticiones);

      setSuccessMessage('¡Votación registrada exitosamente!');
      setVotacionCerrada(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los votos.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full space-y-4">
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-base font-bold text-neutral-900">Acceso Restringido</h1>
          <p className="text-xs text-neutral-500">
            No tienes los permisos necesarios para ingresar al módulo de votación. Esta sección es exclusiva para administradores.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 w-full bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
      </div>
    );
  }

  if (votacionCerrada) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans flex flex-col">
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#1e40af]" /> Registro de Votación General
              </h1>
              <p className="text-xs text-neutral-500">Estado del proceso electoral.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-xl mx-auto w-full flex items-center justify-center">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center space-y-4 shadow-sm w-full">
            <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">El proceso de votación ya fue cerrado</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              El registro de votos ya fue completado con anterioridad en este sistema. Por seguridad y normativas electorales, no se permiten modificaciones ni nuevos ingresos.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 w-full bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors mt-2"
            >
              <ChevronLeft className="h-4 w-4" /> Volver al Dashboard
            </button>
          </div>
        </main>
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
              <BarChart3 className="h-5 w-5 text-[#1e40af]" /> Registro de Votación General
            </h1>
            <p className="text-xs text-neutral-500">Ingrese los votos válidos por frente y los votos generales de la mesa.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmitClick} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 font-bold text-xs text-neutral-900 bg-neutral-50">
              Votos Válidos por Plancha / Frente
            </div>
            <div className="divide-y divide-neutral-200">
              {planchasReales.length > 0 ? (
                planchasReales.map((plancha) => {
                  const nombreFrente = plancha.nombreFrente || plancha.nombre || `Plancha #${plancha.id}`;
                  return (
                    <div key={plancha.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50">
                      <div>
                        <h3 className="font-bold text-neutral-900 text-sm">{nombreFrente}</h3>
                        <p className="text-xs text-neutral-500 uppercase">Color: <span className="font-semibold">{plancha.color || 'N/D'}</span></p>
                      </div>
                      <div className="w-40">
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Votos Válidos</label>
                        <input
                          type="number"
                          min="0"
                          value={votosPorPlancha[plancha.id] ?? '0'}
                          onChange={(e) => handleCambioVotoPlancha(plancha.id, e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  No hay planchas reales registradas en el sistema.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-sm font-bold text-neutral-900 mb-3">Votos Generales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Votos Nulos</label>
                <input
                  type="number"
                  min="0"
                  value={votosNulos}
                  onChange={(e) => setVotosNulos(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Votos Blancos</label>
                <input
                  type="number"
                  min="0"
                  value={votosBlancos}
                  onChange={(e) => setVotosBlancos(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || planchasReales.length === 0}
              className="px-6 py-2.5 bg-[#1e40af] hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 text-xs"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Registro de Votación
            </button>
          </div>
        </form>
      </main>

      {/* Modal de Confirmación de Cierre de Votación */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-neutral-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">¿Estás seguro de cerrar la votación?</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Esta acción registrará los votos definitivamente y no se podrá ingresar después.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalConfirmacion(false)}
                className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarGuardarVotacion}
                className="px-4 py-2 bg-[#1e40af] hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Sí, cerrar votación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};