import type { NextApiRequest, NextApiResponse } from 'next';
import { categoriaEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { estado } = req.query;
      
      let categorias;
      if (estado !== undefined) {
        const estadoBool = estado === 'true' || estado === '1';
        categorias = categoriaEquipoModel.getByEstado(estadoBool);
      } else {
        categorias = categoriaEquipoModel.getAll();
      }

      return res.status(200).json({ success: true, data: categorias });
    }

    if (req.method === 'POST') {
      const { nombre, descripcion, estado } = req.body;

      if (!nombre) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nombre es requerido' 
        });
      }

      const categoriaId = categoriaEquipoModel.create({
        nombre,
        descripcion,
        estado: estado !== undefined ? estado : true,
      });

      const categoria = categoriaEquipoModel.getById(Number(categoriaId));
      return res.status(201).json({ success: true, data: categoria });
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
