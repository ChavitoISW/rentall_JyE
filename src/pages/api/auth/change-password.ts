import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

interface Usuario {
  contrasena_usuario: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id_usuario, contrasena_actual, contrasena_nueva } = req.body;

    if (!id_usuario || !contrasena_actual || !contrasena_nueva) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos',
      });
    }

    if (contrasena_nueva.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
    }

    // Verificar usuario y contraseña actual
    const usuario = db
      .prepare('SELECT contrasena_usuario FROM usuario WHERE id_usuario = ?')
      .get(id_usuario) as Usuario | undefined;

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Verificar contraseña actual
    if (usuario.contrasena_usuario !== contrasena_actual) {
      return res.status(401).json({
        success: false,
        error: 'La contraseña actual es incorrecta',
      });
    }

    // Actualizar contraseña
    db.prepare(
      "UPDATE usuario SET contrasena_usuario = ?, updated_at = datetime('now') WHERE id_usuario = ?"
    ).run(contrasena_nueva, id_usuario);

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error in change-password API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
}
