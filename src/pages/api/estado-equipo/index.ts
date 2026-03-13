import type { NextApiRequest, NextApiResponse } from 'next';
import { estadoEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { estado } = req.query;
      
      let estados;
      if (estado !== undefined) {
        const estadoBool = estado === 'true' || estado === '1';
        estados = estadoEquipoModel.getByEstado(estadoBool);
      } else {
        estados = estadoEquipoModel.getAll();
      }

      return res.status(200).json({ success: true, data: estados });
    }

    if (req.method === 'POST') {
      const { nombre, estado_estados } = req.body;

      if (!nombre) {
        return res.status(400).json({ 
          success: false, 
          error: 'nombre es requerido' 
        });
      }

      const estadoId = estadoEquipoModel.create({
        nombre,
        estado_estados: estado_estados !== undefined ? estado_estados : true,
      });

      const estado = estadoEquipoModel.getById(Number(estadoId));
      return res.status(201).json({ success: true, data: estado });
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
