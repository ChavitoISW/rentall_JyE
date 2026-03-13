import type { NextApiRequest, NextApiResponse } from 'next';
import { clienteModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const clienteId = Number(id);

    if (isNaN(clienteId)) {
      return res.status(400).json({ success: false, error: 'Invalid cliente ID' });
    }

    if (req.method === 'GET') {
      const cliente = clienteModel.getById(clienteId);

      if (!cliente) {
        return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      }

      return res.status(200).json({ success: true, data: cliente });
    }

    if (req.method === 'PUT') {
      const {
        documento_identidad_cliente,
        nombre_cliente,
        apellidos_cliente,
        telefono_cliente,
        email_cliente,
        provincia,
        canton,
        distrito,
        otras_senas,
        estado_cliente,
      } = req.body;

      clienteModel.update(clienteId, {
        documento_identidad_cliente,
        nombre_cliente,
        apellidos_cliente,
        telefono_cliente,
        email_cliente,
        provincia: provincia || null,
        canton: canton || null,
        distrito: distrito || null,
        otras_senas: otras_senas || null,
        estado_cliente,
      });

      const updatedCliente = clienteModel.getById(clienteId);
      return res.status(200).json({ success: true, data: updatedCliente });
    }

    if (req.method === 'DELETE') {
      clienteModel.delete(clienteId);
      return res.status(200).json({ success: true, message: 'Cliente eliminado' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in cliente API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
