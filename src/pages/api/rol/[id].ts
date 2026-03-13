import type { NextApiRequest, NextApiResponse } from 'next';
import { rolModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const rolId = Number(id);

    if (isNaN(rolId)) {
      return res.status(400).json({ success: false, error: 'Invalid rol ID' });
    }

    if (req.method === 'GET') {
      const rol = rolModel.getById(rolId);
      
      if (!rol) {
        return res.status(404).json({ success: false, error: 'Rol no encontrado' });
      }

      return res.status(200).json({ success: true, data: rol });
    }

    if (req.method === 'PUT') {
      const { nombre_rol, descripcion_rol, estado_rol } = req.body;
      
      rolModel.update(rolId, {
        nombre_rol,
        descripcion_rol,
        estado_rol,
      });

      const updatedRol = rolModel.getById(rolId);
      return res.status(200).json({ success: true, data: updatedRol });
    }

    if (req.method === 'DELETE') {
      rolModel.delete(rolId);
      return res.status(200).json({ success: true, message: 'Rol eliminado' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in rol API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
