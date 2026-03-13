import type { NextApiRequest, NextApiResponse } from 'next';
import { detalleSolicitudEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const detalleId = Number(id);

    if (isNaN(detalleId)) {
      return res.status(400).json({ success: false, error: 'ID de detalle inválido' });
    }

    if (req.method === 'GET') {
      const detalle = detalleSolicitudEquipoModel.getById(detalleId);

      if (!detalle) {
        return res.status(404).json({ success: false, error: 'Detalle no encontrado' });
      }

      return res.status(200).json({ success: true, data: detalle });
    }

    if (req.method === 'PUT') {
      detalleSolicitudEquipoModel.update(detalleId, req.body);

      const updatedDetalle = detalleSolicitudEquipoModel.getById(detalleId);
      return res.status(200).json({ success: true, data: updatedDetalle });
    }

    if (req.method === 'DELETE') {
      detalleSolicitudEquipoModel.delete(detalleId);
      return res.status(200).json({ success: true, message: 'Detalle eliminado' });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API de detalle:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
