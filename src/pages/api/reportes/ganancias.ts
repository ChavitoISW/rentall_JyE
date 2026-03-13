import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

interface GananciaPorCategoria {
  categoria: string;
  total_ganancias: number;
  cantidad_contratos: number;
  cantidad_pagos: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Método ${req.method} no permitido` });
  }

  try {
    const { fecha_inicio, fecha_fin, nombre_equipo } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requieren fecha_inicio y fecha_fin' 
      });
    }

    // Query para obtener ganancias agrupadas por categoría de equipo
    const query = `
      SELECT 
        COALESCE(ce.nombre, 'Sin categoría') as categoria,
        SUM(pc.monto) as total_ganancias,
        COUNT(DISTINCT co.id_contrato) as cantidad_contratos,
        COUNT(pc.id_pago_contrato) as cantidad_pagos
      FROM pago_contrato pc
      INNER JOIN contrato co ON pc.id_contrato = co.id_contrato
      INNER JOIN encabezado_solicitud_equipo se ON co.id_solicitud_equipo = se.id_solicitud_equipo
      LEFT JOIN detalle_solicitud_equipo dse ON se.numero_solicitud_equipo = dse.numero_solicitud_equipo
      LEFT JOIN equipo e ON dse.id_equipo = e.id_equipo
      LEFT JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
      WHERE DATE(pc.fecha_pago) BETWEEN DATE(?) AND DATE(?)
        AND co.estado = 1
        AND NOT EXISTS (
          SELECT 1 FROM anulacion_contrato ac 
          WHERE ac.id_contrato = co.id_contrato
        )
        ${nombre_equipo && nombre_equipo !== 'todos' ? 'AND e.nombre_equipo = ?' : ''}
      GROUP BY ce.nombre
      ORDER BY total_ganancias DESC
    `;

    const params = [fecha_inicio, fecha_fin];
    if (nombre_equipo && nombre_equipo !== 'todos') {
      params.push(nombre_equipo as string);
    }

    const ganancias = db.prepare(query).all(...params) as GananciaPorCategoria[];

    // Calcular saldos pendientes en el período
    const saldosQuery = `
      SELECT 
        COUNT(DISTINCT c.id_contrato) as cantidad_contratos,
        SUM(se.total_solicitud_equipo - COALESCE(pagos.total_pagado, 0)) as total_saldos
      FROM contrato c
      INNER JOIN encabezado_solicitud_equipo se ON c.id_solicitud_equipo = se.id_solicitud_equipo
      LEFT JOIN (
        SELECT id_contrato, SUM(monto) as total_pagado
        FROM pago_contrato
        GROUP BY id_contrato
      ) pagos ON c.id_contrato = pagos.id_contrato
      LEFT JOIN detalle_solicitud_equipo dse ON se.numero_solicitud_equipo = dse.numero_solicitud_equipo
      LEFT JOIN equipo e ON dse.id_equipo = e.id_equipo
      WHERE c.estado = 1
        AND DATE(se.fecha_elaboracion) BETWEEN DATE(?) AND DATE(?)
        AND (se.total_solicitud_equipo - COALESCE(pagos.total_pagado, 0)) > 0
        AND NOT EXISTS (
          SELECT 1 FROM anulacion_contrato ac 
          WHERE ac.id_contrato = c.id_contrato
        )
        ${nombre_equipo && nombre_equipo !== 'todos' ? 'AND e.nombre_equipo = ?' : ''}
    `;

    const saldosParams = [fecha_inicio, fecha_fin];
    if (nombre_equipo && nombre_equipo !== 'todos') {
      saldosParams.push(nombre_equipo as string);
    }

    const saldosData = db.prepare(saldosQuery).get(...saldosParams) as any;

    // Calcular totales generales
    const totales = {
      total_general: ganancias.reduce((sum, item) => sum + item.total_ganancias, 0),
      total_contratos: ganancias.reduce((sum, item) => sum + item.cantidad_contratos, 0),
      total_pagos: ganancias.reduce((sum, item) => sum + item.cantidad_pagos, 0),
      saldos_pendientes: saldosData?.total_saldos || 0,
      contratos_con_saldo: saldosData?.cantidad_contratos || 0
    };

    return res.status(200).json({ 
      success: true, 
      data: {
        ganancias,
        totales,
        rango: {
          fecha_inicio,
          fecha_fin
        }
      }
    });
  } catch (error: any) {
    console.error('Error en API reportes/ganancias:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
