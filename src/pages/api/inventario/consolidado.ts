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
      const cantidad = equipo.cantidad_equipo || 0;
      const estado = equipo.id_estado_equipo || EstadoEquipo.DISPONIBLE;

      // Sumar al total
      consolidado.total += cantidad;

      // Sumar a la columna correspondiente según el estado
      switch (estado) {
        case EstadoEquipo.DISPONIBLE:
          consolidado.disponible += cantidad;
          break;
        case EstadoEquipo.RESERVADO:
          consolidado.reservado += cantidad;
          break;
        case EstadoEquipo.ASIGNADO:
          consolidado.asignado += cantidad;
          break;
        case EstadoEquipo.EN_RECOLECCION:
          consolidado.en_recoleccion += cantidad;
          break;
        case EstadoEquipo.EN_MANTENIMIENTO:
          consolidado.en_mantenimiento += cantidad;
          break;
        case EstadoEquipo.NO_DISPONIBLE:
          consolidado.no_disponible += cantidad;
          break;
      }
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
