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
      return res.status(200).json({ 
        success: true, 
        message: 'No hay equipos para liberar',
        data: { equipos_liberados: 0 }
      });
    }

    let equiposLiberados = 0;

    // Procesar cada detalle para liberar inventario
    for (const detalle of detalles) {
      const equipoReservado = db.prepare(`
        SELECT * FROM equipo WHERE id_equipo = ?
      `).get(detalle.id_equipo) as any;

      if (!equipoReservado) {
        continue; // Saltar si el equipo no existe
      }

      const cantidadLiberar = equipoReservado.cantidad_equipo || 0;

      // Buscar el registro DISPONIBLE del mismo equipo
      const equipoDisponible = db.prepare(`
        SELECT * FROM equipo 
        WHERE nombre_equipo = ? 
          AND id_equipo_categoria = ? 
          AND id_estado_equipo = ?
          AND id_equipo != ?
        LIMIT 1
      `).get(
        equipoReservado.nombre_equipo,
        equipoReservado.id_equipo_categoria,
        EstadoEquipo.DISPONIBLE,
        equipoReservado.id_equipo
      ) as any;

      if (equipoDisponible) {
        // Sumar la cantidad al registro DISPONIBLE
        const nuevaCantidad = (equipoDisponible.cantidad_equipo || 0) + cantidadLiberar;
        db.prepare(`
          UPDATE equipo 
          SET cantidad_equipo = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_equipo = ?
        `).run(nuevaCantidad, equipoDisponible.id_equipo);
        
        // Actualizar el detalle para que apunte al equipo DISPONIBLE
        db.prepare(`
          UPDATE detalle_solicitud_equipo 
          SET id_equipo = ?
          WHERE id_detalle_solicitud_equipo = ?
        `).run(equipoDisponible.id_equipo, detalle.id_detalle_solicitud_equipo);
        
        // Ahora sí podemos eliminar el registro RESERVADO
        db.prepare(`DELETE FROM equipo WHERE id_equipo = ?`).run(equipoReservado.id_equipo);
      } else {
        // Si no hay registro DISPONIBLE, cambiar el estado del registro actual a DISPONIBLE
        db.prepare(`
          UPDATE equipo 
          SET id_estado_equipo = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_equipo = ?
        `).run(EstadoEquipo.DISPONIBLE, equipoReservado.id_equipo);
      }

      equiposLiberados++;
    }

    res.status(200).json({
      success: true,
      message: 'Inventario liberado correctamente',
      data: { equipos_liberados: equiposLiberados }
    });

  } catch (error) {
    console.error('Error al liberar inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al liberar inventario',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
