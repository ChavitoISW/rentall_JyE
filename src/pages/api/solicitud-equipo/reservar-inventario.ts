import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';
import { EstadoEquipo } from '../../../types/estadoEquipo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_solicitud_equipo } = req.body;

    if (!id_solicitud_equipo) {
      return res.status(400).json({ error: 'ID de solicitud requerido' });
    }

    // Obtener el número de solicitud desde el encabezado
    const encabezado = db.prepare(`
      SELECT numero_solicitud_equipo FROM encabezado_solicitud_equipo
      WHERE id_solicitud_equipo = ?
    `).get(id_solicitud_equipo) as any;

    if (!encabezado || !encabezado.numero_solicitud_equipo) {
      return res.status(400).json({ error: 'Solicitud no encontrada' });
    }

    // Obtener detalles de la solicitud usando numero_solicitud_equipo
    const detalles = db.prepare(`
      SELECT * FROM detalle_solicitud_equipo 
      WHERE numero_solicitud_equipo = ?
    `).all(encabezado.numero_solicitud_equipo) as any[];

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ error: 'La solicitud no tiene equipos asociados' });
    }

    let equiposProcesados = 0;

    // Procesar cada detalle
    for (const detalle of detalles) {
      const equipo = db.prepare(`
        SELECT * FROM equipo WHERE id_equipo = ?
      `).get(detalle.id_equipo) as any;

      if (!equipo) {
        throw new Error(`Equipo con id ${detalle.id_equipo} no encontrado`);
      }

      const cantidadDisponible = equipo.cantidad_disponible || 0;
      const cantidadSolicitada = detalle.cantidad_equipo || 0;

      // Validación: la cantidad solicitada no puede ser mayor que la cantidad disponible
      if (cantidadSolicitada > cantidadDisponible) {
        return res.status(400).json({
          success: false,
          error: `No hay suficiente cantidad del equipo ${equipo.nombre_equipo}. Disponible: ${cantidadDisponible}, Solicitado: ${cantidadSolicitada}.`
        });
      }

      // Actualizar el equipo usando el nuevo sistema de columnas
      // disponible → reservado
      const nuevaCantidadDisponible = cantidadDisponible - cantidadSolicitada;
      const nuevaCantidadReservado = (equipo.cantidad_reservado || 0) + cantidadSolicitada;
      
      db.prepare(`
        UPDATE equipo 
        SET cantidad_disponible = ?,
            cantidad_reservado = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id_equipo = ?
      `).run(nuevaCantidadDisponible, nuevaCantidadReservado, detalle.id_equipo);

      equiposProcesados++;
    }

    res.status(200).json({
      success: true,
      message: 'Inventario reservado correctamente',
      data: { equipos_procesados: equiposProcesados }
    });

  } catch (error) {
    console.error('Error al reservar inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reservar inventario',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
