import type { NextApiRequest, NextApiResponse } from 'next';
import { vibradorModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const vibradorId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const vibrador = vibradorModel.getById(vibradorId);
      if (vibrador) {
        res.status(200).json({ success: true, data: vibrador });
      } else {
        res.status(404).json({ success: false, error: 'Vibrador no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener vibrador' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = vibradorModel.update(vibradorId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar vibrador' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = vibradorModel.delete(vibradorId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar vibrador' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
