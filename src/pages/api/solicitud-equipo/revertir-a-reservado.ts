import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

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
        message: 'No hay equipos para revertir',
        data: { equipos_revertidos: 0 }
      });
    }

    let equiposRevertidos = 0;

    // Procesar cada detalle para revertir inventario
    for (const detalle of detalles) {
      const equipo = db.prepare(`
        SELECT * FROM equipo WHERE id_equipo = ?
      `).get(detalle.id_equipo) as any;

      if (!equipo) {
        continue; // Saltar si el equipo no existe
      }

      const cantidadRevertir = detalle.cantidad_equipo || 0;
      const cantidadAlquilado = equipo.cantidad_alquilado || 0;
      const cantidadReservado = equipo.cantidad_reservado || 0;

      // Actualizar usando el nuevo sistema de columnas
      // alquilado → reservado (validar que no quede negativo)
      const cantidadActualRevertir = Math.min(cantidadRevertir, cantidadAlquilado);
      const nuevaCantidadAlquilado = Math.max(0, cantidadAlquilado - cantidadActualRevertir);
      const nuevaCantidadReservado = cantidadReservado + cantidadActualRevertir;
      
      db.prepare(`
        UPDATE equipo 
        SET cantidad_alquilado = ?,
            cantidad_reservado = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id_equipo = ?
      `).run(nuevaCantidadAlquilado, nuevaCantidadReservado, equipo.id_equipo);

      equiposRevertidos++;
    }

    res.status(200).json({
      success: true,
      message: 'Inventario revertido a reservado correctamente',
      data: { equipos_revertidos: equiposRevertidos }
    });

  } catch (error) {
    console.error('Error al revertir inventario a reservado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al revertir inventario',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
