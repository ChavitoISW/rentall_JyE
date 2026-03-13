import type { NextApiRequest, NextApiResponse } from 'next';
import { detalleSolicitudEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { numero_solicitud_equipo, id_solicitud_equipo } = req.query;
      
      if (numero_solicitud_equipo && typeof numero_solicitud_equipo === 'string') {
        // Usar el método con JOIN para incluir nombre_equipo
        const detalles = detalleSolicitudEquipoModel.getDetallesByNumeroSolicitud(numero_solicitud_equipo);
        res.status(200).json({ success: true, data: detalles });
      } else if (id_solicitud_equipo && typeof id_solicitud_equipo === 'string') {
        // Buscar por ID de solicitud de equipo
        const detalles = detalleSolicitudEquipoModel.getDetallesByIdSolicitud(parseInt(id_solicitud_equipo));
        res.status(200).json({ success: true, data: detalles });
      } else {
        const detalles = detalleSolicitudEquipoModel.getAll();
        res.status(200).json({ success: true, data: detalles });
      }
    } catch (error: any) {
      console.error('Error al obtener detalles:', error);
      res.status(500).json({ success: false, error: 'Error al obtener detalles: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const result = detalleSolicitudEquipoModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error al crear detalle:', error);
      res.status(500).json({ success: false, error: 'Error al crear detalle: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
