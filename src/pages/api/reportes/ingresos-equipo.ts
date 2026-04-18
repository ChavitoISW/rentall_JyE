import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ success: false, error: 'Se requieren fecha_inicio y fecha_fin' });
    }

    // Pagos recibidos agrupados por categoría, distribuidos proporcionalmente por monto_final del detalle
    const categoriaRows = db.prepare(`
      SELECT
        COALESCE(ce.nombre, 'Sin categoría') as categoria,
        COUNT(DISTINCT pc.id_contrato)       as cantidad_contratos,
        SUM(
          pc.monto * dse.monto_final / NULLIF((
            SELECT SUM(d2.monto_final)
            FROM detalle_solicitud_equipo d2
            WHERE d2.numero_solicitud_equipo = dse.numero_solicitud_equipo
          ), 0)
        ) as total_pagado
      FROM pago_contrato pc
      INNER JOIN contrato co  ON pc.id_contrato = co.id_contrato
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN detalle_solicitud_equipo dse    ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
      INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
      LEFT  JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
      WHERE DATE(pc.fecha_pago) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
        AND ese.estado_solicitud_equipo NOT IN (1, 7, 8)
      GROUP BY ce.id
      HAVING total_pagado > 0
      ORDER BY total_pagado DESC
    `).all(fecha_inicio, fecha_fin) as any[];

    // Envío y descuento: suma directa de contratos con pagos en el período
    const extrasRow = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN ese.pago_envio = 1 THEN COALESCE(ese.monto_envio, 0) ELSE 0 END), 0) as total_envio,
        COALESCE(SUM(COALESCE(ese.descuento_solicitud_equipo, 0)), 0) as total_descuento
      FROM contrato co
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      WHERE co.estado != 0
        AND ese.estado_solicitud_equipo NOT IN (1, 7, 8)
        AND EXISTS (
          SELECT 1 FROM pago_contrato pc
          WHERE pc.id_contrato = co.id_contrato
            AND DATE(pc.fecha_pago) BETWEEN DATE(?) AND DATE(?)
        )
    `).get(fecha_inicio, fecha_fin) as any;

    const subtotal        = categoriaRows.reduce((s: number, r: any) => s + (r.total_pagado || 0), 0);
    const total_envio     = extrasRow?.total_envio     ?? 0;
    const total_descuento = extrasRow?.total_descuento ?? 0;

    return res.status(200).json({
      success: true,
      data: {
        categorias: categoriaRows,
        total_envio,
        total_descuento,
        subtotal,
        total: subtotal + total_envio - total_descuento,
        rango: { fecha_inicio, fecha_fin }
      }
    });
  } catch (error) {
    console.error('Error en reporte ingresos-equipo:', error);
    return res.status(500).json({ success: false, error: 'Error al generar el reporte' });
  }
}

