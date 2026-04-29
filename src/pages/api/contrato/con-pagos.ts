import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Método ${req.method} no permitido` });
  }

  try {
    // Query para obtener contratos con información de pagos
    const query = `
      SELECT 
        co.id_contrato,
        co.estado,
        PRINTF('%05d', co.id_contrato) as numero_contrato,
        se.numero_solicitud_equipo,
        COALESCE(cli.nombre_cliente || ' ' || cli.apellidos_cliente, se.nombre_recibe) as nombre_cliente,
        cli.telefono_cliente,
        GROUP_CONCAT(e.nombre_equipo, ', ') as equipos,
        se.total_solicitud_equipo as total_contrato,
        se.usa_factura,
        se.iva_solicitud_equipo as iva_contrato,
        se.fecha_inicio,
        se.fecha_vencimiento,
        COALESCE(SUM(DISTINCT p.monto), 0) as monto_pagado,
        (se.total_solicitud_equipo - COALESCE(SUM(DISTINCT p.monto), 0)) as monto_pendiente,
        CASE
          WHEN COALESCE(SUM(DISTINCT p.monto), 0) = 0 THEN 'pendiente'
          WHEN COALESCE(SUM(DISTINCT p.monto), 0) >= se.total_solicitud_equipo THEN 'pagado'
          ELSE 'pago_parcial'
        END as estado_pago
      FROM contrato co
      INNER JOIN encabezado_solicitud_equipo se ON co.id_solicitud_equipo = se.id_solicitud_equipo
      LEFT JOIN cliente cli ON se.id_cliente = cli.id_cliente
      LEFT JOIN pago_contrato p ON co.id_contrato = p.id_contrato
      LEFT JOIN detalle_solicitud_equipo dse ON se.numero_solicitud_equipo = dse.numero_solicitud_equipo
      LEFT JOIN equipo e ON dse.id_equipo = e.id_equipo
      WHERE co.estado != 0
      GROUP BY co.id_contrato, co.estado, se.total_solicitud_equipo, se.usa_factura, se.iva_solicitud_equipo,
               se.numero_solicitud_equipo, nombre_cliente, cli.telefono_cliente, se.fecha_inicio, se.fecha_vencimiento
      ORDER BY co.id_contrato DESC
    `;

    const contratos = db.prepare(query).all();

    return res.status(200).json({ success: true, data: contratos });
  } catch (error: any) {
    console.error('Error en API contratos-con-pagos:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
