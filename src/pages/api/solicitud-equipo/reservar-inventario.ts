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

      const cantidadDisponible = equipo.cantidad_equipo || 0;
      const cantidadSolicitada = detalle.cantidad_equipo || 0;

      // Validación estricta: la cantidad solicitada NUNCA puede ser mayor que la cantidad disponible
      if (cantidadSolicitada > cantidadDisponible) {
        return res.status(400).json({
          success: false,
          error: `No hay suficiente cantidad del equipo ${equipo.nombre_equipo}. Disponible: ${cantidadDisponible}, Solicitado: ${cantidadSolicitada}.`
        });
      }

      // Validación adicional: asegurar que el equipo esté en estado DISPONIBLE
      if (equipo.id_estado_equipo !== EstadoEquipo.DISPONIBLE) {
        return res.status(400).json({
          success: false,
          error: `El equipo ${equipo.nombre_equipo} no está disponible para reservar.`
        });
      }

      // Actualizar el registro original restando la cantidad solicitada
      const nuevaCantidad = cantidadDisponible - cantidadSolicitada;
      db.prepare(`
        UPDATE equipo 
        SET cantidad_equipo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id_equipo = ?
      `).run(nuevaCantidad, detalle.id_equipo);

      // Crear un nuevo registro con la cantidad reservada
      const nuevoEquipo = db.prepare(`
        INSERT INTO equipo (
          nombre_equipo, 
          id_equipo_categoria, 
          id_estado_equipo, 
          id_equipo_especifico, 
          cantidad_equipo
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        equipo.nombre_equipo,
        equipo.id_equipo_categoria,
        EstadoEquipo.RESERVADO,
        equipo.id_equipo_especifico,
        cantidadSolicitada
      );

      // Actualizar el detalle para que apunte al nuevo registro RESERVADO
      db.prepare(`
        UPDATE detalle_solicitud_equipo 
        SET id_equipo = ?
        WHERE id_detalle_solicitud_equipo = ?
      `).run(nuevoEquipo.lastInsertRowid, detalle.id_detalle_solicitud_equipo);

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
