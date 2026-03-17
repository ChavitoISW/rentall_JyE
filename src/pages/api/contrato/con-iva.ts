import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Método ${req.method} no permitido` });
  }

  try {
    // Query para obtener contratos que usan factura (IVA) y NO tienen facturas registradas
    const query = `
      SELECT 
        co.id_contrato,
        co.numero_contrato,
        se.id_solicitud_equipo,
        se.numero_solicitud_equipo,
        COALESCE(cli.nombre_cliente || ' ' || cli.apellidos_cliente, se.nombre_recibe) as nombre_cliente,
        se.total_solicitud_equipo,
        se.iva_solicitud_equipo,
        se.usa_factura,
        se.fecha_inicio,
        se.fecha_vencimiento,
        co.estado as estado_contrato,
        COUNT(fc.id_factura_contrato) as total_facturas,
        COALESCE(SUM(CASE WHEN fc.estado_factura = 1 THEN 1 ELSE 0 END), 0) as facturas_pagadas
      FROM contrato co
      INNER JOIN encabezado_solicitud_equipo se ON co.id_solicitud_equipo = se.id_solicitud_equipo
      LEFT JOIN cliente cli ON se.id_cliente = cli.id_cliente
      LEFT JOIN factura_contrato fc ON co.id_contrato = fc.id_contrato
      WHERE co.estado != 0 AND se.usa_factura = 1
      GROUP BY co.id_contrato, se.id_solicitud_equipo, se.numero_solicitud_equipo, 
               nombre_cliente, se.total_solicitud_equipo, se.iva_solicitud_equipo,
               se.usa_factura, se.fecha_inicio, se.fecha_vencimiento, co.estado
      HAVING COUNT(fc.id_factura_contrato) = 0
      ORDER BY co.created_at DESC
    `;

    const contratos = db.prepare(query).all();

    return res.status(200).json({ success: true, data: contratos });
  } catch (error: any) {
    console.error('Error en API contratos-con-iva:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
