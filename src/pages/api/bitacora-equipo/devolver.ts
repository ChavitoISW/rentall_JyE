import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { id_equipo, id_solicitud_equipo, fecha_devolucion, estado_bitacora } = req.body;

    if (!id_equipo || !id_solicitud_equipo) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de equipo e ID de solicitud son requeridos' 
      });
    }

    // Actualizar los registros de bitácora que estén activos (estado_bitacora = 1)
    // para este equipo y esta solicitud
    const updateBitacora = db.prepare(`
      UPDATE bitacora_equipo
      SET fecha_devolucion = ?,
          estado_bitacora = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id_equipo = ? 
        AND id_solicitud_equipo = ?
        AND estado_bitacora = 1
    `);

    const result = updateBitacora.run(
      fecha_devolucion || new Date().toISOString().split('T')[0],
      estado_bitacora || 2, // 2 = DEVUELTO
      id_equipo,
      id_solicitud_equipo
    );

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No se encontraron registros activos para actualizar' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `${result.changes} registro(s) actualizado(s)`,
      changes: result.changes 
    });
  } catch (error: any) {
    console.error('Error al actualizar bitácora:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar la bitácora de equipos',
      details: error.message 
    });
  }
}
