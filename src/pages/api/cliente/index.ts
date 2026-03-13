import type { NextApiRequest, NextApiResponse } from 'next';
import { clienteModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { estado, documento } = req.query;
      
      let clientes;
      if (documento && typeof documento === 'string') {
        const cliente = clienteModel.getByDocumento(documento);
        return res.status(200).json({ success: true, data: cliente });
      } else if (estado !== undefined) {
        const estadoBool = estado === 'true' || estado === '1';
        clientes = clienteModel.getByEstado(estadoBool);
      } else {
        clientes = clienteModel.getAll();
      }

      return res.status(200).json({ success: true, data: clientes });
    }

    if (req.method === 'POST') {
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

      if (!documento_identidad_cliente || !nombre_cliente || !apellidos_cliente) {
        return res.status(400).json({
          success: false,
          error: 'documento_identidad_cliente, nombre_cliente y apellidos_cliente son requeridos',
        });
      }

      const clienteId = clienteModel.create({
        documento_identidad_cliente,
        nombre_cliente,
        apellidos_cliente,
        telefono_cliente,
        email_cliente,
        provincia: provincia || null,
        canton: canton || null,
        distrito: distrito || null,
        otras_senas: otras_senas || null,
        estado_cliente: estado_cliente !== undefined ? estado_cliente : true,
      });

      const cliente = clienteModel.getById(Number(clienteId));
      return res.status(201).json({ success: true, data: cliente });
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
