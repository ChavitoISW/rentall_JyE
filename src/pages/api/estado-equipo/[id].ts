import type { NextApiRequest, NextApiResponse } from 'next';
import { estadoEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const estadoId = Number(id);

    if (isNaN(estadoId)) {
      return res.status(400).json({ success: false, error: 'Invalid estado ID' });
    }

    if (req.method === 'GET') {
      const estado = estadoEquipoModel.getById(estadoId);
      
      if (!estado) {
        return res.status(404).json({ success: false, error: 'Estado no encontrado' });
      }

      return res.status(200).json({ success: true, data: estado });
    }

    if (req.method === 'PUT') {
      const { nombre, estado_estados } = req.body;
      
      estadoEquipoModel.update(estadoId, {
        nombre,
        estado_estados,
      });

      const updatedEstado = estadoEquipoModel.getById(estadoId);
      return res.status(200).json({ success: true, data: updatedEstado });
    }

    if (req.method === 'DELETE') {
      estadoEquipoModel.delete(estadoId);
      return res.status(200).json({ success: true, message: 'Estado eliminado' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in estado-equipo API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
