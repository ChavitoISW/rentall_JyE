import type { NextApiRequest, NextApiResponse } from 'next';
import { contratoModel } from '../../../models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id_solicitud_equipo } = req.body;
      
      if (!id_solicitud_equipo) {
        return res.status(400).json({
          success: false,
          error: 'El id_solicitud_equipo es requerido'
        });
      }

      const result = await contratoModel.generarContrato(id_solicitud_equipo);
      
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error al generar contrato:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar contrato'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Método no permitido'
  });
}
