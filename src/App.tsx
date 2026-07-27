import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VecinosPage } from './pages/VecinosPage';
import { PlanchasPage } from './pages/PlanchasPage';
import { PlanchaIntegrantesPage } from './pages/PlanchaIntegrantesPage';
import { VotacionPage } from './pages/VotacionPage';
import { ResultadosPage } from './pages/ResultadosPage';
import { ReportesPage } from './pages/ReportesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { RespaldosPage } from './pages/RespaldosPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vecinos" element={<VecinosPage />} />
        <Route path="/planchas" element={<PlanchasPage />} />
        <Route path="/planchas/:id/integrantes" element={<PlanchaIntegrantesPage />} />
        <Route path="/votacion" element={<VotacionPage />} />
        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/config/usuarios" element={<UsuariosPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="/config/respaldos" element={<RespaldosPage />} />
        <Route path="/votacion/registrar" element={<VotacionPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;