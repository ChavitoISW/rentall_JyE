import type { NextApiRequest, NextApiResponse } from 'next';
import { backupManual } from '../../../lib/backup-scheduler';

/**
 * API para ejecutar backup manual de la base de datos
 * GET /api/backup/manual
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const resultado = backupManual();
    
    if (resultado) {
      return res.status(200).json({
        success: true,
        message: 'Backup manual ejecutado correctamente',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Error al ejecutar el backup manual'
      });
    }
  } catch (error: any) {
    console.error('Error en backup manual API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}
