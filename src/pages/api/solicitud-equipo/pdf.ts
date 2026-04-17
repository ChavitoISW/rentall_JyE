import { NextApiRequest, NextApiResponse } from 'next';
import { encabezadoSolicitudEquipoModel, detalleSolicitudEquipoModel, clienteModel } from '../../../models';
import { generarPDFSolicitudEquipo } from '../../../lib/pdfGenerator';
import { EstadoSolicitudEquipo, EstadoSolicitudEquipoLabels } from '../../../types/solicitudEquipo';

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

    // Obtener encabezado de solicitud
    const encabezado: any = encabezadoSolicitudEquipoModel.getById(idSolicitud);
    
    if (!encabezado) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Obtener información del cliente
    let clienteInfo: any = null;
    if (encabezado.id_cliente) {
      clienteInfo = clienteModel.getById(encabezado.id_cliente);
    }

    // Obtener detalles de la solicitud
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

    // Obtener etiqueta del estado
    const estadoLabel = EstadoSolicitudEquipoLabels[encabezado.estado_solicitud_equipo as EstadoSolicitudEquipo] || 'Desconocido';

    // Preparar datos para el PDF
    const solicitudData = {
      id_solicitud_equipo: encabezado.id_solicitud_equipo,
      numero_solicitud_equipo: encabezado.numero_solicitud_equipo,
      nombre_cliente: clienteInfo 
        ? `${clienteInfo.nombre_cliente} ${clienteInfo.apellidos_cliente || ''}`.trim() 
        : 'Sin cliente',
      direccion_cliente: direccionCliente || undefined,
      direccion_entrega: direccionEntrega || undefined,
      cedula_cliente: clienteInfo?.documento_identidad_cliente || undefined,
      telefono_cliente: clienteInfo?.telefono_cliente || undefined,
      nombre_recibe: encabezado.nombre_recibe || undefined,
      cedula_recibe: encabezado.cedula_recibe || undefined,
      telefono_recibe: encabezado.telefono_recibe || undefined,
      fecha_elaboracion: encabezado.fecha_elaboracion,
      fecha_inicio: encabezado.fecha_inicio,
      fecha_vencimiento: encabezado.fecha_vencimiento,
      observaciones: encabezado.observaciones_solicitud_equipo,
      subtotal: encabezado.subtotal_solicitud_equipo ?? 0,
      descuento: encabezado.descuento_solicitud_equipo ?? 0,
      monto_envio: encabezado.monto_envio ?? 0,
      iva: encabezado.iva_solicitud_equipo ?? 0,
      total: encabezado.total_solicitud_equipo ?? 0,
      estado_solicitud: estadoLabel,
      pago_envio: encabezado.pago_envio === 1,
      usa_factura: encabezado.usa_factura === 1,
      detalles: detalles.map((d: any) => ({
        codigo_equipo: d.codigo_equipo,
        nombre_equipo: d.nombre_equipo,
        cantidad: d.cantidad_equipo,
        precio_unitario: d.precio_unitario_equipo,
        subtotal_detalle: d.subtotal_detalle,
        monto_descuento: d.monto_descuento,
        iva_detalle: d.iva_detalle,
        monto_final: d.monto_final
      }))
    };

    // Generar PDF
    const pdfBuffer = await generarPDFSolicitudEquipo(solicitudData);

    // Configurar headers para respuesta PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="solicitud_equipo_${encabezado.numero_solicitud_equipo}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Enviar el PDF
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Error al generar PDF de solicitud de equipo:', error);
    return res.status(500).json({
      error: 'Error al generar el PDF',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
