import type { NextApiRequest, NextApiResponse } from 'next';
import { andamioModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const andamios = andamioModel.getAll();
      res.status(200).json({ success: true, data: andamios });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener andamios' });
    }
  } else if (req.method === 'POST') {
    try {
      const result = andamioModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al crear andamio' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
