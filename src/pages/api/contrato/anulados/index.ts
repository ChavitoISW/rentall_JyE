import type { NextApiRequest, NextApiResponse } from 'next';
import { contratoModel } from '../../../../models';
import db from '../../../../lib/database';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Obtener todos los contratos anulados con información adicional
      const contratosAnulados = db.prepare(`
        SELECT 
          c.*,
          c.id_contrato as numero_contrato,
          ese.numero_solicitud_equipo,
          cl.nombre_cliente || ' ' || cl.apellidos_cliente as nombre_cliente,
          ac.motivo_anulacion,
          ac.fecha_anulacion,
          ac.usuario_anulacion as anulado_por
        FROM contrato c
        LEFT JOIN encabezado_solicitud_equipo ese ON c.id_solicitud_equipo = ese.id_solicitud_equipo
        LEFT JOIN cliente cl ON ese.id_cliente = cl.id_cliente
        LEFT JOIN anulacion_contrato ac ON c.id_contrato = ac.id_contrato
        WHERE c.estado = 0
        ORDER BY ac.fecha_anulacion DESC, c.created_at DESC
      `).all();

      return res.status(200).json({ 
        success: true, 
        data: contratosAnulados 
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in contratos anulados API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
