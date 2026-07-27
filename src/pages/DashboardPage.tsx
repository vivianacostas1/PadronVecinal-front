import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  FileText, 
  LogOut, 
  CalendarDays, 
  ChevronRight,
  CheckCircle,
  Loader2,
  UserPlus,
  MailCheck,
  Building2,
  Info
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, current: true },
  { name: 'Registro de Vecinos', path: '/vecinos', icon: Users, current: false },
  { name: 'Registro de Planchas', path: '/planchas', icon: ClipboardList, current: false },
  { name: 'Registro de Votación', path: '/votacion', icon: CheckSquare, current: false },
  { name: 'Resultados', path: '/resultados', icon: BarChart3, current: false },
  { name: 'Reportes', path: '/reportes', icon: FileText, current: false }, // <- AQUÍ SE AGREGÓ EL MÓDULO DE REPORTES
];

const configItems = [
  { name: 'Usuarios', path: '/config/usuarios', icon: Settings, current: false },
];

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados dinámicos para los contadores y mensajes
  const [totalVecinos, setTotalVecinos] = useState<string | number>('...');
  const [totalPlanchas, setTotalPlanchas] = useState<string | number>('...');
  
  // Estados específicos para control de registros
  const [votacionRegistrada, setVotacionRegistrada] = useState<boolean>(false);
  const [totalVotantes, setTotalVotantes] = useState<string | number>('...');

  const [resultadosRegistrados, setResultadosRegistrados] = useState<boolean>(false);
  const [totalResultados, setTotalResultados] = useState<string | number>('--');

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Consultas simultáneas a tus endpoints del backend (actualizado al puerto 3002)
      const [resVecinos, resPlanchas, resVotos, resVotosAlt, resResultados] = await Promise.all([
        fetch('http://localhost:3002/api/vecinos', { headers }).catch(() => null),
        fetch('http://localhost:3002/api/planchas', { headers }).catch(() => null),
        fetch('http://localhost:3002/api/votacion', { headers }).catch(() => null),
        fetch('http://localhost:3002/api/votos', { headers }).catch(() => null),
        fetch('http://localhost:3002/api/resultados', { headers }).catch(() => null),
      ]);

      // 1. Procesar Vecinos
      if (resVecinos && resVecinos.ok) {
        const dataVecinos = await resVecinos.json();
        const listaVecinos = Array.isArray(dataVecinos) ? dataVecinos : (dataVecinos.data || []);
        setTotalVecinos(listaVecinos.length);
      } else {
        setTotalVecinos(0);
      }

      // 2. Procesar Planchas (Excluyendo Nulos y Blancos)
      if (resPlanchas && resPlanchas.ok) {
        const dataPlanchas = await resPlanchas.json();
        const listaPlanchas = Array.isArray(dataPlanchas) ? dataPlanchas : (dataPlanchas.data || []);
        
        const planchasReales = listaPlanchas.filter((p: any) => {
          const nombre = (p.nombreFrente || p.nombre || '').toLowerCase();
          return !nombre.includes('nulo') && !nombre.includes('blanco');
        });

        setTotalPlanchas(planchasReales.length);
      } else {
        setTotalPlanchas(0);
      }

      // 3. Procesar Votantes / Votación
      let listaVotos: any[] = [];
      if (resVotos && resVotos.ok) {
        const dataVotos = await resVotos.json();
        listaVotos = Array.isArray(dataVotos) ? dataVotos : (dataVotos.data || []);
      }
      if (listaVotos.length === 0 && resVotosAlt && resVotosAlt.ok) {
        const dataVotosAlt = await resVotosAlt.json();
        listaVotos = Array.isArray(dataVotosAlt) ? dataVotosAlt : (dataVotosAlt.data || []);
      }

      if (listaVotos.length > 0) {
        setVotacionRegistrada(true);
        setTotalVotantes("Proceso ya fue registrado");
      } else {
        setVotacionRegistrada(false);
        setTotalVotantes(0);
      }

      // 4. Procesar Resultados de Votación
      if (resResultados && resResultados.ok) {
        const dataResultados = await resResultados.json();
        const listaRes = Array.isArray(dataResultados) ? dataResultados : (dataResultados.data || []);
        
        if (listaRes.length > 0) {
          setResultadosRegistrados(true);
          setTotalResultados("Resultados generados");
        } else {
          setResultadosRegistrados(false);
          setTotalResultados(0);
        }
      } else {
        setTotalResultados(0);
      }

    } catch (error) {
      console.error('Error al cargar métricas del dashboard:', error);
    }
  };

  const kpiCards = [
    { title: 'Registro de Vecinos', path: '/vecinos', description: 'Gestiona el padrón de vecinos.', value: totalVecinos, icon: UserPlus, color: 'bg-emerald-100 text-emerald-600', iconColor: 'text-emerald-600', isTextLong: false },
    { title: 'Registro de Planchas', path: '/planchas', description: 'Administra las planchas participantes.', value: totalPlanchas, icon: Building2, color: 'bg-sky-100 text-sky-600', iconColor: 'text-sky-600', isTextLong: false },
    { 
      title: 'Registro de Votación', 
      path: '/votacion', 
      description: 'Controla el proceso de votación.', 
      value: totalVotantes, 
      icon: MailCheck, 
      color: 'bg-orange-100 text-orange-600', 
      iconColor: 'text-orange-600',
      isTextLong: votacionRegistrada 
    },
    { 
      title: 'Resultados', 
      path: '/resultados', 
      description: 'Consulta estadísticas de la elección.', 
      value: totalResultados, 
      icon: BarChart3, 
      color: 'bg-violet-100 text-violet-600', 
      iconColor: 'text-violet-600',
      isTextLong: resultadosRegistrados 
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const padronRegistrado = Number(totalVecinos) > 0;
  const planchasRegistradas = Number(totalPlanchas) > 0;

  const electoralProcessSteps = [
    { 
      name: 'Padrón', 
      status: padronRegistrado ? 'completed' : 'pending', 
      icon: padronRegistrado ? CheckCircle : Loader2 
    },
    { 
      name: 'Planchas', 
      status: planchasRegistradas ? 'completed' : 'pending', 
      icon: planchasRegistradas ? CheckCircle : Loader2 
    },
    { 
      name: 'Votación', 
      status: (votacionRegistrada || resultadosRegistrados) ? 'completed' : 'pending', 
      icon: (votacionRegistrada || resultadosRegistrados) ? CheckCircle : Loader2 
    },
    { 
      name: 'Resultados', 
      status: resultadosRegistrados ? 'completed' : 'pending', 
      icon: resultadosRegistrados ? CheckCircle : Loader2 
    },
  ];

  const getStepClass = (status: string) => {
    switch(status) {
        case 'completed': return 'text-emerald-600';
        case 'in_process': return 'text-sky-600';
        case 'pending': return 'text-neutral-400';
        default: return 'text-neutral-400';
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50 text-neutral-800 font-sans">
      
      {/* Sidebar Fijo, más delgado (w-56) y sin scroll (overflow-hidden) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#0a254a] text-neutral-200 overflow-hidden transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-lg flex flex-col justify-between`}>
        <div className="flex flex-col h-full">
          
          <div className="px-4 py-3 border-b border-neutral-700">
            <div className="flex items-center gap-2.5">
               <div className="h-20 w-20 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0">PV</div>
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-sky-300 tracking-tight leading-tight">PADRÓN VECINAL</span>
                <span className="text-[8px] text-neutral-400 tracking-wider"></span>
              </div>
            </div>
          </div>

          <nav className="flex-grow px-3 py-3 space-y-3">
              <div>
                <h2 className="px-2 mb-1.5 text-[9px] font-semibold uppercase text-neutral-400 tracking-wider">Menú</h2>
                <ul className="space-y-0.5">
                {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link to={item.path} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${item.current ? 'bg-[#1e40af] text-white shadow-inner' : 'text-neutral-300 hover:bg-neutral-700/50'}`}>
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                ))}
                </ul>
            </div>
            <div>
               <h2 className="px-2 mb-1.5 text-[9px] font-semibold uppercase text-neutral-400 tracking-wider">Configuración</h2>
              <ul className="space-y-0.5">
                    {configItems.map((item) => (
                        <li key={item.name}>
                          <Link to={item.path} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-700/50">
                              <item.icon className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                          </Link>
                        </li>
                    ))}
                </ul>
            </div>
          </nav>

          <div className="px-3 py-2.5 border-t border-neutral-700 text-center">
            <h3 className="text-[9px] font-bold text-white">COMITÉ ELECTORAL 2026</h3>
            <p className="text-[8px] text-neutral-400">Kupini Central</p>
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
                <Link to="/dashboard" className="hover:text-[#1e40af]">Inicio</Link> / <span className="font-semibold text-neutral-900">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">3</span>
                    <FileText className="h-5 w-5 text-neutral-500"/>
                </div>
                <div className="flex items-center gap-2 border-l border-neutral-200 pl-4">
                    <span className="text-xs font-medium text-neutral-900">{user?.nombre || 'Administrador'}</span>
                    <button onClick={handleLogout} className="text-neutral-500 hover:text-red-600 p-1">
                       <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-neutral-100">
            <div>
                <h2 className="text-xl font-bold text-neutral-950">Bienvenido, {user?.nombre || 'Administrador'}</h2>
                <p className="text-xs text-neutral-600 mt-0.5">Sistema de Padrón Vecinal y Proceso Electoral</p>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-4 py-2.5 rounded-lg text-xs">
                <CalendarDays className="h-8 w-8 text-[#1e40af]" />
                <div>
                    <p className="text-neutral-500">Fecha actual</p>
                    <p className="font-bold text-neutral-950">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpiCards.map((card) => (
                <div key={card.title} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex flex-col justify-between gap-3">
                   <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${card.color}`}>
                          <card.icon className="h-5 w-5" />
                      </div>
                      <p className={`${card.isTextLong ? 'text-sm font-bold text-right leading-tight max-w-[130px] ' + (card.title.includes('Votación') ? 'text-orange-700' : 'text-violet-700') : 'text-2xl font-extrabold text-neutral-950'}`}>
                        {card.value}
                      </p>
                   </div>
                   <div>
                      <h3 className="text-xs font-semibold text-neutral-950">{card.title}</h3>
                      <p className="text-[11px] text-neutral-500 line-clamp-1">{card.description}</p>
                   </div>
                    <Link to={card.path} className={`flex items-center gap-1 text-[11px] font-semibold ${card.iconColor} hover:underline`}>
                        Ir al módulo <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 pb-2">
            <div className="xl:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-neutral-100">
                <h2 className="text-sm font-bold text-neutral-950 mb-3">Resumen General</h2>
                <div className="space-y-3">
                    {kpiCards.map(card => (
                        <div key={card.title} className="flex items-center justify-between text-xs border-b border-neutral-100 pb-2.5 last:border-b-0 last:pb-0">
                            <span className="text-neutral-700">{card.title}</span>
                            <span className={`font-bold ${card.isTextLong ? (card.title.includes('Votación') ? 'text-orange-700 text-[10px]' : 'text-violet-700 text-[10px]') : 'text-neutral-950'}`}>
                              {card.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="xl:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-neutral-100 flex flex-col justify-between">
                <h2 className="text-sm font-bold text-neutral-950 mb-4">Estado del Proceso Electoral</h2>
                <div className="flex items-center justify-between max-w-xl mx-auto mb-4 w-full">
                    {electoralProcessSteps.map((step) => (
                        <div key={step.name} className={`flex flex-col items-center gap-1.5 ${getStepClass(step.status)}`}>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white ${getStepClass(step.status)}`}>
                                <step.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold">{step.name}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-center gap-3">
                    <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <p className="text-xs text-sky-700">
                        <span className="font-bold">Proceso Electoral 2026:</span> {resultadosRegistrados ? 'Resultados generados y proceso electoral finalizado.' : votacionRegistrada ? 'Votación registrada. En etapa de generación de resultados.' : 'En etapa de registro de votación.'}
                    </p>
                </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;