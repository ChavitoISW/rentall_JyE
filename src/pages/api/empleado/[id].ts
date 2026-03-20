import type { NextApiRequest, NextApiResponse } from 'next';
import { empleadoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const empleadoId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const empleado = empleadoModel.getById(empleadoId);
      if (empleado) {
        res.status(200).json({ success: true, data: empleado });
      } else {
        res.status(404).json({ success: false, error: 'Empleado no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener empleado' });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = empleadoModel.update(empleadoId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al actualizar empleado' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
