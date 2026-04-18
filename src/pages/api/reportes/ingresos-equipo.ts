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

    const total = categoriaRows.reduce((s: number, r: any) => s + (r.total_pagado || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        categorias: categoriaRows,
        total,
        rango: { fecha_inicio, fecha_fin }
      }
    });
  } catch (error) {
    console.error('Error en reporte ingresos-equipo:', error);
    return res.status(500).json({ success: false, error: 'Error al generar el reporte' });
  }
}

