import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_equipo } = req.query;

    if (!id_equipo) {
      return res.status(400).json({ error: 'ID de equipo requerido' });
    }

    const bitacora = db.prepare(`
      SELECT 
        id_bitacora,
        id_equipo,
        nombre_equipo,
        id_solicitud_equipo,
        numero_solicitud_equipo,
        cantidad_equipo,
        fecha_inicio,
        fecha_devolucion,
        estado_uso,
        estado_bitacora,
        observaciones,
        nombre_cliente,
        created_at
      FROM vista_bitacora_equipo
      WHERE estado_bitacora = 1 AND id_equipo = ?
      ORDER BY created_at DESC
    `).all(id_equipo);

    res.status(200).json({ data: bitacora });
  } catch (error) {
    console.error('Error al obtener bitácora:', error);
    res.status(500).json({ error: 'Error al obtener la bitácora de equipos' });
  }
}
