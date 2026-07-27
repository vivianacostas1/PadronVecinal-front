import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  User, 
  CheckCircle, 
  X, 
  AlertCircle, 
  LayoutDashboard, 
  ClipboardList, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  DatabaseBackup, 
  FileText, 
  LogOut 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, current: false },
  { name: 'Registro de Vecinos', path: '/vecinos', icon: Users, current: false },
  { name: 'Registro de Planchas', path: '/planchas', icon: ClipboardList, current: false },
  { name: 'Registro de Votación', path: '/votacion', icon: CheckSquare, current: false },
  { name: 'Resultados', path: '/resultados', icon: BarChart3, current: false },
];

const configItems = [
    { name: 'Usuarios', path: '/config/usuarios', icon: Settings, current: true },
    { name: 'Configuración', path: '/configuracion', icon: Settings, current: false },
    { name: 'Respaldos', path: '/config/respaldos', icon: DatabaseBackup, current: false },
    { name: 'Reportes', path: '/reportes', icon: FileText, current: false },
];

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'administrador' | 'operador_consultas' | 'vecino';
  activo: boolean;
  creadoEn?: string;
}

export const UsuariosPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificamos si el usuario actual es administrador
  const esAdministrador = user?.rol === 'administrador';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados del Modal (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Estructura adaptada (solo roles permitidos en gestión general de usuarios)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '', 
    rol: 'administrador' as 'administrador' | 'operador_consultas'
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const lista = Array.isArray(data) ? data : (data.data || []);
        setUsuarios(lista);
      } else {
        setError('No se pudo cargar la lista de usuarios.');
      }
    } catch (err) {
      console.error('Error al conectar con la API de usuarios:', err);
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (!esAdministrador) return;
    setEditMode(false);
    setCurrentId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'administrador' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (usu: Usuario) => {
    if (!esAdministrador) return;
    setEditMode(true);
    setCurrentId(usu.id);
    setFormData({
      nombre: usu.nombre || '',
      email: usu.email || '',
      password: '', 
      rol: (usu.rol === 'vecino' ? 'administrador' : usu.rol) as 'administrador' | 'operador_consultas'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esAdministrador) return;

    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `http://localhost:3001/api/usuarios/${currentId}`
        : 'http://localhost:3001/api/usuarios';
      
      const method = editMode ? 'PUT' : 'POST';

      const bodyData: any = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol
      };

      if (!editMode || (editMode && formData.password.trim() !== '')) {
        bodyData.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        setSuccessMessage(editMode ? 'Usuario actualizado exitosamente.' : 'Usuario creado exitosamente.');
        setIsModalOpen(false);
        cargarUsuarios();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        const errData = await response.json();
        alert(errData.message || 'Ocurrió un error al guardar el usuario.');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error de red al intentar guardar el usuario.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!esAdministrador) return;
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccessMessage('Usuario eliminado correctamente.');
        cargarUsuarios();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert('No se pudo eliminar el usuario.');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error de red al intentar eliminar.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearRol = (rol: string) => {
    switch (rol) {
      case 'administrador': return 'Administrador';
      case 'operador_consultas': return 'Operador Consultas';
      case 'vecino': return 'Vecino';
      default: return rol;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50 text-neutral-800 font-sans">
      
      {/* Sidebar Fijo */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a254a] text-neutral-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-lg`}>
        <div className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-neutral-700">
            <div className="flex items-center gap-3">
               <div className="h-9 w-9 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white text-sm">PV</div>
              <div className="flex flex-col">
                <h1 className="text-xs font-bold text-white">PADRÓN VECINAL</h1>
                <p className="text-[10px] text-neutral-400">KUPINI CENTRAL</p>
              </div>
            </div>
          </div>

          <nav className="flex-grow px-3 py-4 space-y-4 overflow-y-auto">
              <div>
                <h2 className="px-2 mb-2 text-[10px] font-semibold uppercase text-neutral-400 tracking-wider">Menú</h2>
                <ul className="space-y-0.5">
                {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link to={item.path} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-700/50">
                          <item.icon className="h-4 w-4" />
                          {item.name}
                      </Link>
                    </li>
                ))}
                </ul>
              </div>
              <div>
                 <h2 className="px-2 mb-2 text-[10px] font-semibold uppercase text-neutral-400 tracking-wider">Configuración</h2>
                <ul className="space-y-0.5">
                    {configItems.map((item) => (
                        <li key={item.name}>
                          <Link to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${item.current ? 'bg-[#1e40af] text-white shadow-inner' : 'text-neutral-300 hover:bg-neutral-700/50'}`}>
                              <item.icon className="h-4 w-4 text-neutral-400" />
                              {item.name}
                          </Link>
                        </li>
                    ))}
                </ul>
              </div>
          </nav>

          <div className="px-4 py-3 border-t border-neutral-700">
            <h3 className="text-[10px] font-bold text-white">COMITÉ ELECTORAL 2026</h3>
            <p className="text-[9px] text-neutral-400">Kupini Central</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
          <div className="px-6 py-3 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-neutral-600 hover:text-neutral-900">
              <LayoutDashboard className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Link to="/dashboard" className="hover:text-[#1e40af]">Inicio</Link> / <span className="font-semibold text-neutral-900">Gestión de Usuarios</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border-l border-neutral-200 pl-4">
                    <span className="text-xs font-medium text-neutral-900">{user?.nombre || 'Usuario'}</span>
                    <button onClick={handleLogout} className="text-neutral-500 hover:text-red-600 p-1">
                       <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-neutral-100">
            <div>
              <h2 className="text-xl font-bold text-neutral-950">Gestión de Usuarios</h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                {esAdministrador ? 'Administra los usuarios con acceso al sistema y sus roles.' : 'Visualización de usuarios registrados en el sistema (Modo Consulta).'}
              </p>
            </div>
            {/* Botón de Nuevo Usuario exclusivo para Administradores */}
            {esAdministrador && (
              <button 
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <UserPlus className="h-4 w-4" /> Nuevo Usuario
              </button>
            )}
          </div>

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center gap-3">
            <Search className="h-4 w-4 text-neutral-400 ml-1" />
            <input 
              type="text"
              placeholder="Buscar por nombre o correo electrónico..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-neutral-800 placeholder-neutral-400"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4">Rol</th>
                    {/* Columna de acciones solo visible para administradores */}
                    {esAdministrador && <th className="py-3 px-4 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={esAdministrador ? 4 : 3} className="text-center py-8 text-neutral-400">Cargando usuarios...</td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={esAdministrador ? 4 : 3} className="text-center py-8 text-neutral-400">No se encontraron usuarios registrados.</td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-neutral-900 flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                            {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                          </div>
                          {u.nombre}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                            <Shield className="h-3 w-3" /> {formatearRol(u.rol)}
                          </span>
                        </td>
                        {/* Botones de acción ocultos para Operador de Consultas */}
                        {esAdministrador && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleOpenEditModal(u)}
                                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(u.id)}
                                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Modal restringido solo a administradores */}
      {isModalOpen && esAdministrador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                {editMode ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nombre Completo</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-neutral-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-blue-600 text-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Correo Electrónico</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-neutral-400" />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-blue-600 text-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Contraseña {editMode && <span className="font-normal text-neutral-400">(Dejar en blanco para no cambiar)</span>}
                </label>
                <input 
                  type="password" 
                  required={!editMode}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-blue-600 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Rol</label>
                <select 
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-blue-600 text-neutral-800 bg-white"
                >
                  <option value="administrador">Administrador</option>
                  <option value="operador_consultas">Operador Consultas</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#1e40af] hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editMode ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsuariosPage;