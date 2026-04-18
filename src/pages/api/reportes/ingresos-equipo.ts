import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren fecha_inicio y fecha_fin'
      });
    }

    // Ingresos cobrados agrupados por equipo
    const cobradoRows = db.prepare(`
      SELECT
        e.nombre_equipo,
        e.codigo_equipo,
        COALESCE(ce.nombre, 'Sin categoría') as categoria,
        COUNT(DISTINCT co.id_contrato)    as cantidad_contratos,
        SUM(pc.monto)                     as monto_cobrado
      FROM pago_contrato pc
      INNER JOIN contrato co ON pc.id_contrato = co.id_contrato
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN detalle_solicitud_equipo dse ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
      INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
      LEFT  JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
      WHERE DATE(pc.fecha_pago) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
        AND NOT EXISTS (
          SELECT 1 FROM anulacion_contrato ac WHERE ac.id_contrato = co.id_contrato
        )
      GROUP BY e.id_equipo
      ORDER BY monto_cobrado DESC
    `).all(fecha_inicio, fecha_fin) as any[];

    // Pendientes por cobrar agrupados por equipo (contratos con saldo > 0 creados en el rango)
    const pendienteRows = db.prepare(`
      SELECT
        e.nombre_equipo,
        e.codigo_equipo,
        COALESCE(ce.nombre, 'Sin categoría') as categoria,
        COUNT(DISTINCT co.id_contrato) as cantidad_contratos,
        SUM(
          ese.total_solicitud_equipo
          - COALESCE((
              SELECT SUM(monto) FROM pago_contrato pc2
              WHERE pc2.id_contrato = co.id_contrato
            ), 0)
        ) as monto_pendiente
      FROM contrato co
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN detalle_solicitud_equipo dse ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
      INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
      LEFT  JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
      WHERE DATE(ese.fecha_elaboracion) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
        AND NOT EXISTS (
          SELECT 1 FROM anulacion_contrato ac WHERE ac.id_contrato = co.id_contrato
        )
        AND (
          ese.total_solicitud_equipo
          - COALESCE((
              SELECT SUM(monto) FROM pago_contrato pc2
              WHERE pc2.id_contrato = co.id_contrato
            ), 0)
        ) > 0
      GROUP BY e.id_equipo
      ORDER BY monto_pendiente DESC
    `).all(fecha_inicio, fecha_fin) as any[];

    const totales = {
      total_cobrado: cobradoRows.reduce((s: number, r: any) => s + (r.monto_cobrado || 0), 0),
      total_pendiente: pendienteRows.reduce((s: number, r: any) => s + (r.monto_pendiente || 0), 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        cobrado: cobradoRows,
        pendiente: pendienteRows,
        totales,
        rango: { fecha_inicio, fecha_fin }
      }
    });
  } catch (error) {
    console.error('Error en reporte ingresos-equipo:', error);
    return res.status(500).json({ success: false, error: 'Error al generar el reporte' });
  }
}
