import type { NextApiRequest, NextApiResponse } from 'next';
import { vibradorModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const vibradores = vibradorModel.getAll();
      res.status(200).json({ success: true, data: vibradores });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener vibradores' });
    }
  } else if (req.method === 'POST') {
    try {
      const result = vibradorModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al crear vibrador' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
