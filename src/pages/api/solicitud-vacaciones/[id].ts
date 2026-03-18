import type { NextApiRequest, NextApiResponse } from 'next';
import { solicitudVacacionesModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const solicitudId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const solicitud = solicitudVacacionesModel.getById(solicitudId);
      if (solicitud) {
        res.status(200).json({ success: true, data: solicitud });
      } else {
        res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener solicitud' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = solicitudVacacionesModel.update(solicitudId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar solicitud' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = solicitudVacacionesModel.delete(solicitudId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar solicitud' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
