export type RolUsuario = 'administrador' | 'operador_consultas' | 'vecino';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface AuthResponse {
  status: string;
  message?: string;
  token: string;
  usuario: User;
}