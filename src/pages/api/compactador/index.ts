import type { NextApiRequest, NextApiResponse } from 'next';
import { compactadorModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const compactadores = compactadorModel.getAll();
      res.status(200).json({ success: true, data: compactadores });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener compactadores' });
    }
  } else if (req.method === 'POST') {
    try {
      const result = compactadorModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al crear compactador' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
