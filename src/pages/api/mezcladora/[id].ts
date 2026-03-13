import type { NextApiRequest, NextApiResponse } from 'next';
import { mezcladoraModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const mezcladoraId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const mezcladora = mezcladoraModel.getById(mezcladoraId);
      if (mezcladora) {
        res.status(200).json({ success: true, data: mezcladora });
      } else {
        res.status(404).json({ success: false, error: 'Mezcladora no encontrada' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener mezcladora' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = mezcladoraModel.update(mezcladoraId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar mezcladora' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = mezcladoraModel.delete(mezcladoraId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar mezcladora' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
