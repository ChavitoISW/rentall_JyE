import type { NextApiRequest, NextApiResponse } from 'next';
import { solicitudVacacionesModel, empleadoModel } from '../../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const empleadoId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      // Obtener empleado
      const empleado = empleadoModel.getById(empleadoId) as any;
      if (!empleado) {
        return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
      }

      // Calcular días acumulados
      const inicio = new Date(empleado.fecha_ingreso);
      const fin = empleado.fecha_salida ? new Date(empleado.fecha_salida) : new Date();
      
      let years = fin.getFullYear() - inicio.getFullYear();
      let months = fin.getMonth() - inicio.getMonth();
      let days = fin.getDate() - inicio.getDate();
      
      if (days < 0) {
        months--;
      }
      
      if (months < 0) {
        years--;
        months += 12;
      }
      
      const totalMeses = (years * 12) + months;
      const diasAcumulados = totalMeses; // 1 día por mes

      // Obtener días usados
      const diasUsados = solicitudVacacionesModel.getDiasUsados(empleadoId);

      // Calcular disponibles
      const diasDisponibles = diasAcumulados - diasUsados;

      res.status(200).json({ 
        success: true, 
        data: {
          dias_acumulados: diasAcumulados,
          dias_usados: diasUsados,
          dias_disponibles: diasDisponibles
        }
      });
    } catch (error: any) {
      console.error('Error al calcular días disponibles:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al calcular días disponibles: ' + (error.message || error.toString())
      });
    }
  } else {
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}
