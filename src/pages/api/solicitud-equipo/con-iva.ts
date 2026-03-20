import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

// Usar la misma configuración que el resto del sistema
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database', 'rentall.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  const db = new Database(dbPath);

  try {
    // Obtener todas las SE que usan factura (pagan IVA)
    // con información del contrato asociado si existe
    const solicitudes = db.prepare(`
      SELECT 
        ese.id_solicitud_equipo,
        ese.numero_solicitud_equipo,
        ese.id_cliente,
        (cl.nombre_cliente || ' ' || COALESCE(cl.apellidos_cliente, '')) as nombre_cliente,
        ese.total_solicitud_equipo,
        ese.iva_solicitud_equipo,
        ese.usa_factura,
        ese.estado_solicitud_equipo,
        ese.fecha_inicio,
        ese.fecha_vencimiento,
        c.id_contrato,
        c.numero_contrato,
        c.estado as estado_contrato
      FROM encabezado_solicitud_equipo ese
      INNER JOIN cliente cl ON ese.id_cliente = cl.id_cliente
      LEFT JOIN contrato c ON c.id_solicitud_equipo = ese.id_solicitud_equipo
      WHERE ese.usa_factura = 1
      ORDER BY ese.created_at DESC
    `).all();

    return res.status(200).json({
      success: true,
      data: solicitudes
    });

  } catch (error: any) {
    console.error('Error al obtener SE con IVA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  } finally {
    db.close();
  }
}
