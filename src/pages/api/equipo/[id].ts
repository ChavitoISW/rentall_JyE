import type { NextApiRequest, NextApiResponse } from 'next';
import { equipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const equipoId = Number(id);

    if (isNaN(equipoId)) {
      return res.status(400).json({ success: false, error: 'Invalid equipo ID' });
    }

    if (req.method === 'GET') {
      const equipo = equipoModel.getById(equipoId);

      if (!equipo) {
        return res.status(404).json({ success: false, error: 'Equipo no encontrado' });
      }

      return res.status(200).json({ success: true, data: equipo });
    }

    if (req.method === 'PUT') {
      const {
        cantidad_equipo,
        nombre_equipo,
        id_equipo_categoria,
        id_estado_equipo,
        id_equipo_especifico,
      } = req.body;

      equipoModel.update(equipoId, {
        cantidad_equipo,
        nombre_equipo,
        id_equipo_categoria,
        id_estado_equipo,
        id_equipo_especifico,
      });

      const updatedEquipo = equipoModel.getById(equipoId);
      return res.status(200).json({ success: true, data: updatedEquipo });
    }

    if (req.method === 'DELETE') {
      equipoModel.delete(equipoId);
      return res.status(200).json({ success: true, message: 'Equipo eliminado' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in equipo API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
