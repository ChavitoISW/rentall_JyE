import type { NextApiRequest, NextApiResponse } from 'next';
import { puntalModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const puntales = puntalModel.getAll();
      res.status(200).json({ success: true, data: puntales });
    } catch (error: any) {
      console.error('Error al obtener puntales:', error);
      res.status(500).json({ success: false, error: 'Error al obtener puntales: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const puntalData = {
        ...req.body,
        estado_puntal: req.body.estado_puntal ? 1 : 0
      };
      const result = puntalModel.create(puntalData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error al crear puntal:', error);
      res.status(500).json({ success: false, error: 'Error al crear puntal: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
