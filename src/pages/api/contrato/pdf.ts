import { NextApiRequest, NextApiResponse } from 'next';
import { contratoModel, encabezadoSolicitudEquipoModel, detalleSolicitudEquipoModel, clienteModel, equipoModel } from '../../../models';
import { generarPDFContrato } from '../../../lib/pdfGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_solicitud_equipo } = req.query;

    if (!id_solicitud_equipo || Array.isArray(id_solicitud_equipo)) {
      return res.status(400).json({ error: 'ID de solicitud de equipo inválido' });
    }

    const idSolicitud = parseInt(id_solicitud_equipo);
    if (isNaN(idSolicitud)) {
      return res.status(400).json({ error: 'ID de solicitud de equipo debe ser un número' });
    }

    // Obtener datos del contrato por id_solicitud_equipo
    const contratos = contratoModel.getAll();
    const contrato: any = contratos.find((c: any) => c.id_solicitud_equipo === idSolicitud);

    if (!contrato) {
      return res.status(404).json({ error: 'Contrato no encontrado para esta solicitud' });
    }

    // Obtener encabezado de solicitud
    const encabezado: any = encabezadoSolicitudEquipoModel.getById(contrato.id_solicitud_equipo);
    
    if (!encabezado) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Obtener información del cliente
    let clienteInfo: any = null;
    if (encabezado.id_cliente) {
      clienteInfo = clienteModel.getById(encabezado.id_cliente);
    }

    // Obtener detalles de la solicitud con información de equipos
    const detalles = detalleSolicitudEquipoModel.getDetallesByNumeroSolicitud(
      encabezado.numero_solicitud_equipo
    );

    // Construir dirección completa del cliente
    let direccionCliente = '';
    if (clienteInfo) {
      const partesDireccion = [
        clienteInfo.provincia,
        clienteInfo.canton,
        clienteInfo.distrito,
        clienteInfo.otras_senas
      ].filter(Boolean);
      direccionCliente = partesDireccion.join(', ');
    }

    // Construir dirección de entrega de la solicitud
    let direccionEntrega = '';
    if (encabezado) {
      const partesEntrega = [
        encabezado.provincia_solicitud_equipo,
        encabezado.canton_solicitud_equipo,
        encabezado.distrito_solicitud_equipo,
        encabezado.otras_senas_solicitud_equipo
      ].filter(Boolean);
      direccionEntrega = partesEntrega.join(', ');
    }

    // Usar precio_total_equipos como valor estimado
    const valorEstimado = encabezado.precio_total_equipos || 0;

    // Preparar datos para el PDF
    const contratoData = {
      id_contrato: contrato.id_contrato,
      numero_solicitud_equipo: contrato.numero_solicitud_equipo || encabezado.numero_solicitud_equipo,
      nombre_cliente: clienteInfo 
        ? `${clienteInfo.nombre_cliente} ${clienteInfo.apellidos_cliente || ''}`.trim() 
        : (contrato.nombre_cliente || 'Sin cliente'),
      direccion_cliente: direccionCliente || undefined,
      direccion_entrega: direccionEntrega || undefined,
      cedula_cliente: clienteInfo?.documento_identidad_cliente || undefined,
      telefono_cliente: clienteInfo?.telefono_cliente || undefined,
      nombre_recibe: encabezado.nombre_recibe || undefined,
      cedula_recibe: encabezado.cedula_recibe || undefined,
      telefono_recibe: encabezado.telefono_recibe || undefined,
      fecha_creacion: contrato.created_at,
      fecha_inicio_solicitud: encabezado.fecha_inicio,
      fecha_fin_solicitud: encabezado.fecha_vencimiento,
      observaciones: encabezado.observaciones_solicitud_equipo,
      subtotal: encabezado.subtotal_solicitud_equipo,
      descuento: encabezado.descuento_solicitud_equipo,
      monto_envio: encabezado.monto_envio,
      iva: encabezado.iva_solicitud_equipo,
      total: encabezado.total_solicitud_equipo,
      valor_estimado_equipo: valorEstimado,
      detalles: detalles.map((d: any) => {
        // Obtener información adicional del equipo si existe
        let equipoInfo: any = null;
        if (d.id_equipo) {
          equipoInfo = equipoModel.getById(d.id_equipo);
        }

        // Calcular precio unitario aproximado
        const precioUnitario = d.cantidad_equipo > 0 
          ? (d.monto_final || 0) / d.cantidad_equipo 
          : 0;

        return {
          codigo_equipo: d.id_equipo?.toString() || '',
          nombre_equipo: d.nombre_equipo || equipoInfo?.nombre_equipo || `Equipo ID: ${d.id_equipo}`,
          cantidad: d.cantidad_equipo || 0,
          precio_unitario: precioUnitario,
          subtotal_detalle: d.subtotal_detalle || 0,
          monto_descuento: d.monto_descuento || 0,
          iva_detalle: d.iva_detalle || 0,
          monto_final: d.monto_final || 0
        };
      })
    };

    // Generar PDF
    const pdfBuffer = await generarPDFContrato(contratoData);

    // Configurar headers para visualización
    res.setHeader('Content-Type', 'application/pdf');
    // Formatear el ID del contrato con ceros a la izquierda (3 dígitos)
    const idContratoFormateado = contrato.id_contrato.toString().padStart(3, '0');
    
    res.setHeader(
      'Content-Disposition',
      `inline; filename=contrato_${idContratoFormateado}.pdf`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ 
      error: 'Error al generar el PDF del contrato',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
