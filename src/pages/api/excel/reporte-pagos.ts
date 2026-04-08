import type { NextApiRequest, NextApiResponse } from 'next';

interface PagoExcel {
  fecha_pago: string;
  nombre_cliente: string;
  numero_contrato: string;
  tipo_pago: string;
  monto: number;
  numero_comprobante?: string;
  banco?: string;
  numero_transferencia?: string;
  observaciones?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { todos, totales } = req.body;

    if (!todos || !totales) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos del reporte incompletos' 
      });
    }

    // Crear CSV
    const headers = ['Fecha', 'Cliente', 'Contrato', 'Tipo de Pago', 'Monto', 'Detalles', 'Observaciones'];
    let csv = headers.join(',') + '\n';

    todos.forEach((pago: PagoExcel) => {
      let detalles = '';
      if (pago.tipo_pago === 'simpe' && pago.numero_comprobante) {
        detalles = `Comprobante: ${pago.numero_comprobante}`;
      } else if (pago.tipo_pago === 'transferencia') {
        if (pago.banco) detalles += `Banco: ${pago.banco}`;
        if (pago.numero_transferencia) detalles += (detalles ? ' - ' : '') + `Nº: ${pago.numero_transferencia}`;
      }

      const row = [
        new Date(pago.fecha_pago).toLocaleDateString('es-CR'),
        `"${pago.nombre_cliente || 'N/A'}"`,
        pago.numero_contrato || 'N/A',
        pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1),
        pago.monto,
        `"${detalles}"`,
        `"${pago.observaciones || ''}"`
      ];

      csv += row.join(',') + '\n';
    });

    // Agregar línea de totales
    csv += '\n';
    csv += `Total General,,,,,${totales.total},\n`;
    csv += `Efectivo,,,,,${totales.efectivo},\n`;
    csv += `SIMPE,,,,,${totales.simpe},\n`;
    csv += `Transferencia,,,,,${totales.transferencia},\n`;

    // Agregar BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csv;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-pagos.csv"`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error al generar CSV del reporte de pagos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al generar el archivo Excel' 
    });
  }
}
