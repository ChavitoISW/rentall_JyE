import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'rentAll.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  const db = new Database(dbPath);

  try {
    // Obtener contratos con información de facturas
    const contratos = db.prepare(`
      SELECT 
        c.id_contrato,
        c.numero_contrato,
        c.id_solicitud_equipo,
        c.estado as estado_contrato,
        ese.numero_solicitud_equipo,
        (cl.nombre_cliente || ' ' || COALESCE(cl.apellidos_cliente, '')) as nombre_cliente,
        cl.id_cliente,
        COALESCE(SUM(CASE WHEN fc.estado_factura = 0 THEN fc.monto_total ELSE 0 END), 0) as monto_pendiente,
        COALESCE(SUM(CASE WHEN fc.estado_factura = 1 THEN fc.monto_total ELSE 0 END), 0) as monto_pagado,
        COALESCE(SUM(fc.monto_total), 0) as monto_total_facturas,
        COUNT(fc.id_factura_contrato) as cantidad_facturas
      FROM contrato c
      INNER JOIN encabezado_solicitud_equipo ese ON c.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN cliente cl ON ese.id_cliente = cl.id_cliente
      LEFT JOIN factura_contrato fc ON c.id_contrato = fc.id_contrato
      WHERE c.estado IN (0, 1)
      GROUP BY c.id_contrato, c.numero_contrato, c.id_solicitud_equipo, c.estado, 
               ese.numero_solicitud_equipo, nombre_cliente, cl.id_cliente
      ORDER BY c.created_at DESC
    `).all();

    return res.status(200).json({
      success: true,
      data: contratos
    });

  } catch (error: any) {
    console.error('Error al obtener contratos con facturas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  } finally {
    db.close();
  }
}
