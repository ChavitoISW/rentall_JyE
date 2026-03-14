import { NextApiRequest, NextApiResponse } from 'next';
import { equipoModel } from '../../../models';
import { EstadoEquipo, EstadoEquipoLabels } from '../../../types/estadoEquipo';

interface InventarioConsolidado {
  nombre_equipo: string;
  nombre_categoria?: string;
  total: number;
  disponible: number;
  reservado: number;
  asignado: number;
  en_recoleccion: number;
  en_mantenimiento: number;
  no_disponible: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener todos los equipos
    const equipos = equipoModel.getAll();

    // Consolidar por nombre de equipo
    const consolidadoMap = new Map<string, InventarioConsolidado>();

    for (const equipo of equipos) {
      const key = `${equipo.nombre_equipo}_${equipo.id_equipo_categoria || 0}`;
      
      if (!consolidadoMap.has(key)) {
        consolidadoMap.set(key, {
          nombre_equipo: equipo.nombre_equipo,
          nombre_categoria: equipo.nombre_categoria,
          total: 0,
          disponible: 0,
          reservado: 0,
          asignado: 0,
          en_recoleccion: 0,
          en_mantenimiento: 0,
          no_disponible: 0
        });
      }

      const consolidado = consolidadoMap.get(key)!;

      // Sumar desde las columnas de cantidad del nuevo sistema
      const disponible = equipo.cantidad_disponible || 0;
      const reservado = equipo.cantidad_reservado || 0;
      const asignado = equipo.cantidad_alquilado || 0; // alquilado = asignado
      const en_recoleccion = equipo.cantidad_en_recoleccion || 0;
      const en_mantenimiento = equipo.cantidad_en_mantenimiento || 0;
      
      consolidado.disponible += disponible;
      consolidado.reservado += reservado;
      consolidado.asignado += asignado;
      consolidado.en_recoleccion += en_recoleccion;
      consolidado.en_mantenimiento += en_mantenimiento;
      
      // El total es la suma de todas las columnas de estado
      // (esto asegura que total = disponible + reservado + asignado + en_recoleccion + en_mantenimiento + no_disponible)
      consolidado.total += disponible + reservado + asignado + en_recoleccion + en_mantenimiento;
    }

    // Convertir el Map a array
    const resultado = Array.from(consolidadoMap.values());

    res.status(200).json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error al obtener inventario consolidado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener inventario consolidado',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
