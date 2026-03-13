import type { NextApiRequest, NextApiResponse } from 'next';
import { rompedorModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rompedores = rompedorModel.getAll();
      res.status(200).json({ success: true, data: rompedores });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener rompedores' });
    }
  } else if (req.method === 'POST') {
    try {
      const result = rompedorModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al crear rompedor' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
