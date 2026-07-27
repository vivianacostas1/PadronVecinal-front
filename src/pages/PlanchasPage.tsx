import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Flag, 
  ChevronLeft, 
  Edit, 
  Trash2, 
  X, 
  Loader2,
  UserPlus
} from 'lucide-react';

interface Plancha {
  id: number;
  nombreFrente: string;
  color: string;
  usuarioId?: number;
}

export const PlanchasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planchas, setPlanchas] = useState<Plancha[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Función para verificar si el usuario actual es administrador
  const esAdministrador = () => {
    const userObj = localStorage.getItem('user');
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

  const obtenerUsuarioId = () => {
    const idDirecto = localStorage.getItem('userId');
    if (idDirecto) return Number(idDirecto);

    const userObj = localStorage.getItem('user');
    if (userObj) {
      try {
        const parsed = JSON.parse(userObj);
        if (parsed?.id) return Number(parsed.id);
      } catch (e) {
        console.error("Error al parsear el usuario del localStorage", e);
      }
    }
    return 1;
  };

  const [formulario, setFormulario] = useState({
    nombreFrente: '',
    color: '',
    usuarioId: obtenerUsuarioId()
  });

  useEffect(() => {
    fetchPlanchas();
  }, []);

  const fetchPlanchas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 

      const response = await fetch('http://localhost:3001/api/planchas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor o la sesión expiró.');
      }

      const data = await response.json();
      const listaPlanchas = Array.isArray(data) ? data : data.data || [];

      // Filtrar para ocultar Votos Blancos y Votos Nulos de la vista de planchas electorales
      const planchasFiltradas = listaPlanchas.filter((p: Plancha) => {
        const nombre = (p.nombreFrente || '').toLowerCase();
        return !nombre.includes('blanco') && !nombre.includes('nulo');
      });

      setPlanchas(planchasFiltradas);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener las planchas del servidor. Verifica que tu backend esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormulario({
      nombreFrente: '',
      color: '',
      usuarioId: obtenerUsuarioId()
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (plancha: Plancha) => {
    setEditandoId(plancha.id);
    setFormulario({
      nombreFrente: plancha.nombreFrente || '',
      color: plancha.color || '',
      usuarioId: obtenerUsuarioId()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const currentUserId = obtenerUsuarioId();

      const datosAEnviar = {
        nombreFrente: formulario.nombreFrente,
        color: formulario.color,
        usuarioId: currentUserId
      };

      const url = editandoId 
        ? `http://localhost:3001/api/planchas/${editandoId}` 
        : 'http://localhost:3001/api/planchas';
      
      const method = editandoId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosAEnviar)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Detalle del error del backend:", data);
        throw new Error(data.message || JSON.stringify(data) || 'Error al procesar la solicitud de la plancha.');
      }

      await fetchPlanchas();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`No se pudo guardar: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plancha electoral?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/planchas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el registro.');
      }

      await fetchPlanchas();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const filteredPlanchas = Array.isArray(planchas) ? planchas.filter(p => 
    p.nombreFrente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.color?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-neutral-900">Registro de Planchas / Frentes</h1>
            <p className="text-xs text-neutral-500">Gestión de listas electorales y colores</p>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Flag className="h-4 w-4" /> Nueva Plancha
          </button>
        )}
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de frente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
            />
          </div>
          <div className="text-xs text-neutral-500 font-medium">
            Total de planchas: <span className="font-bold text-neutral-900">{planchas.length}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <th className="p-3.5">Frente Electoral</th>
                  <th className="p-3.5">Color</th>
                  {isAdmin && <th className="p-3.5 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="text-center py-12 text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" />
                        <span>Cargando planchas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlanchas.length > 0 ? (
                  filteredPlanchas.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg shadow-sm border border-neutral-200 bg-blue-600 flex items-center justify-center text-white font-bold">
                          <Flag className="h-4 w-4 drop-shadow" />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{p.nombreFrente}</p>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-700">
                        <span className="font-medium text-neutral-900 capitalize">
                          {p.color}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-right space-x-2">
                          <button 
                            onClick={() => navigate(`/planchas/${p.id}/integrantes`)} 
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-600 transition-colors" 
                            title="Agregar Integrantes / Candidatos"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>

                          <button 
                            onClick={() => abrirModalEditar(p)} 
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition-colors" 
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600 transition-colors" 
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="text-center py-8 text-neutral-400">
                      No hay planchas electorales registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Crear / Editar Plancha - Solo accesible si es admin */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#1e40af]" /> 
                {editandoId ? 'Editar Plancha' : 'Registrar Nueva Plancha'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nombre del Frente Electoral</label>
                <input 
                  type="text" 
                  name="nombreFrente" 
                  required
                  value={formulario.nombreFrente} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                  placeholder="Ej. Frente Unido Vecinal"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Color (Literal)</label>
                <input 
                  type="text" 
                  name="color" 
                  required
                  value={formulario.color} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                  placeholder="Ej. Azul, Rojo, Verde Oscuro"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#1e40af] hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  {editandoId ? 'Guardar Cambios' : 'Registrar Plancha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};