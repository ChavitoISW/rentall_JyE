import type { NextApiRequest, NextApiResponse } from 'next';
import { generarPDFReportePagos } from '../../../lib/pdfGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const reporteData = req.body;

    if (!reporteData || !reporteData.todos || !reporteData.totales) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos del reporte incompletos' 
      });
    }

    const pdfBuffer = await generarPDFReportePagos(reporteData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-pagos.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF del reporte de pagos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al generar el PDF del reporte' 
    });
  }
}
