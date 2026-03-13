import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '../contexts/AuthContext';
import { EquiposProvider } from '../contexts/EquiposContext';
import ProtectedRoute from '../componentes/ProtectedRoute';
import '../styles/globals.css';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <AuthProvider>
      <EquiposProvider>
        {isPublicRoute ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </EquiposProvider>
    </AuthProvider>
  );
}

export default MyApp;
