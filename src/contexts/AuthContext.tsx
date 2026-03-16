import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface Usuario {
  id_usuario: number;
  identificacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  email_usuario: string;
  estado_usuario: number;
  usuario_rol: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identificacion: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Durante SSR, no hay localStorage, así que no estamos cargando
  const [isLoading, setIsLoading] = useState(typeof window === 'undefined' ? false : true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay sesión guardada (solo en el cliente)
    if (typeof window !== 'undefined') {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          setUsuario(JSON.parse(usuarioGuardado));
        } catch (error) {
          console.error('Error al parsear usuario:', error);
          localStorage.removeItem('usuario');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identificacion: string, contrasena: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identificacion, contrasena }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUsuario(result.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('usuario', JSON.stringify(result.data));
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Error al iniciar sesión' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUsuario(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('usuario');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
