import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Cargo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export const CargosPage: React.FC = () => {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados para Modal (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    cargarCargos();
  }, []);

  const cargarCargos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch(`${API_URL}/cargos`, { headers });
      if (!res.ok) throw new Error('No se pudo obtener la lista de cargos.');

      const data = await res.json();
      const lista = Array.isArray(data) ? data : (data.data || []);
      setCargos(lista);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cargo?: Cargo) => {
    if (cargo) {
      setEditingCargo(cargo);
      setNombre(cargo.nombre);
      setDescripcion(cargo.descripcion || '');
    } else {
      setEditingCargo(null);
      setNombre('');
      setDescripcion('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCargo(null);
    setNombre('');
    setDescripcion('');
  };

  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del cargo es obligatorio.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const url = editingCargo 
        ? `${API_URL}/cargos/${editingCargo.id}` 
        : `${API_URL}/cargos`;
      
      const method = editingCargo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ nombre, descripcion })
      });

      if (!res.ok) throw new Error('Error al guardar el cargo.');

      setSuccessMessage(editingCargo ? 'Cargo actualizado exitosamente.' : 'Cargo registrado exitosamente.');
      setTimeout(() => setSuccessMessage(null), 3000);

      handleCloseModal();
      cargarCargos();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCargo = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este cargo?')) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch(`${API_URL}/cargos/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('No se pudo eliminar el cargo.');

      setSuccessMessage('Cargo eliminado correctamente.');
      setTimeout(() => setSuccessMessage(null), 3000);
      cargarCargos();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el cargo.');
    }
  };

  const cargosFiltrados = cargos.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans p-6">
      {/* Encabezado */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Módulo de Cargos</h1>
            <p className="text-xs text-neutral-500">Administra los cargos disponibles para las planchas electorales.</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center justify-center gap-2 bg-[#0a254a] text-white py-2 px-4 rounded-lg text-xs font-semibold hover:bg-blue-900 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nuevo Cargo
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="max-w-6xl mx-auto mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {successMessage}
        </div>
      )}

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Barra de búsqueda */}
        <div className="p-4 border-b border-neutral-200 flex items-center gap-3 bg-neutral-50/50">
          <Search className="h-4 w-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Buscar cargo por nombre o descripción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs outline-none text-neutral-800 placeholder-neutral-400"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a254a]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-200">
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Nombre del Cargo</th>
                  <th className="p-3.5">Descripción</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargosFiltrados.length > 0 ? (
                  cargosFiltrados.map((cargo, index) => (
                    <tr key={cargo.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                      <td className="p-3.5 text-neutral-500">{index + 1}</td>
                      <td className="p-3.5 font-bold text-neutral-900 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-sky-600" /> {cargo.nombre}
                      </td>
                      <td className="p-3.5 text-neutral-600">{cargo.descripcion || 'Sin descripción'}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button 
                          onClick={() => handleOpenModal(cargo)}
                          className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100"
                          title="Editar cargo"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCargo(cargo.id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          title="Eliminar cargo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-neutral-400 italic">
                      No se encontraron cargos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-bold text-neutral-900">
                {editingCargo ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}
              </h2>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCargo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Nombre del Cargo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Presidente, Secretario de Actas..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs outline-none focus:border-[#0a254a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Descripción (Opcional)</label>
                <textarea 
                  rows={3}
                  placeholder="Breve detalle de las funciones del cargo..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs outline-none focus:border-[#0a254a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0a254a] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCargo ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargosPage;