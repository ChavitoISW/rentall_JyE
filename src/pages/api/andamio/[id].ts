import type { NextApiRequest, NextApiResponse } from 'next';
import { andamioModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const andamioId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const andamio = andamioModel.getById(andamioId);
      if (andamio) {
        res.status(200).json({ success: true, data: andamio });
      } else {
        res.status(404).json({ success: false, error: 'Andamio no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener andamio' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = andamioModel.update(andamioId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar andamio' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = andamioModel.delete(andamioId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar andamio' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
