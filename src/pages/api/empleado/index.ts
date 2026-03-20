import type { NextApiRequest, NextApiResponse } from 'next';
import { empleadoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const empleados = empleadoModel.getAll();
      res.status(200).json({ success: true, data: empleados });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      res.status(500).json({ success: false, error: 'Error al obtener empleados' });
    }
  } else if (req.method === 'POST') {
    try {
      const result = empleadoModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error al crear empleado:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al crear empleado: ' + (error.message || error.toString())
      });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
