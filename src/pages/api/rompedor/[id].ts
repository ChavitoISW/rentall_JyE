import type { NextApiRequest, NextApiResponse } from 'next';
import { rompedorModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const rompedorId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const rompedor = rompedorModel.getById(rompedorId);
      if (rompedor) {
        res.status(200).json({ success: true, data: rompedor });
      } else {
        res.status(404).json({ success: false, error: 'Rompedor no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener rompedor' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = rompedorModel.update(rompedorId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar rompedor' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = rompedorModel.delete(rompedorId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar rompedor' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
