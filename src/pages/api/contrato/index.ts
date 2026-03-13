import type { NextApiRequest, NextApiResponse } from 'next';
import { contratoModel } from '../../../models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const contratos = contratoModel.getAll();
      return res.status(200).json({
        success: true,
        data: contratos
      });
    } catch (error: any) {
      console.error('Error al obtener contratos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener contratos'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Método no permitido'
  });
}
