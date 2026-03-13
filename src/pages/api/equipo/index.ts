import type { NextApiRequest, NextApiResponse } from 'next';
import { equipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { categoria, id_estado_equipo } = req.query;
      
      let equipos;
      if (categoria) {
        equipos = equipoModel.getByCategoria(Number(categoria));
      } else if (id_estado_equipo) {
        equipos = equipoModel.getByEstado(Number(id_estado_equipo));
      } else {
        equipos = equipoModel.getAll();
      }

      return res.status(200).json({ success: true, data: equipos });
    }

    if (req.method === 'POST') {
      const {
        cantidad_equipo,
        nombre_equipo,
        id_equipo_categoria,
        id_estado_equipo,
        id_equipo_especifico,
      } = req.body;

      if (!cantidad_equipo || !nombre_equipo) {
        return res.status(400).json({
          success: false,
          error: 'cantidad_equipo y nombre_equipo son requeridos',
        });
      }

      const equipoId = equipoModel.create({
        cantidad_equipo,
        nombre_equipo,
        id_equipo_categoria,
        id_estado_equipo,
        id_equipo_especifico,
      });

      const equipo = equipoModel.getById(Number(equipoId));
      return res.status(201).json({ success: true, data: equipo });
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
