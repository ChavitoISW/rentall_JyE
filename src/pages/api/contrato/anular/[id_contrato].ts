import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';
import { EstadoSolicitudEquipo } from '../../../../types/solicitudEquipo';
import { EstadoEquipo } from '../../../../types/estadoEquipo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id_contrato } = req.query;
  const { motivo_anulacion, usuario_anulacion } = req.body;

  console.log('Anular contrato - ID:', id_contrato);
  console.log('Motivo:', motivo_anulacion);

  if (!id_contrato || !motivo_anulacion) {
    return res.status(400).json({ error: 'ID de contrato y motivo son requeridos' });
  }

  try {
    // Iniciar transacción
    const transaction = db.transaction(() => {
      // 1. Obtener información del contrato
      const contrato = db.prepare(`
        SELECT c.*, se.numero_solicitud_equipo
        FROM contrato c
        LEFT JOIN encabezado_solicitud_equipo se ON c.id_solicitud_equipo = se.id_solicitud_equipo
        WHERE c.id_contrato = ?
      `).get(id_contrato) as any;

      console.log('Contrato encontrado:', contrato);

      if (!contrato) {
        throw new Error('Contrato no encontrado');
      }

      if (contrato.estado === 0) {
        throw new Error('El contrato ya está anulado');
      }

      // 2. Obtener equipos del contrato (bitácora)
      const equiposContrato = db.prepare(`
        SELECT id_equipo, cantidad_equipo
        FROM bitacora_equipo
        WHERE id_solicitud_equipo = ? AND estado_bitacora = 1
      `).all(contrato.id_solicitud_equipo) as any[];

      // 3. Reversar equipos: mover de cantidad_alquilado de vuelta a cantidad_reservado
      for (const item of equiposContrato) {
        const equipoAsignado = db.prepare(`
          SELECT id_equipo, cantidad_equipo, nombre_equipo, cantidad_alquilado, cantidad_reservado
          FROM equipo
          WHERE id_equipo = ?
        `).get(item.id_equipo) as any;

        if (!equipoAsignado) {
          console.warn(`Equipo ${item.id_equipo} no encontrado`);
          continue;
        }

        console.log('Equipo encontrado:', equipoAsignado);

        // Usar la cantidad de la bitácora (cantidad contratada), no la cantidad total del equipo
        const cantidadContratada = item.cantidad_equipo || 0;
        const cantidadAlquilado = equipoAsignado.cantidad_alquilado || 0;

        // Validar que hay cantidad alquilada para liberar
        if (cantidadAlquilado < cantidadContratada) {
          console.warn(`Equipo ${item.id_equipo} no tiene suficiente cantidad alquilada. Alquilado: ${cantidadAlquilado}, Contratado: ${cantidadContratada}`);
          // Revertir solo lo que está alquilado
          const cantidadRevertir = Math.min(cantidadAlquilado, cantidadContratada);
          if (cantidadRevertir <= 0) continue;
          
          db.prepare(`
            UPDATE equipo
            SET cantidad_alquilado = MAX(0, COALESCE(cantidad_alquilado, 0) - ?),
                cantidad_reservado = COALESCE(cantidad_reservado, 0) + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_equipo = ?
          `).run(cantidadRevertir, cantidadRevertir, equipoAsignado.id_equipo);
          
          console.log(`Inventario actualizado parcialmente para equipo ${equipoAsignado.id_equipo} - Cantidad: ${cantidadRevertir}`);
          continue;
        }

        // Mover de cantidad_alquilado a cantidad_reservado
        console.log(`Moviendo equipo ${equipoAsignado.id_equipo} de alquilado a reservado - Cantidad: ${cantidadContratada}`);
        
        db.prepare(`
          UPDATE equipo
          SET cantidad_alquilado = MAX(0, COALESCE(cantidad_alquilado, 0) - ?),
              cantidad_reservado = COALESCE(cantidad_reservado, 0) + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id_equipo = ?
        `).run(cantidadContratada, cantidadContratada, equipoAsignado.id_equipo);

        console.log(`Inventario actualizado para equipo ${equipoAsignado.id_equipo}`);
      }

      // 4. Cambiar estado de la solicitud a SOLICITUD (1)
      db.prepare(`
        UPDATE encabezado_solicitud_equipo
        SET estado_solicitud_equipo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id_solicitud_equipo = ?
      `).run(EstadoSolicitudEquipo.SOLICITUD, contrato.id_solicitud_equipo);

      console.log('Solicitud actualizada a estado SOLICITUD');

      // 5. Cambiar estado del contrato a Anulado (0)
      const updateResult = db.prepare(`
        UPDATE contrato
        SET estado = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id_contrato = ?
      `).run(id_contrato);

      console.log('Contrato actualizado - Cambios:', updateResult.changes);

      // Verificar que se actualizó
      const contratoActualizado = db.prepare(`
        SELECT estado FROM contrato WHERE id_contrato = ?
      `).get(id_contrato) as any;

      console.log('Estado del contrato después de actualizar:', contratoActualizado);

      // 6. Registrar la anulación
      db.prepare(`
        INSERT INTO anulacion_contrato (
          id_contrato,
          numero_contrato,
          id_solicitud_equipo,
          fecha_anulacion,
          motivo_anulacion,
          usuario_anulacion
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).run(
        id_contrato,
        contrato.numero_solicitud_equipo,
        contrato.id_solicitud_equipo,
        motivo_anulacion,
        usuario_anulacion || 'Sistema'
      );

      // 7. Desactivar registros de bitácora
      db.prepare(`
        UPDATE bitacora_equipo
        SET estado_bitacora = 0, observaciones = observaciones || ' - CONTRATO ANULADO'
        WHERE id_solicitud_equipo = ?
      `).run(contrato.id_solicitud_equipo);
    });

    transaction();

    res.status(200).json({ 
      message: 'Contrato anulado exitosamente',
      success: true 
    });
  } catch (error: any) {
    console.error('Error al anular contrato:', error);
    res.status(500).json({ 
      error: error.message || 'Error al anular el contrato' 
    });
  }
}
