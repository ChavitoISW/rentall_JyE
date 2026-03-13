import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'ID de detalle inválido' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ success: false, error: `Método ${method} no permitido` });
    }
  } catch (error: any) {
    console.error('Error en API hoja-ruta/detalle:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  const detalle = db.prepare(
    'SELECT * FROM detalle_hoja_ruta WHERE id_detalle_hoja_ruta = ?'
  ).get(id);

  if (!detalle) {
    return res.status(404).json({ success: false, error: 'Detalle no encontrado' });
  }

  return res.status(200).json({ success: true, data: detalle });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { estado, hora_real, notas } = req.body;

  const detalle = db.prepare(
    'SELECT * FROM detalle_hoja_ruta WHERE id_detalle_hoja_ruta = ?'
  ).get(id);

  if (!detalle) {
    return res.status(404).json({ success: false, error: 'Detalle no encontrado' });
  }

  // Actualizar el detalle
  const update = db.prepare(
    `UPDATE detalle_hoja_ruta 
     SET estado = ?, hora_real = ?, notas = ?
     WHERE id_detalle_hoja_ruta = ?`
  );

  update.run(
    estado !== undefined ? estado : (detalle as any).estado,
    hora_real !== undefined ? hora_real : (detalle as any).hora_real,
    notas !== undefined ? notas : (detalle as any).notas,
    id
  );

  return res.status(200).json({ 
    success: true, 
    message: 'Detalle actualizado correctamente' 
  });
}
