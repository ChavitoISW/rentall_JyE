import type { NextApiRequest, NextApiResponse } from 'next';
import { encabezadoSolicitudEquipoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const solicitudesEquipo = encabezadoSolicitudEquipoModel.getAll();
      res.status(200).json({ success: true, data: solicitudesEquipo });
    } catch (error: any) {
      console.error('Error al obtener solicitudes de equipo:', error);
      res.status(500).json({ success: false, error: 'Error al obtener solicitudes de equipo: ' + error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const solicitudEquipoData = {
        ...req.body,
        pago_envio: req.body.pago_envio ? 1 : 0,
        usa_factura: req.body.usa_factura ? 1 : 0
      };
      const idSolicitudEquipo = encabezadoSolicitudEquipoModel.create(solicitudEquipoData);
      const solicitudEquipoCreada = encabezadoSolicitudEquipoModel.getById(Number(idSolicitudEquipo));
      res.status(201).json({ success: true, data: solicitudEquipoCreada });
    } catch (error: any) {
      console.error('Error al crear solicitud de equipo:', error);
      res.status(500).json({ success: false, error: 'Error al crear solicitud de equipo: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
