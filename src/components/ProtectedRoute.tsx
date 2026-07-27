import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RolUsuario } from '../types'; // <-- Agrega la palabra 'type' aquí

interface ProtectedRouteProps {
  allowedRoles?: RolUsuario[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !hasRole(allowedRoles)) {
    return <p style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Acceso denegado: No tienes permisos para ver esta sección.</p>;
  }

  return <Outlet />;
};