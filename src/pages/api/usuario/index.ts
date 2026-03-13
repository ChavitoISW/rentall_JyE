import type { NextApiRequest, NextApiResponse } from 'next';
import { usuarioModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { estado, identificacion } = req.query;
      
      let usuarios;
      if (identificacion && typeof identificacion === 'string') {
        const usuario = usuarioModel.getByIdentificacion(identificacion);
        return res.status(200).json({ success: true, data: usuario });
      } else if (estado !== undefined) {
        const estadoBool = estado === 'true' || estado === '1';
        usuarios = usuarioModel.getByEstado(estadoBool);
      } else {
        usuarios = usuarioModel.getAll();
      }

      return res.status(200).json({ success: true, data: usuarios });
    }

    if (req.method === 'POST') {
      const {
        identificacion_usuario,
        nombre_usuario,
        apellido_usuario,
        telefono_usuario,
        email_usuario,
        contrasena_usuario,
        provincia,
        canton,
        distrito,
        otras_senas,
        direccion_usuario,
        estado_usuario,
        usuario_rol,
      } = req.body;

      if (!identificacion_usuario || !nombre_usuario || !apellido_usuario) {
        return res.status(400).json({
          success: false,
          error: 'identificacion_usuario, nombre_usuario y apellido_usuario son requeridos',
        });
      }

      if (!contrasena_usuario || contrasena_usuario.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña es requerida y debe tener al menos 6 caracteres',
        });
      }

      const usuarioId = usuarioModel.create({
        identificacion_usuario,
        nombre_usuario,
        apellido_usuario,
        telefono_usuario,
        email_usuario,
        contrasena_usuario,
        provincia: provincia || null,
        canton: canton || null,
        distrito: distrito || null,
        otras_senas: otras_senas || null,
        direccion_usuario,
        estado_usuario: estado_usuario !== undefined ? estado_usuario : true,
        usuario_rol,
      });

      const usuario = usuarioModel.getById(Number(usuarioId));
      return res.status(201).json({ success: true, data: usuario });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in usuario API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
