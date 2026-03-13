import type { NextApiRequest, NextApiResponse } from 'next';
import { rolModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { estado } = req.query;
      
      let roles;
      if (estado !== undefined) {
        const estadoBool = estado === 'true' || estado === '1';
        roles = rolModel.getByEstado(estadoBool);
      } else {
        roles = rolModel.getAll();
      }

      return res.status(200).json({ success: true, data: roles });
    }

    if (req.method === 'POST') {
      const { nombre_rol, descripcion_rol, estado_rol } = req.body;

      if (!nombre_rol) {
        return res.status(400).json({ 
          success: false, 
          error: 'nombre_rol es requerido' 
        });
      }

      const rolId = rolModel.create({
        nombre_rol,
        descripcion_rol,
        estado_rol: estado_rol !== undefined ? estado_rol : true,
      });

      const rol = rolModel.getById(Number(rolId));
      return res.status(201).json({ success: true, data: rol });
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
