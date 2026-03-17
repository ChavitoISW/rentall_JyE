import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

interface UsuarioDb {
  id_usuario: number;
  identificacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  email_usuario: string;
  contrasena_usuario: string;
  estado_usuario: number;
  usuario_rol: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { identificacion, contrasena } = req.body;

    if (!identificacion || !contrasena) {
      return res.status(400).json({
        success: false,
        error: 'Identificación y contraseña son requeridos',
      });
    }

    // Validación especial para usuario Admin (super usuario)
    if (identificacion === 'Admin' && contrasena === 'casa9876') {
      const adminUser = {
        id_usuario: 0,
        identificacion_usuario: 'Admin',
        nombre_usuario: 'Super',
        apellido_usuario: 'Administrador',
        email_usuario: 'admin@rentall.com',
        estado_usuario: 1,
        usuario_rol: 1, // Rol de super usuario/administrador
      };

      return res.status(200).json({
        success: true,
        data: adminUser,
        message: 'Login exitoso - Super Administrador',
      });
    }

    // Buscar usuario por identificación
    const usuario = db
      .prepare(
        `SELECT 
          id_usuario,
          identificacion_usuario,
          nombre_usuario,
          apellido_usuario,
          email_usuario,
          contrasena_usuario,
          estado_usuario,
          usuario_rol
        FROM usuario 
        WHERE identificacion_usuario = ?`
      )
      .get(identificacion) as UsuarioDb | undefined;

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Identificación o contraseña incorrectos',
      });
    }

    // Verificar si el usuario está activo (estado_usuario debe ser 1)
    if (usuario.estado_usuario !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo. Contacte al administrador',
      });
    }

    // Verificar contraseña (comparación directa)
    if (usuario.contrasena_usuario !== contrasena) {
      return res.status(401).json({
        success: false,
        error: 'Identificación o contraseña incorrectos',
      });
    }

    // Login exitoso - remover contraseña de la respuesta
    const { contrasena_usuario, ...usuarioData } = usuario;

    return res.status(200).json({
      success: true,
      data: usuarioData,
      message: 'Login exitoso',
    });
  } catch (error: any) {
    console.error('Error in login API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
}
