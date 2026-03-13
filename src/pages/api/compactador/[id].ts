import type { NextApiRequest, NextApiResponse } from 'next';
import { compactadorModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const compactadorId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const compactador = compactadorModel.getById(compactadorId);
      if (compactador) {
        res.status(200).json({ success: true, data: compactador });
      } else {
        res.status(404).json({ success: false, error: 'Compactador no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener compactador' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = compactadorModel.update(compactadorId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar compactador' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = compactadorModel.delete(compactadorId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar compactador' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
