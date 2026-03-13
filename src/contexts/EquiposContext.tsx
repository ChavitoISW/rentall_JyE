import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface EquipoCategoria {
  [key: string]: any;
}

interface EquiposCacheData {
  data: EquipoCategoria[];
  timestamp: number;
}

interface EquiposContextType {
  fetchEquiposPorCategoria: (categoriaNombre: string) => Promise<EquipoCategoria[]>;
  invalidateCache: (categoriaNombre?: string) => void;
  clearAllCache: () => void;
}

const EquiposContext = createContext<EquiposContextType | undefined>(undefined);

const CACHE_DURATION = 60000; // 60 segundos

export const EquiposProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, EquiposCacheData>>(new Map());
  const pendingRequestsRef = useRef<Map<string, Promise<EquipoCategoria[]>>>(new Map());

  const getApiUrl = (categoriaNombre: string): string | null => {
    switch (categoriaNombre.toLowerCase()) {
      case 'mezcladora':
      case 'mezcladoras':
        return '/api/mezcladora';
      case 'andamio':
      case 'andamios':
        return '/api/andamio';
      case 'compactador':
      case 'compactadores':
        return '/api/compactador';
      case 'rompedor':
      case 'rompedores':
        return '/api/rompedor';
      case 'vibrador':
      case 'vibradores':
        return '/api/vibrador';
      case 'puntal':
      case 'puntales':
        return '/api/puntal';
      default:
        return null;
    }
  };

  const fetchEquiposPorCategoria = useCallback(async (categoriaNombre: string): Promise<EquipoCategoria[]> => {
    const cacheKey = categoriaNombre.toLowerCase();
    const now = Date.now();

    // Verificar caché
    const cached = cacheRef.current.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`✅ [Cache Hit] ${categoriaNombre}`);
      return cached.data;
    }

    // Si ya hay una petición en curso, esperar a que termine
    const pendingRequest = pendingRequestsRef.current.get(cacheKey);
    if (pendingRequest) {
      console.log(`⏳ [Pending Request] ${categoriaNombre}`);
      return pendingRequest;
    }

    // Hacer nueva petición
    const apiUrl = getApiUrl(categoriaNombre);
    if (!apiUrl) {
      console.warn(`⚠️ No hay API URL para categoría: ${categoriaNombre}`);
      return [];
    }

    console.log(`🔄 [API Call] ${categoriaNombre}`);
    
    const requestPromise = (async () => {
      try {
        const response = await fetch(apiUrl);
        const result = await response.json();
        const equipos = Array.isArray(result.data) ? result.data : [];

        // Guardar en caché
        cacheRef.current.set(cacheKey, {
          data: equipos,
          timestamp: now
        });

        return equipos;
      } catch (error) {
        console.error(`❌ Error al cargar ${categoriaNombre}:`, error);
        return [];
      } finally {
        // Eliminar de peticiones pendientes
        pendingRequestsRef.current.delete(cacheKey);
      }
    })();

    // Guardar petición pendiente
    pendingRequestsRef.current.set(cacheKey, requestPromise);

    return requestPromise;
  }, []);

  const invalidateCache = useCallback((categoriaNombre?: string) => {
    if (categoriaNombre) {
      const cacheKey = categoriaNombre.toLowerCase();
      cacheRef.current.delete(cacheKey);
      console.log(`🗑️ Cache invalidado para: ${categoriaNombre}`);
    } else {
      cacheRef.current.clear();
      console.log('🗑️ Todo el cache invalidado');
    }
  }, []);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    pendingRequestsRef.current.clear();
    console.log('🗑️ Cache y peticiones pendientes limpiados');
  }, []);

  return (
    <EquiposContext.Provider value={{ fetchEquiposPorCategoria, invalidateCache, clearAllCache }}>
      {children}
    </EquiposContext.Provider>
  );
};

export const useEquiposCache = () => {
  const context = useContext(EquiposContext);
  if (!context) {
    throw new Error('useEquiposCache debe usarse dentro de EquiposProvider');
  }
  return context;
};
