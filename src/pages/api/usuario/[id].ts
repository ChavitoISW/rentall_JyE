import type { NextApiRequest, NextApiResponse } from 'next';
import { usuarioModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const usuarioId = Number(id);

    if (isNaN(usuarioId)) {
      return res.status(400).json({ success: false, error: 'Invalid usuario ID' });
    }

    if (req.method === 'GET') {
      const usuario = usuarioModel.getById(usuarioId);

      if (!usuario) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      return res.status(200).json({ success: true, data: usuario });
    }

    if (req.method === 'PUT') {
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

      // Validar contraseña solo si se está actualizando
      if (contrasena_usuario && contrasena_usuario.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      const updateData: any = {
        identificacion_usuario,
        nombre_usuario,
        apellido_usuario,
        telefono_usuario,
        email_usuario,
        provincia,
        canton,
        distrito,
        otras_senas,
        direccion_usuario,
        estado_usuario,
        usuario_rol,
      };

      // Solo actualizar contraseña si se proporcionó una nueva
      if (contrasena_usuario) {
        updateData.contrasena_usuario = contrasena_usuario;
      }

      usuarioModel.update(usuarioId, updateData);

      const updatedUsuario = usuarioModel.getById(usuarioId);
      return res.status(200).json({ success: true, data: updatedUsuario });
    }

    if (req.method === 'DELETE') {
      usuarioModel.delete(usuarioId);
      return res.status(200).json({ success: true, message: 'Usuario eliminado' });
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
