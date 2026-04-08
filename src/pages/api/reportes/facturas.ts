import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database', 'rentall.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const db = new Database(dbPath);

  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requieren fecha_inicio y fecha_fin' 
      });
    }

    // Obtener todas las facturas en el rango de fechas con información del estado de pago del contrato
    const facturas = db.prepare(`
      SELECT 
        fc.*,
        c.numero_contrato,
        ese.total_solicitud_equipo as total_contrato,
        ese.numero_solicitud_equipo,
        (cl.nombre_cliente || ' ' || COALESCE(cl.apellidos_cliente, '')) as nombre_cliente,
        COALESCE(
          (SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato),
          0
        ) as monto_pagado,
        (ese.total_solicitud_equipo - COALESCE(
          (SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato),
          0
        )) as monto_pendiente,
        CASE
          WHEN COALESCE((SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato), 0) = 0 THEN 'pendiente'
          WHEN COALESCE((SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato), 0) >= ese.total_solicitud_equipo THEN 'pagado'
          ELSE 'pago_parcial'
        END as estado_pago
      FROM factura_contrato fc
      INNER JOIN contrato c ON fc.id_contrato = c.id_contrato
      INNER JOIN encabezado_solicitud_equipo ese ON fc.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN cliente cl ON ese.id_cliente = cl.id_cliente
      WHERE DATE(fc.fecha_emision) BETWEEN DATE(?) AND DATE(?)
      ORDER BY fc.fecha_emision DESC, fc.created_at DESC
    `).all(fecha_inicio, fecha_fin);

    // Calcular totales
    const totales = {
      total_facturas: facturas.length,
      total_subtotal: facturas.reduce((sum: number, f: any) => sum + (f.monto_subtotal || 0), 0),
      total_iva: facturas.reduce((sum: number, f: any) => sum + (f.monto_iva || 0), 0),
      total_general: facturas.reduce((sum: number, f: any) => sum + (f.monto_total || 0), 0),
      facturas_pagadas: facturas.filter((f: any) => f.estado_pago === 'pagado').length,
      facturas_pendientes: facturas.filter((f: any) => f.estado_pago === 'pendiente').length,
      facturas_pago_parcial: facturas.filter((f: any) => f.estado_pago === 'pago_parcial').length
    };

    return res.status(200).json({ 
      success: true, 
      data: {
        facturas,
        totales,
        rango: {
          fecha_inicio,
          fecha_fin
        }
      }
    });
  } catch (error) {
    console.error('Error en API de reporte de facturas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al generar el reporte de facturas' 
    });
  } finally {
    db.close();
  }
}
