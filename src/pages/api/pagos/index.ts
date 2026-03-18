import type { NextApiRequest, NextApiResponse } from 'next';
import { pagoContratoModel } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { fechaInicio, fechaFin } = req.query;

      let pagos;
      if (fechaInicio && fechaFin) {
        pagos = pagoContratoModel.getByDateRange(
          fechaInicio as string,
          fechaFin as string
        );
      } else {
        pagos = pagoContratoModel.getAll();
      }

      // Agrupar pagos por tipo
      const pagosPorTipo = {
        efectivo: pagos.filter((p: any) => p.tipo_pago === 'efectivo'),
        simpe: pagos.filter((p: any) => p.tipo_pago === 'simpe'),
        transferencia: pagos.filter((p: any) => p.tipo_pago === 'transferencia')
      };

      // Calcular totales
      const totales = {
        efectivo: pagosPorTipo.efectivo.reduce((sum: number, p: any) => sum + p.monto, 0),
        simpe: pagosPorTipo.simpe.reduce((sum: number, p: any) => sum + p.monto, 0),
        transferencia: pagosPorTipo.transferencia.reduce((sum: number, p: any) => sum + p.monto, 0),
        total: pagos.reduce((sum: number, p: any) => sum + p.monto, 0)
      };

      return res.status(200).json({
        success: true,
        data: {
          todos: pagos,
          porTipo: pagosPorTipo,
          totales
        }
      });
    } catch (error: any) {
      console.error('Error al obtener pagos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener pagos'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const pago = req.body;
      const id = pagoContratoModel.create(pago);
      return res.status(201).json({
        success: true,
        data: { id },
        message: 'Pago registrado exitosamente'
      });
    } catch (error: any) {
      console.error('Error al crear pago:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear pago'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Método no permitido'
  });
}
