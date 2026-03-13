import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const equipos = db.prepare(`
      SELECT DISTINCT
        e.id_equipo,
        e.nombre_equipo,
        c.nombre as nombre_categoria
      FROM equipo e
      LEFT JOIN categoria_equipo c ON e.id_equipo_categoria = c.id
      ORDER BY e.nombre_equipo ASC
    `).all();

    res.status(200).json({ data: equipos });
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error al obtener la lista de equipos' });
  }
}
