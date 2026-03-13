import type { NextApiRequest, NextApiResponse } from 'next';
import { encabezadoSolicitudEquipoModel } from '../../../models';
import db from '../../../lib/database';
import { EstadoSolicitudEquipo } from '../../../types/solicitudEquipo';
import { EstadoEquipo } from '../../../types/estadoEquipo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const solicitudEquipoId = Number(id);

    console.log('API [id].ts - Método:', req.method, 'ID:', solicitudEquipoId);

    if (isNaN(solicitudEquipoId)) {
      return res.status(400).json({ success: false, error: 'ID de solicitud de equipo inválido' });
    }

    if (req.method === 'GET') {
      const solicitudEquipo = encabezadoSolicitudEquipoModel.getById(solicitudEquipoId);

      if (!solicitudEquipo) {
        return res.status(404).json({ success: false, error: 'Solicitud de equipo no encontrada' });
      }

      return res.status(200).json({ success: true, data: solicitudEquipo });
    }

    if (req.method === 'PUT') {
      // Primero obtener la SE actual
      const seActual = encabezadoSolicitudEquipoModel.getById(solicitudEquipoId);
      
      if (!seActual) {
        return res.status(404).json({ success: false, error: 'Solicitud de equipo no encontrada' });
      }

      const solicitudEquipoData = {
        ...seActual,
        ...req.body,
        pago_envio: req.body.pago_envio !== undefined ? (req.body.pago_envio ? 1 : 0) : seActual.pago_envio,
        usa_factura: req.body.usa_factura !== undefined ? (req.body.usa_factura ? 1 : 0) : seActual.usa_factura,
        estado_solicitud_equipo: req.body.estado_solicitud_equipo !== undefined ? Number(req.body.estado_solicitud_equipo) : seActual.estado_solicitud_equipo
      };

      console.log('Estado recibido en API:', solicitudEquipoData.estado_solicitud_equipo, 'Tipo:', typeof solicitudEquipoData.estado_solicitud_equipo);
      console.log('FINALIZADO enum value:', EstadoSolicitudEquipo.FINALIZADO);
      console.log('Comparación ===:', solicitudEquipoData.estado_solicitud_equipo === EstadoSolicitudEquipo.FINALIZADO);
      console.log('Comparación ==:', solicitudEquipoData.estado_solicitud_equipo == EstadoSolicitudEquipo.FINALIZADO);

      // Si se está anulando la SE, liberar el inventario reservado
      if (solicitudEquipoData.estado_solicitud_equipo === EstadoSolicitudEquipo.ANULADO) {
        const transaction = db.transaction(() => {
          // 0. Obtener el numero_solicitud_equipo
          const solicitud = db.prepare(`
            SELECT numero_solicitud_equipo FROM encabezado_solicitud_equipo WHERE id_solicitud_equipo = ?
          `).get(solicitudEquipoId) as any;

          if (!solicitud) {
            throw new Error('Solicitud no encontrada');
          }

          // 1. Obtener los equipos reservados de esta SE desde el detalle
          const equiposReservados = db.prepare(`
            SELECT id_equipo, cantidad_equipo
            FROM detalle_solicitud_equipo
            WHERE numero_solicitud_equipo = ?
          `).all(solicitud.numero_solicitud_equipo) as any[];

          // 2. Para cada equipo, cambiar el estado de RESERVADO a DISPONIBLE
          for (const item of equiposReservados) {
            const equipo = db.prepare(`
              SELECT id_equipo, cantidad_equipo, id_estado_equipo, nombre_equipo
              FROM equipo
              WHERE id_equipo = ?
            `).get(item.id_equipo) as any;

            if (!equipo) {
              console.warn(`Equipo ${item.id_equipo} no encontrado`);
              continue;
            }

            // Solo liberar si está en estado RESERVADO
            if (equipo.id_estado_equipo === EstadoEquipo.RESERVADO) {
              console.log(`Liberando equipo ${equipo.nombre_equipo} (ID: ${equipo.id_equipo}) - Cantidad: ${equipo.cantidad_equipo}`);
              
              db.prepare(`
                UPDATE equipo
                SET id_estado_equipo = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id_equipo = ?
              `).run(EstadoEquipo.DISPONIBLE, equipo.id_equipo);
            }
          }

          // 3. Actualizar el estado de la SE
          encabezadoSolicitudEquipoModel.update(solicitudEquipoId, solicitudEquipoData);
        });

        transaction();
      } else if (solicitudEquipoData.estado_solicitud_equipo === EstadoSolicitudEquipo.FINALIZADO) {
        // Si se está finalizando la SE, actualizar también el contrato asociado
        console.log('Entrando en lógica de FINALIZADO para SE:', solicitudEquipoId);
        
        const transaction = db.transaction(() => {
          // 1. Actualizar el estado de la SE
          encabezadoSolicitudEquipoModel.update(solicitudEquipoId, solicitudEquipoData);

          // 2. Buscar el contrato asociado primero
          const contratoExistente = db.prepare(`
            SELECT id_contrato, estado, id_solicitud_equipo
            FROM contrato
            WHERE id_solicitud_equipo = ?
          `).get(solicitudEquipoId) as any;

          console.log('Contrato encontrado:', contratoExistente);

          // 3. Actualizar el contrato que tenga el mismo id_solicitud_equipo y estado = 1 (generado)
          const updateContrato = db.prepare(`
            UPDATE contrato
            SET estado = 2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_solicitud_equipo = ?
              AND estado = 1
          `);

          const result = updateContrato.run(solicitudEquipoId);
          
          console.log('Resultado del UPDATE:', result);
          
          if (result.changes > 0) {
            console.log(`Contrato actualizado a estado 2 (Finalizado) para SE ${solicitudEquipoId}`);
          } else {
            console.log(`No se actualizó ningún contrato. SE: ${solicitudEquipoId}`);
          }
        });

        transaction();
      } else {
        // Si no es anulación ni finalización, solo actualizar normalmente
        encabezadoSolicitudEquipoModel.update(solicitudEquipoId, solicitudEquipoData);
      }

      const updatedSolicitudEquipo = encabezadoSolicitudEquipoModel.getById(solicitudEquipoId);
      return res.status(200).json({ success: true, data: updatedSolicitudEquipo });
    }

    if (req.method === 'DELETE') {
      encabezadoSolicitudEquipoModel.delete(solicitudEquipoId);
      return res.status(200).json({ success: true, message: 'Solicitud de equipo eliminada' });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API de solicitud de equipo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
