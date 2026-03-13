import type { NextApiRequest, NextApiResponse } from 'next';
import { puntalModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const puntalId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const puntal = puntalModel.getById(puntalId);
      if (puntal) {
        res.status(200).json({ success: true, data: puntal });
      } else {
        res.status(404).json({ success: false, error: 'Puntal no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener puntal' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = puntalModel.update(puntalId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar puntal' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = puntalModel.delete(puntalId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar puntal' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
