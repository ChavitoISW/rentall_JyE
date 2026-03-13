import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Método ${method} no permitido` });
  }

  try {
    // Obtener contratos pendientes de entrega (solo estado CONTRATO_GENERADO, excluyendo anulados y cancelados)
    const contratos = db.prepare(`
      SELECT 
        se.id_solicitud_equipo,
        se.numero_solicitud_equipo,
        PRINTF('%05d', co.id_contrato) as numero_contrato,
        co.id_contrato,
        se.fecha_inicio,
        se.provincia_solicitud_equipo as provincia,
        se.canton_solicitud_equipo as canton,
        se.distrito_solicitud_equipo as distrito,
        se.otras_senas_solicitud_equipo as otras_senas,
        se.nombre_recibe as nombre_cliente,
        se.telefono_recibe as telefono_cliente,
        c.nombre_cliente || ' ' || c.apellidos_cliente as cliente_completo
      FROM encabezado_solicitud_equipo se
      LEFT JOIN cliente c ON se.id_cliente = c.id_cliente
      INNER JOIN contrato co ON se.id_solicitud_equipo = co.id_solicitud_equipo
      WHERE se.estado_solicitud_equipo = 2
        AND se.estado_solicitud_equipo NOT IN (7, 8)
        AND co.estado NOT IN (0, 2)
      ORDER BY se.fecha_inicio ASC
    `).all();

    // Obtener órdenes de recolección pendientes
    const recolecciones = db.prepare(`
      SELECT 
        id_orden_recoleccion,
        numero_orden_recoleccion,
        numero_solicitud_equipo,
        fecha_programada_recoleccion,
        nombre_equipo,
        cantidad,
        provincia,
        canton,
        distrito,
        otras_senas,
        nombre_cliente,
        telefono_cliente
      FROM orden_recoleccion
      WHERE estado = 0
      ORDER BY fecha_programada_recoleccion ASC
    `).all();

    // Obtener órdenes de cambio pendientes
    const cambios = db.prepare(`
      SELECT 
        id_orden_cambio,
        numero_orden_cambio,
        numero_solicitud_equipo,
        nombre_equipo_actual,
        nombre_equipo_nuevo,
        motivo_cambio,
        fecha_programada,
        provincia,
        canton,
        distrito,
        otras_senas,
        nombre_cliente,
        telefono_cliente
      FROM orden_cambio_equipo
      WHERE estado = 0
      ORDER BY fecha_programada ASC
    `).all();

    return res.status(200).json({
      success: true,
      data: {
        contratos,
        recolecciones,
        cambios
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo órdenes pendientes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
