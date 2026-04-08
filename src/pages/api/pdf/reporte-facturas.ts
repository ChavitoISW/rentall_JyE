import type { NextApiRequest, NextApiResponse } from 'next';
import { generarPDFReporteFacturas } from '../../../lib/pdfGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const reporteData = req.body;

    if (!reporteData || !reporteData.facturas || !reporteData.totales) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos del reporte incompletos' 
      });
    }

    const pdfBuffer = await generarPDFReporteFacturas(reporteData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-facturas.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF del reporte de facturas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al generar el PDF del reporte' 
    });
  }
}
