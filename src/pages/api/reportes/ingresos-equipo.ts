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

    // Ingresos cobrados agrupados por equipo — distribuidos proporcionalmente por monto_final del detalle
    // Se usa SUM(monto_final) de las líneas como denominador para manejar correctamente:
    //   - Descuentos por línea (ya incluidos en monto_final)
    //   - Descuento global del encabezado (se distribuye proporcionalmente entre líneas)
    //   - Envío (no pertenece a ningún equipo, queda fuera de la distribución)
    const cobradoRows = db.prepare(`
      SELECT
        e.nombre_equipo,
        COALESCE(ce.nombre, 'Sin categoría') as categoria,
        COUNT(DISTINCT co.id_contrato) as cantidad_contratos,
        SUM(
          pc.monto * dse.monto_final / NULLIF((
            SELECT SUM(d2.monto_final)
            FROM detalle_solicitud_equipo d2
            WHERE d2.numero_solicitud_equipo = dse.numero_solicitud_equipo
          ), 0)
        ) as monto_cobrado
      FROM pago_contrato pc
      INNER JOIN contrato co ON pc.id_contrato = co.id_contrato
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN detalle_solicitud_equipo dse ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
      INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
      LEFT  JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
      WHERE DATE(pc.fecha_pago) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
      GROUP BY e.id_equipo
      HAVING monto_cobrado > 0
      ORDER BY monto_cobrado DESC
    `).all(fecha_inicio, fecha_fin) as any[];

    // Pendientes por cobrar agrupados por equipo — misma distribución proporcional
    const pendienteRows = db.prepare(`
      SELECT
        e.nombre_equipo,
        COALESCE(ce.nombre, 'Sin categoría') as categoria,
        COUNT(DISTINCT co.id_contrato) as cantidad_contratos,
        SUM(
          (ese.total_solicitud_equipo - COALESCE((
            SELECT SUM(monto) FROM pago_contrato pc2
            WHERE pc2.id_contrato = co.id_contrato
          ), 0))
          * dse.monto_final / NULLIF((
            SELECT SUM(d2.monto_final)
            FROM detalle_solicitud_equipo d2
            WHERE d2.numero_solicitud_equipo = dse.numero_solicitud_equipo
          ), 0)
        ) as monto_pendiente
      FROM contrato co
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      INNER JOIN detalle_solicitud_equipo dse ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
      INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
      LEFT  JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
      WHERE DATE(ese.fecha_elaboracion) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
      GROUP BY e.id_equipo
      HAVING monto_pendiente > 0
      ORDER BY monto_pendiente DESC
    `).all(fecha_inicio, fecha_fin) as any[];

    // Envío cobrado: proporción del pago que corresponde al envío (pago × monto_envio / total)
    const envioCobradobRow = db.prepare(`
      SELECT COALESCE(SUM(
        pc.monto * ese.monto_envio / NULLIF(ese.total_solicitud_equipo, 0)
      ), 0) as envio_cobrado
      FROM pago_contrato pc
      INNER JOIN contrato co ON pc.id_contrato = co.id_contrato
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      WHERE DATE(pc.fecha_pago) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
        AND ese.pago_envio = 1
    `).get(fecha_inicio, fecha_fin) as any;

    // Envío pendiente: proporción del saldo pendiente que corresponde al envío
    const envioPendienteRow = db.prepare(`
      SELECT COALESCE(SUM(
        (ese.total_solicitud_equipo - COALESCE((
          SELECT SUM(monto) FROM pago_contrato pc2
          WHERE pc2.id_contrato = co.id_contrato
        ), 0))
        * ese.monto_envio / NULLIF(ese.total_solicitud_equipo, 0)
      ), 0) as envio_pendiente
      FROM contrato co
      INNER JOIN encabezado_solicitud_equipo ese ON co.id_solicitud_equipo = ese.id_solicitud_equipo
      WHERE DATE(ese.fecha_elaboracion) BETWEEN DATE(?) AND DATE(?)
        AND co.estado != 0
        AND ese.pago_envio = 1
        AND (
          (ese.total_solicitud_equipo - COALESCE((
            SELECT SUM(monto) FROM pago_contrato pc2
            WHERE pc2.id_contrato = co.id_contrato
          ), 0))
          * ese.monto_envio / NULLIF(ese.total_solicitud_equipo, 0)
        ) > 0
    `).get(fecha_inicio, fecha_fin) as any;

    const envioCobrado  = envioCobradobRow?.envio_cobrado  ?? 0;
    const envioPendiente = envioPendienteRow?.envio_pendiente ?? 0;

    const totales = {
      total_cobrado:         cobradoRows.reduce((s: number, r: any) => s + (r.monto_cobrado || 0), 0),
      total_pendiente:       pendienteRows.reduce((s: number, r: any) => s + (r.monto_pendiente || 0), 0),
      total_envio_cobrado:   envioCobrado,
      total_envio_pendiente: envioPendiente,
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
