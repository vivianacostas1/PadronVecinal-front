import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  ChevronLeft, 
  Edit, 
  Trash2, 
  X, 
  MapPin,
  Loader2,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Vecino {
  id: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroCarnet: string;
  direccion: string;
  manzano: string;
  numeroFolio: string;
  tipoResidencia: string;
}

export const VecinosPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vecinos, setVecinos] = useState<Vecino[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

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
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    numeroCarnet: '',
    direccion: '',
    manzano: '',
    numeroFolio: '',
    tipoResidencia: 'anticresista',
    usuarioId: obtenerUsuarioId()
  });

  useEffect(() => {
    fetchVecinos();
  }, []);

  const fetchVecinos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 

      const response = await fetch('http://localhost:3001/api/vecinos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor o la sesión expiró.');
      }

      const data = await response.json();
      setVecinos(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener los datos del servidor. Verifica que tu backend esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormulario({
      nombre: '',
      primerApellido: '',
      segundoApellido: '',
      numeroCarnet: '',
      direccion: '',
      manzano: '',
      numeroFolio: '',
      tipoResidencia: 'anticresista',
      usuarioId: obtenerUsuarioId()
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (vecino: Vecino) => {
    setEditandoId(vecino.id);
    setFormulario({
      nombre: vecino.nombre || '',
      primerApellido: vecino.primerApellido || '',
      segundoApellido: vecino.segundoApellido || '',
      numeroCarnet: vecino.numeroCarnet || '',
      direccion: vecino.direccion || '',
      manzano: vecino.manzano || '',
      numeroFolio: vecino.numeroFolio || '',
      tipoResidencia: vecino.tipoResidencia || 'anticresista',
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
        ...formulario,
        usuarioId: currentUserId
      };

      const url = editandoId 
        ? `http://localhost:3001/api/vecinos/${editandoId}` 
        : 'http://localhost:3001/api/vecinos';
      
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
        throw new Error(data.message || 'Error al procesar la solicitud.');
      }

      await fetchVecinos();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`No se pudo guardar: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este vecino?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/vecinos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el registro.');
      }

      await fetchVecinos();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('El archivo Excel está vacío.');
          return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        const currentUserId = obtenerUsuarioId();

        // Obtener los carnets existentes en la BD para filtrado inteligente
        const responseExistentes = await fetch('http://localhost:3001/api/vecinos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const datosActuales = await responseExistentes.json();
        const listaVecinosActuales = Array.isArray(datosActuales) ? datosActuales : datosActuales.data || [];
        const carnetsEnBD = new Set(listaVecinosActuales.map((v: any) => String(v.numeroCarnet).trim()));

        const unicosParaEnviar: any[] = [];
        const filasDuplicadasParaExcel: any[] = [];
        const carnetsVistosEnEsteExcel = new Set<string>();

        data.forEach((row: any) => {
          const numeroCarnet = String(
            row['Numero de Carnet'] || row['Numero Carnet'] || row['numeroCarnet'] || row['NumeroCarnet'] || row['CI'] || ''
          ).trim();
          
          if (!numeroCarnet) {
            filasDuplicadasParaExcel.push(row);
            return;
          }

          const tipoCrudo = String(
            row['Propietario/Inquilino'] || row['Propietario Inquilino'] || row['tipoResidencia'] || ''
          ).trim().toLowerCase();
          
          let tipoResidenciaFinal = 'anticresista';
          if (tipoCrudo.includes('inquilino')) {
            tipoResidenciaFinal = 'inquilino';
          } else if (tipoCrudo.includes('propietario') || tipoCrudo.includes('dueno') || tipoCrudo.includes('dueño')) {
            tipoResidenciaFinal = 'dueno';
          } else if (tipoCrudo.includes('anticresista')) {
            tipoResidenciaFinal = 'anticresista';
          }

          const objetoVecino = {
            nombre: String(row['Nombres'] || row['Nombre'] || row['nombre'] || '').trim(),
            primerApellido: String(row['Primer Apellido'] || row['PrimerApellido'] || row['primerApellido'] || '').trim(),
            segundoApellido: String(row['Segundo Apellido'] || row['SegundoApellido'] || row['segundoApellido'] || '').trim(),
            numeroCarnet: numeroCarnet,
            direccion: String(row['Direccion'] || row['Dirección'] || row['direccion'] || '').trim(),
            manzano: String(row['Manzano'] || row['manzano'] || '').trim(),
            numeroFolio: String(row['Nro Folio'] || row['Numero Folio'] || row['numeroFolio'] || '').trim(),
            tipoResidencia: tipoResidenciaFinal,
            usuarioId: currentUserId
          };

          if (carnetsEnBD.has(numeroCarnet) || carnetsVistosEnEsteExcel.has(numeroCarnet)) {
            filasDuplicadasParaExcel.push(row);
          } else {
            carnetsVistosEnEsteExcel.add(numeroCarnet);
            unicosParaEnviar.push(objetoVecino);
          }
        });

        if (unicosParaEnviar.length > 0) {
          const responseMasiva = await fetch('http://localhost:3001/api/vecinos/masivo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ vecinos: unicosParaEnviar })
          });

          if (!responseMasiva.ok) {
            const errData = await responseMasiva.json();
            throw new Error(errData.message || 'Error al importar los registros únicos.');
          }
        }

        if (filasDuplicadasParaExcel.length > 0) {
          const nuevaHoja = XLSX.utils.json_to_sheet(filasDuplicadasParaExcel);
          const nuevoLibro = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(nuevoLibro, nuevaHoja, 'Duplicados');
          XLSX.writeFile(nuevoLibro, 'vecinos_duplicados.xlsx');

          alert(`Se cargaron ${unicosParaEnviar.length} registros nuevos con éxito.\n\nSe detectaron ${filasDuplicadasParaExcel.length} registros duplicados. Se ha descargado automáticamente el archivo "vecinos_duplicados.xlsx".`);
        } else {
          alert(`¡Se importaron los ${unicosParaEnviar.length} registros con éxito sin duplicados!`);
        }

        await fetchVecinos();
      } catch (err: any) {
        alert(`Error al procesar el archivo Excel: ${err.message}`);
      } finally {
        setLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredVecinos = Array.isArray(vecinos) ? vecinos.filter(v => 
    v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.primerApellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.segundoApellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.numeroCarnet?.includes(searchTerm)
  ) : [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-neutral-900">Padrón de Vecinos</h1>
            <p className="text-xs text-neutral-500">Gestión y control de residentes habilitados (Kupini Central)</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Upload className="h-4 w-4" /> Importar Excel
            </button>

            <button 
              onClick={abrirModalCrear}
              className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Nuevo Vecino
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-5">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, apellido o CI..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
            />
          </div>
          <div className="text-xs text-neutral-500 font-medium">
            Total en base de datos: <span className="font-bold text-neutral-900">{vecinos.length}</span>
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
                  <th className="p-3.5">Vecino</th>
                  <th className="p-3.5">Cédula de Identidad</th>
                  <th className="p-3.5">Dirección / Manzano</th>
                  <th className="p-3.5">N° Folio</th>
                  <th className="p-3.5">Tipo</th>
                  {isAdmin && <th className="p-3.5 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" />
                        <span>Cargando datos desde PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredVecinos.length > 0 ? (
                  filteredVecinos.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-[#1e40af] flex items-center justify-center font-bold text-xs">
                          {v.nombre?.[0] || 'V'}{v.primerApellido?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">
                            {v.nombre} {v.primerApellido} {v.segundoApellido || ''}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-700 font-medium">{v.numeroCarnet}</td>
                      <td className="p-3.5 text-neutral-700">
                        <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded text-[11px]">
                          <MapPin className="h-3 w-3 text-neutral-500" /> {v.direccion} (Mz. {v.manzano})
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-700">{v.numeroFolio}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                          {v.tipoResidencia}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-right space-x-2">
                          <button 
                            onClick={() => abrirModalEditar(v)} 
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition-colors" 
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id)} 
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
                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-neutral-400">
                      No hay registros en la base de datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#1e40af]" /> 
                {editandoId ? 'Editar Vecino' : 'Registrar Nuevo Vecino'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    required
                    value={formulario.nombre} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                    placeholder="Ej. Juan Carlos"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Primer Apellido</label>
                  <input 
                    type="text" 
                    name="primerApellido" 
                    required
                    value={formulario.primerApellido} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Segundo Apellido (Opcional)</label>
                  <input 
                    type="text" 
                    name="segundoApellido" 
                    value={formulario.segundoApellido} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                    placeholder="Ej. Gómez"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Número de Carnet (CI)</label>
                  <input 
                    type="text" 
                    name="numeroCarnet" 
                    required
                    value={formulario.numeroCarnet} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                    placeholder="Ej. 1234567 LP"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Dirección</label>
                <input 
                  type="text" 
                  name="direccion" 
                  required
                  value={formulario.direccion} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                  placeholder="Ej. Av. Principal #123"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Manzano</label>
                  <input 
                    type="text" 
                    name="manzano" 
                    required
                    value={formulario.manzano} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                    placeholder="Ej. A"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">N° Folio</label>
                  <input 
                    type="text" 
                    name="numeroFolio" 
                    required
                    value={formulario.numeroFolio} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]" 
                    placeholder="Ej. FOL-001"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Tipo Residencia</label>
                  <select 
                    name="tipoResidencia"
                    value={formulario.tipoResidencia}
                    onChange={handleInputChange}
                    className="w-full px-2 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af] bg-white"
                  >
                    <option value="anticresista">anticresista</option>
                    <option value="dueno">dueno</option>
                    <option value="inquilino">inquilino</option>
                  </select>
                </div>
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
                  {editandoId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};