import type { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';

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
      return res.status(400).json({ success: false, message: 'Datos del reporte incompletos' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte de Pagos');

    // Encabezados
    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Contrato', key: 'contrato', width: 14 },
      { header: 'Tipo de Pago', key: 'tipo', width: 16 },
      { header: 'Monto', key: 'monto', width: 16 },
      { header: 'Detalles', key: 'detalles', width: 35 },
      { header: 'Observaciones', key: 'obs', width: 35 },
    ];

    // Estilo encabezados
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Filas de datos
    todos.forEach((pago: PagoExcel) => {
      let detalles = '';
      if (pago.tipo_pago === 'simpe' && pago.numero_comprobante) {
        detalles = `Comprobante: ${pago.numero_comprobante}`;
      } else if (pago.tipo_pago === 'transferencia') {
        if (pago.banco) detalles += `Banco: ${pago.banco}`;
        if (pago.numero_transferencia) detalles += (detalles ? ' - ' : '') + `Nº: ${pago.numero_transferencia}`;
      }

      sheet.addRow({
        fecha: new Date(pago.fecha_pago).toLocaleDateString('es-CR'),
        cliente: pago.nombre_cliente || 'N/A',
        contrato: pago.numero_contrato || 'N/A',
        tipo: pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1),
        monto: pago.monto,
        detalles,
        obs: pago.observaciones || '',
      });
    });

    // Formato moneda en columna monto
    sheet.getColumn('monto').numFmt = '₡#,##0.00';

    // Fila vacía + totales
    sheet.addRow({});
    const addTotal = (label: string, valor: number) => {
      const row = sheet.addRow({ fecha: label, monto: valor });
      row.getCell('fecha').font = { bold: true };
      row.getCell('monto').font = { bold: true };
      row.getCell('monto').numFmt = '₡#,##0.00';
    };
    addTotal('Total General', totales.total);
    addTotal('Efectivo', totales.efectivo);
    addTotal('SIMPE', totales.simpe);
    addTotal('Transferencia', totales.transferencia);

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-pagos.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar Excel del reporte de pagos:', error);
    return res.status(500).json({ success: false, message: 'Error al generar el archivo Excel' });
  }
}
