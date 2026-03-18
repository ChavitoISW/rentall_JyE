import type { NextApiRequest, NextApiResponse } from 'next';
import { solicitudVacacionesModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const solicitudes = solicitudVacacionesModel.getAll();
      res.status(200).json({ success: true, data: solicitudes });
    } catch (error) {
      console.error('Error al obtener solicitudes de vacaciones:', error);
      res.status(500).json({ success: false, error: 'Error al obtener solicitudes de vacaciones' });
    }
  } else if (req.method === 'POST') {
    try {
      const result = solicitudVacacionesModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error al crear solicitud de vacaciones:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al crear solicitud de vacaciones: ' + (error.message || error.toString())
      });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
