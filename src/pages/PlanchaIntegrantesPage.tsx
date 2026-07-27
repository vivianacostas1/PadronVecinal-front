import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, UserPlus, Trash2, Loader2, ShieldAlert, Search, X } from 'lucide-react';

interface Vecino {
  id: number;
  nombre: string;
  primerApellido?: string;
  segundoApellido?: string;
  apellido?: string;
  ci?: string;
  nroCi?: string;
  nro_ci?: string;
  numero_carnet?: string;
  documento?: string;
  dni?: string;
  carnet?: string;
}

interface Cargo {
  id: number;
  nombre: string;
}

interface Candidato {
  id: number;
  planchaId?: number;
  plancha_id?: number;
  vecino?: Vecino;
  cargo?: Cargo;
  vecinoId?: number;
  vecino_id?: number;
  cargoId?: number;
  cargo_id?: number;
  ci?: string;
  nroCi?: string;
  nro_ci?: string;
  numero_carnet?: string;
  documento?: string;
}

interface Plancha {
  id: number;
  nombreFrente?: string;
  nombre?: string;
  color: string;
}

export const PlanchaIntegrantesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [plancha, setPlancha] = useState<Plancha | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [todosLosCandidatos, setTodosLosCandidatos] = useState<Candidato[]>([]);
  const [vecinos, setVecinos] = useState<Vecino[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [vecinoId, setVecinoId] = useState<string>('');
  const [busquedaVecino, setBusquedaVecino] = useState<string>('');
  const [mostrarDropdown, setMostrarDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cargoId, setCargoId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      cargarDatosIniciales();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const resPlancha = await fetch(`http://localhost:3001/api/planchas/${id}`, { headers });
      if (resPlancha.ok) {
        const dataPlancha = await resPlancha.json();
        setPlancha(dataPlancha);
      } else {
        setPlancha({ id: Number(id), nombreFrente: `Plancha #${id}`, color: 'N/D' });
      }

      const resCandidatos = await fetch(`http://localhost:3001/api/candidatos`, { headers });
      if (resCandidatos.ok) {
        const dataCandidatos = await resCandidatos.json();
        const listaCandidatos = Array.isArray(dataCandidatos) ? dataCandidatos : (dataCandidatos.data || []);
        setTodosLosCandidatos(listaCandidatos);
        
        const filtradosPorPlancha = listaCandidatos.filter(
          (c: any) => String(c.planchaId || c.plancha_id) === String(id)
        );
        setCandidatos(filtradosPorPlancha);
      }

      const resVecinos = await fetch('http://localhost:3001/api/vecinos', { headers });
      if (resVecinos.ok) {
        const dataVecinos = await resVecinos.json();
        const listaVecinos = Array.isArray(dataVecinos) ? dataVecinos : (dataVecinos.data || []);
        setVecinos(listaVecinos);
      }

      const resCargos = await fetch('http://localhost:3001/api/cargos', { headers });
      if (resCargos.ok) {
        const dataCargos = await resCargos.json();
        setCargos(Array.isArray(dataCargos) ? dataCargos : (dataCargos.data || []));
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // Función universal actualizada con 'numero_carnet' como prioridad principal
  const obtenerCi = (vecinoObj?: Vecino, candidatoObj?: Candidato): string => {
    if (vecinoObj) {
      const val = vecinoObj.numero_carnet || vecinoObj.ci || vecinoObj.nroCi || vecinoObj.nro_ci || vecinoObj.documento || vecinoObj.dni || vecinoObj.carnet;
      if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
    }
    if (candidatoObj) {
      const val = candidatoObj.numero_carnet || candidatoObj.ci || candidatoObj.nroCi || candidatoObj.nro_ci || candidatoObj.documento;
      if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
      
      const anyCand: any = candidatoObj;
      const subVecino = anyCand.Vecino || anyCand.persona || anyCand.vecinoData;
      if (subVecino) {
        const subVal = subVecino.numero_carnet || subVecino.ci || subVecino.nroCi || subVecino.nro_ci || subVecino.documento || subVecino.dni || subVecino.carnet;
        if (subVal !== undefined && subVal !== null && String(subVal).trim() !== '') return String(subVal);
      }
    }
    return '';
  };

  const vecinosFiltrados = vecinos.filter((v) => {
    const ciVal = obtenerCi(v);
    const texto = `${v.nombre} ${v.primerApellido || ''} ${v.segundoApellido || v.apellido || ''} ${ciVal}`.toLowerCase();
    return texto.includes(busquedaVecino.toLowerCase());
  });

  const handleSeleccionarVecino = (vecino: Vecino) => {
    setVecinoId(String(vecino.id));
    const pApp = vecino.primerApellido || '';
    const sApp = vecino.segundoApellido || vecino.apellido || '';
    const ciVal = obtenerCi(vecino);
    setBusquedaVecino(`${vecino.nombre} ${pApp} ${sApp} ${ciVal ? `(CI: ${ciVal})` : ''}`);
    setMostrarDropdown(false);
  };

  const handleLimpiarVecinoSeleccionado = () => {
    setVecinoId('');
    setBusquedaVecino('');
  };

  const handleAgregarIntegrante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vecinoId || !cargoId) {
      alert('Seleccione un vecino y un cargo.');
      return;
    }

    const vecinoYaInscrito = todosLosCandidatos.find(
      (c: any) => String(c.vecinoId || c.vecino_id) === String(vecinoId)
    );

    if (vecinoYaInscrito) {
      const planchaAsignadaId = vecinoYaInscrito.planchaId || vecinoYaInscrito.plancha_id;
      alert(`⚠️ Este vecino ya se encuentra registrado como integrante en la Plancha #${planchaAsignadaId}. Un vecino no puede estar en dos o más planchas al mismo tiempo.`);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3001/api/candidatos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planchaId: Number(id),
          vecinoId: Number(vecinoId),
          cargoId: Number(cargoId)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el integrante.');
      }

      handleLimpiarVecinoSeleccionado();
      setCargoId('');
      await cargarDatosIniciales();
    } catch (err: any) {
      alert(`No se pudo registrar: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarIntegrante = async (candidatoId: number) => {
    if (!window.confirm('¿Desea quitar a este integrante de la plancha?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/candidatos/${candidatoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('No se pudo eliminar el registro.');
      await cargarDatosIniciales();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
      </div>
    );
  }

  const nombreFrenteReal = plancha?.nombreFrente || plancha?.nombre || `Plancha #${id}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/planchas" className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-neutral-900">
              Gestión de Integrantes - <span className="text-[#1e40af]">{nombreFrenteReal}</span>
            </h1>
            <p className="text-xs text-neutral-500">Color de frente: <span className="font-semibold uppercase">{plancha?.color || 'N/D'}</span></p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200">
          <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#1e40af]" /> Asignar Vecino a Cargo en la Plancha
          </h2>
          <form onSubmit={handleAgregarIntegrante} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="relative" ref={dropdownRef}>
              <label className="block font-semibold text-neutral-700 mb-1">Buscar Vecino (Nombre, Apellido o CI)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escriba para buscar..."
                  value={busquedaVecino}
                  onChange={(e) => {
                    setBusquedaVecino(e.target.value);
                    setMostrarDropdown(true);
                    if (!e.target.value) setVecinoId('');
                  }}
                  onFocus={() => setMostrarDropdown(true)}
                  className="w-full pl-8 pr-8 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                {busquedaVecino && (
                  <button
                    type="button"
                    onClick={handleLimpiarVecinoSeleccionado}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {mostrarDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg">
                  {vecinosFiltrados.length > 0 ? (
                    vecinosFiltrados.map((v) => {
                      const pApp = v.primerApellido || '';
                      const sApp = v.segundoApellido || v.apellido || '';
                      const ciVal = obtenerCi(v);
                      return (
                        <div
                          key={v.id}
                          onClick={() => handleSeleccionarVecino(v)}
                          className="px-3 py-2 hover:bg-neutral-100 cursor-pointer border-b border-neutral-100 last:border-none"
                        >
                          <p className="font-semibold text-neutral-900">{v.nombre} {pApp} {sApp}</p>
                          <p className="text-[11px] text-neutral-500">CI: {ciVal || 'No registrado'}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-center text-neutral-400">
                      No se encontraron vecinos con ese criterio.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Seleccionar Cargo</label>
              <select
                value={cargoId}
                onChange={(e) => setCargoId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
              >
                <option value="">-- Seleccione un cargo --</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-[#1e40af] hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Registrar Integrante
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 font-bold text-xs text-neutral-900">
            Integrantes Actuales de la Plancha ({candidatos.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <th className="p-3.5">Cargo</th>
                  <th className="p-3.5">Vecino Integrante</th>
                  <th className="p-3.5">CI / Identificación</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {candidatos.length > 0 ? (
                  candidatos.map((c) => {
                    const vecinoIdVal = c.vecinoId || c.vecino_id;
                    const vecinoObj = c.vecino || vecinos.find(v => Number(v.id) === Number(vecinoIdVal));
                    const cargoIdVal = c.cargoId || c.cargo_id;
                    const cargoObj = c.cargo || cargos.find(ca => Number(ca.id) === Number(cargoIdVal));

                    const pApp = vecinoObj?.primerApellido || '';
                    const sApp = vecinoObj?.segundoApellido || vecinoObj?.apellido || '';
                    
                    const ciFinal = obtenerCi(vecinoObj, c);

                    return (
                      <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3.5 font-bold text-[#1e40af]">
                          {cargoObj?.nombre || 'Sin cargo'}
                        </td>
                        <td className="p-3.5 font-medium text-neutral-900">
                          {vecinoObj ? `${vecinoObj.nombre} ${pApp} ${sApp}` : 'Vecino no encontrado'}
                        </td>
                        <td className="p-3.5 text-neutral-600 font-mono">
                          {ciFinal || 'No registrado'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleEliminarIntegrante(c.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600 transition-colors"
                            title="Eliminar integrante"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-neutral-400">
                      Aún no hay integrantes registrados en esta plancha.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};