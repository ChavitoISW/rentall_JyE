import type { NextApiRequest, NextApiResponse } from 'next';
import { mezcladoraModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const mezcladoras = mezcladoraModel.getAll();
      res.status(200).json({ success: true, data: mezcladoras });
    } catch (error: any) {
      console.error('Error al obtener mezcladoras:', error);
      res.status(500).json({ success: false, error: 'Error al obtener mezcladoras: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const mezcladoraData = {
        ...req.body,
        estado_mezcladora: req.body.estado_mezcladora ? 1 : 0
      };
      const result = mezcladoraModel.create(mezcladoraData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error al crear mezcladora:', error);
      res.status(500).json({ success: false, error: 'Error al crear mezcladora: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
