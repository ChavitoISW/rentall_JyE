import type { NextApiRequest, NextApiResponse } from 'next';
import { categoriaEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const categoriaId = Number(id);

    if (isNaN(categoriaId)) {
      return res.status(400).json({ success: false, error: 'Invalid categoria ID' });
    }

    if (req.method === 'GET') {
      const categoria = categoriaEquipoModel.getById(categoriaId);
      
      if (!categoria) {
        return res.status(404).json({ success: false, error: 'Categoria no encontrada' });
      }

      return res.status(200).json({ success: true, data: categoria });
    }

    if (req.method === 'PUT') {
      const { nombre, descripcion, estado } = req.body;
      
      categoriaEquipoModel.update(categoriaId, {
        nombre,
        descripcion,
        estado,
      });

      const updatedCategoria = categoriaEquipoModel.getById(categoriaId);
      return res.status(200).json({ success: true, data: updatedCategoria });
    }

    if (req.method === 'DELETE') {
      categoriaEquipoModel.delete(categoriaId);
      return res.status(200).json({ success: true, message: 'Categoria eliminada' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in categoria_equipo API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
