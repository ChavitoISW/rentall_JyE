import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Método ${method} no permitido` });
    }
  } catch (error: any) {
    console.error('Error en API hoja-ruta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id_hoja_ruta, estado, fecha_creacion, con_detalles } = req.query;

  let query = 'SELECT * FROM hoja_ruta';
  const conditions: string[] = [];
  const values: any[] = [];

  if (id_hoja_ruta) {
    conditions.push(`id_hoja_ruta = ?`);
    values.push(id_hoja_ruta);
  }

  if (estado !== undefined) {
    conditions.push(`estado_hoja_ruta = ?`);
    values.push(estado);
  }

  if (fecha_creacion) {
    conditions.push(`fecha_creacion = ?`);
    values.push(fecha_creacion);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fecha_creacion DESC, numero_hoja_ruta DESC';

  const result = db.prepare(query).all(...values);
  
  // Mapear campos de base de datos a nombres de interfaz
  const resultadoMapeado = result.map((hoja: any) => ({
    ...hoja,
    estado: hoja.estado_hoja_ruta ?? hoja.estado
  }));
  
  // Si se solicitan los detalles, cargarlos
  if (con_detalles === 'true' && resultadoMapeado.length > 0) {
    for (const hoja of resultadoMapeado) {
      const hojaConDetalles = hoja as any;
      const detalles = db.prepare(
        `SELECT * FROM detalle_hoja_ruta 
         WHERE id_hoja_ruta = ? 
         ORDER BY orden_parada ASC`
      ).all(hojaConDetalles.id_hoja_ruta);
      
      // Enriquecer cada detalle con información de equipos
      for (const detalle of detalles as any[]) {
        let equiposInfo = '';
        
        if (detalle.tipo_operacion === 0) { // ENTREGA
          // Obtener equipos del contrato usando id_solicitud_equipo
          const equipos = db.prepare(
            `SELECT e.nombre_equipo, dse.cantidad_equipo
             FROM detalle_solicitud_equipo dse
             INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
             INNER JOIN encabezado_solicitud_equipo se ON dse.numero_solicitud_equipo = se.numero_solicitud_equipo
             WHERE se.id_solicitud_equipo = ?`
          ).all(detalle.id_referencia);
          
          if (equipos.length > 0) {
            equiposInfo = equipos.map((e: any) => `${e.nombre_equipo} (${e.cantidad_equipo})`).join(', ');
          }
        } else if (detalle.tipo_operacion === 1) { // RECOLECCION
          // Obtener equipo de la orden de recolección
          const orden = db.prepare(
            `SELECT nombre_equipo, cantidad
             FROM orden_recoleccion
             WHERE id_orden_recoleccion = ?`
          ).get(detalle.id_referencia) as any;
          
          if (orden) {
            equiposInfo = `${orden.nombre_equipo} (${orden.cantidad || 1})`;
          }
        } else if (detalle.tipo_operacion === 2) { // CAMBIO
          // Obtener equipos del cambio
          const cambio = db.prepare(
            `SELECT e1.nombre_equipo as actual, e2.nombre_equipo as nuevo
             FROM orden_cambio_equipo oce
             LEFT JOIN equipo e1 ON oce.id_equipo_actual = e1.id_equipo
             LEFT JOIN equipo e2 ON oce.id_equipo_nuevo = e2.id_equipo
             WHERE oce.id_orden_cambio = ?`
          ).get(detalle.id_referencia) as any;
          
          if (cambio) {
            equiposInfo = `${cambio.actual} → ${cambio.nuevo}`;
          }
        }
        
        detalle.equipos_info = equiposInfo;
        // Mapear estado_detalle a estado para compatibilidad
        detalle.estado = detalle.estado_detalle ?? detalle.estado;
        // Mapear orden_parada a orden_visita para compatibilidad
        detalle.orden_visita = detalle.orden_parada ?? detalle.orden_visita;
      }
      
      hojaConDetalles.detalles = detalles;
      hojaConDetalles.total_paradas = detalles.length;
      // Mapear estado_hoja_ruta a estado para compatibilidad
      hojaConDetalles.estado = hojaConDetalles.estado_hoja_ruta ?? hojaConDetalles.estado;
    }
  }

  return res.status(200).json({ success: true, data: resultadoMapeado });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    fecha_creacion,
    conductor,
    vehiculo,
    estado,
    observaciones,
    detalles
  } = req.body;

  try {
    // Generar número de hoja de ruta automáticamente
    const ultimaHoja = db.prepare(
      `SELECT numero_hoja_ruta FROM hoja_ruta ORDER BY numero_hoja_ruta DESC LIMIT 1`
    ).get() as any;
    
    let nuevoNumero = '00001';
    if (ultimaHoja) {
      const ultimoNumero = parseInt(ultimaHoja.numero_hoja_ruta) || 0;
      nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
    }

    // Usar transacción con función
    const insertHoja = db.prepare(
      `INSERT INTO hoja_ruta (
        numero_hoja_ruta, fecha_creacion, conductor, vehiculo, estado_hoja_ruta, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const insertDetalle = db.prepare(
      `INSERT INTO detalle_hoja_ruta (
        id_hoja_ruta, tipo_operacion, id_referencia, numero_referencia,
        orden_parada, direccion, provincia, canton, distrito, otras_senas,
        nombre_cliente, telefono_cliente, estado_detalle, hora_estimada, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const updateRecoleccion = db.prepare(
      `UPDATE orden_recoleccion SET estado = 1 WHERE id_orden_recoleccion = ?`
    );

    const updateCambio = db.prepare(
      `UPDATE orden_cambio_equipo SET estado = 1 WHERE id_orden_cambio = ?`
    );

    const transaction = db.transaction(() => {
      // Insertar hoja de ruta
      const resultHoja = insertHoja.run(
        nuevoNumero, fecha_creacion, conductor, vehiculo, estado || 0, observaciones
      );

      const id_hoja_ruta = resultHoja.lastInsertRowid;

      // Insertar detalles si existen
      if (detalles && Array.isArray(detalles) && detalles.length > 0) {
        for (let i = 0; i < detalles.length; i++) {
          const detalle = detalles[i];
          insertDetalle.run(
            id_hoja_ruta,
            detalle.tipo_operacion,
            detalle.id_referencia,
            detalle.numero_referencia,
            i + 1, // orden_parada
            detalle.direccion,
            detalle.provincia,
            detalle.canton,
            detalle.distrito,
            detalle.otras_senas,
            detalle.nombre_cliente,
            detalle.telefono_cliente,
            detalle.estado || 0,
            detalle.hora_estimada,
            detalle.notas
          );

          // Actualizar estado de la orden/SE referenciada a "En Ruta"
          if (detalle.tipo_operacion === 0) { // Entrega
            // Actualizar estado de la SE a EN_RUTA_ENTREGA (3)
            db.prepare(
              `UPDATE encabezado_solicitud_equipo SET estado_solicitud_equipo = 3, updated_at = CURRENT_TIMESTAMP
               WHERE id_solicitud_equipo = ?`
            ).run(detalle.id_referencia);
          } else if (detalle.tipo_operacion === 1) { // Recolección
            updateRecoleccion.run(detalle.id_referencia);
          } else if (detalle.tipo_operacion === 2) { // Cambio
            updateCambio.run(detalle.id_referencia);
          }
        }
      }

      return id_hoja_ruta;
    });

    const id_hoja_ruta = transaction();

    // Cargar la hoja completa con detalles
    const hojaCompleta = db.prepare('SELECT * FROM hoja_ruta WHERE id_hoja_ruta = ?').get(id_hoja_ruta) as any;
    const detallesResultado = db.prepare('SELECT * FROM detalle_hoja_ruta WHERE id_hoja_ruta = ? ORDER BY orden_parada').all(id_hoja_ruta);

    hojaCompleta.detalles = detallesResultado;
    hojaCompleta.total_paradas = detallesResultado.length;

    return res.status(201).json({ success: true, data: hojaCompleta });
    
  } catch (error) {
    throw error;
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id_hoja_ruta } = req.query;
  const {
    fecha_creacion,
    conductor,
    vehiculo,
    estado,
    observaciones
  } = req.body;

  if (!id_hoja_ruta) {
    return res.status(400).json({ success: false, error: 'ID de hoja de ruta requerido' });
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (fecha_creacion !== undefined) {
    updates.push('fecha_creacion = ?');
    values.push(fecha_creacion);
  }
  if (conductor !== undefined) {
    updates.push('conductor = ?');
    values.push(conductor);
  }
  if (vehiculo !== undefined) {
    updates.push('vehiculo = ?');
    values.push(vehiculo);
  }
  if (estado !== undefined) {
    updates.push('estado_hoja_ruta = ?');
    values.push(estado);
  }
  if (observaciones !== undefined) {
    updates.push('observaciones = ?');
    values.push(observaciones);
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
  }

  values.push(id_hoja_ruta);

  const transaction = db.transaction(() => {
    // Actualizar la hoja de ruta
    const update = db.prepare(
      `UPDATE hoja_ruta SET ${updates.join(', ')} WHERE id_hoja_ruta = ?`
    );
    
    update.run(...values);

    // Si se está activando la hoja (estado = 1), actualizar estados de SE y órdenes
    if (estado === 1) {
      // Actualizar entregas (SE) a estado EN_RUTA_ENTREGA (3)
      const updateEntregas = db.prepare(
        `UPDATE encabezado_solicitud_equipo
         SET estado_solicitud_equipo = 3
         WHERE id_solicitud_equipo IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 0
         )`
      );
      updateEntregas.run(id_hoja_ruta);

      // Actualizar órdenes de recolección a estado EN_RUTA (1)
      const updateRecolecciones = db.prepare(
        `UPDATE orden_recoleccion
         SET estado = 1
         WHERE id_orden_recoleccion IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 1
         )`
      );
      updateRecolecciones.run(id_hoja_ruta);

      // Actualizar SE asociadas a recolecciones a estado EN_RUTA_RECOLECCION (5)
      const updateSERecolecciones = db.prepare(
        `UPDATE encabezado_solicitud_equipo
         SET estado_solicitud_equipo = 5
         WHERE id_solicitud_equipo IN (
           SELECT id_solicitud_equipo FROM orden_recoleccion
           WHERE id_orden_recoleccion IN (
             SELECT id_referencia FROM detalle_hoja_ruta 
             WHERE id_hoja_ruta = ? AND tipo_operacion = 1
           )
         )`
      );
      updateSERecolecciones.run(id_hoja_ruta);

      // Actualizar equipos asociados a recolecciones a estado EN_RECOLECCION (4)
      const equiposRecoleccionActivar = db.prepare(
        `SELECT DISTINCT e.id_equipo_especifico
         FROM orden_recoleccion ore
         INNER JOIN detalle_solicitud_equipo dse ON ore.id_detalle_solicitud_equipo = dse.id_detalle_solicitud_equipo
         INNER JOIN equipo e ON dse.id_equipo = e.id_equipo
         WHERE ore.id_orden_recoleccion IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 1
         )
         AND e.id_equipo_especifico IS NOT NULL`
      ).all(id_hoja_ruta);

      // Ya no necesitamos actualizar estado - el sistema de columnas maneja esto automáticamente
      // Los equipos ya están en cantidad_alquilado desde que se generó el contrato

      // Actualizar órdenes de cambio a estado EN_RUTA (1)
      const updateCambios = db.prepare(
        `UPDATE orden_cambio_equipo
         SET estado = 1
         WHERE id_orden_cambio IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 2
         )`
      );
      updateCambios.run(id_hoja_ruta);

      // NO se actualiza el estado de la SE cuando hay un cambio
      // La SE debe permanecer en su estado actual (generalmente DONDE_CLIENTE/Contrato Activo)
      // porque el cambio de equipo no significa fin de contrato

      // Actualizar equipos actuales en cambios a estado EN_RECOLECCION (4)
      const equiposCambioActivar = db.prepare(
        `SELECT DISTINCT e.id_equipo_especifico
         FROM orden_cambio_equipo oce
         INNER JOIN equipo e ON oce.id_equipo_actual = e.id_equipo
         WHERE oce.id_orden_cambio IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 2
         )
         AND e.id_equipo_especifico IS NOT NULL`
      ).all(id_hoja_ruta);

      // Ya no necesitamos actualizar estado - el sistema de columnas maneja esto automáticamente
      // Los equipos ya están en cantidad_alquilado desde que se generó el contrato
    }

    // Si se está completando la hoja (estado = 2), actualizar estados finales
    if (estado === 2) {
      // Actualizar entregas (SE) a estado CONTRATO_ACTIVO (4)
      const updateEntregasCompletas = db.prepare(
        `UPDATE encabezado_solicitud_equipo
         SET estado_solicitud_equipo = 4
         WHERE id_solicitud_equipo IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 0
         )`
      );
      updateEntregasCompletas.run(id_hoja_ruta);

      // Para recolecciones: NO es necesario mover inventario aquí
      // El movimiento de inventario ya se hace en handleCompletarParada cuando se marca cada parada como COMPLETADA
      // Esto evita la duplicación de movimientos de inventario

      // Actualizar órdenes de recolección a estado COMPLETADA (2) solo si el detalle está completado
      const updateRecoleccionesCompletas = db.prepare(
        `UPDATE orden_recoleccion
         SET estado = 2
         WHERE id_orden_recoleccion IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 1 AND estado_detalle = 1
         )`
      );
      updateRecoleccionesCompletas.run(id_hoja_ruta);

      // Actualizar SE a FINALIZADO solo si TODAS sus órdenes de recolección están completadas
      // Primero, obtener las SE afectadas por esta hoja
      const seAfectadas = db.prepare(
        `SELECT DISTINCT id_solicitud_equipo FROM orden_recoleccion
         WHERE id_orden_recoleccion IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 1
         )`
      ).all(id_hoja_ruta);

      // Para cada SE afectada, verificar si todas sus órdenes están completadas
      for (const se of seAfectadas as any[]) {
        const ordenesIncompletas = db.prepare(
          `SELECT COUNT(*) as count FROM orden_recoleccion
           WHERE id_solicitud_equipo = ? AND estado != 2`
        ).get(se.id_solicitud_equipo) as any;

        // Solo actualizar a FINALIZADO si no hay órdenes incompletas
        if (ordenesIncompletas.count === 0) {
          const updateSE = db.prepare(
            `UPDATE encabezado_solicitud_equipo
             SET estado_solicitud_equipo = 6
             WHERE id_solicitud_equipo = ?`
          );
          updateSE.run(se.id_solicitud_equipo);
        }
      }

      // Actualizar órdenes de cambio a estado COMPLETADA (2)
      // NOTA: NO se actualiza inventario aquí porque ya se hizo cuando se completó cada parada individual
      // Esto evita la duplicación de movimientos de inventario
      const updateCambiosCompletos = db.prepare(
        `UPDATE orden_cambio_equipo
         SET estado = 2
         WHERE id_orden_cambio IN (
           SELECT id_referencia FROM detalle_hoja_ruta 
           WHERE id_hoja_ruta = ? AND tipo_operacion = 2 AND estado_detalle = 1
         )`
      );
      updateCambiosCompletos.run(id_hoja_ruta);

      // NOTA: NO se finaliza el contrato/SE al completar órdenes de cambio
      // El contrato debe seguir ACTIVO porque solo se cambió un equipo, pero el contrato sigue vigente
      // La SE solo debe finalizarse cuando se complete una orden de RECOLECCIÓN, no de CAMBIO
    }

    return db.prepare('SELECT * FROM hoja_ruta WHERE id_hoja_ruta = ?').get(id_hoja_ruta);
  });

  const hojaActualizada = transaction();

  if (!hojaActualizada) {
    return res.status(404).json({ success: false, error: 'Hoja de ruta no encontrada' });
  }

  return res.status(200).json({ success: true, data: hojaActualizada });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id_hoja_ruta } = req.query;

  if (!id_hoja_ruta) {
    return res.status(400).json({ success: false, error: 'ID de hoja de ruta requerido' });
  }

  try {
    const updateRecoleccion = db.prepare(
      `UPDATE orden_recoleccion 
       SET estado = 0 
       WHERE id_orden_recoleccion IN (
         SELECT id_referencia FROM detalle_hoja_ruta 
         WHERE id_hoja_ruta = ? AND tipo_operacion = 1
       )`
    );

    const updateCambio = db.prepare(
      `UPDATE orden_cambio_equipo 
       SET estado = 0 
       WHERE id_orden_cambio IN (
         SELECT id_referencia FROM detalle_hoja_ruta 
         WHERE id_hoja_ruta = ? AND tipo_operacion = 2
       )`
    );

    const deleteDetalles = db.prepare('DELETE FROM detalle_hoja_ruta WHERE id_hoja_ruta = ?');
    const deleteHoja = db.prepare('DELETE FROM hoja_ruta WHERE id_hoja_ruta = ?');
    const selectHoja = db.prepare('SELECT * FROM hoja_ruta WHERE id_hoja_ruta = ?');

    const transaction = db.transaction((id: any) => {
      const hojaAEliminar = selectHoja.get(id);
      
      if (!hojaAEliminar) {
        throw new Error('Hoja de ruta no encontrada');
      }

      // Liberar las órdenes asociadas (volver a estado Pendiente)
      updateRecoleccion.run(id);
      updateCambio.run(id);

      // Eliminar detalles primero (por foreign key constraint)
      deleteDetalles.run(id);

      // Eliminar hoja de ruta
      deleteHoja.run(id);

      return hojaAEliminar;
    });

    const hojaEliminada = transaction(id_hoja_ruta);

    return res.status(200).json({ success: true, data: hojaEliminada });
    
  } catch (error: any) {
    if (error.message === 'Hoja de ruta no encontrada') {
      return res.status(404).json({ success: false, error: error.message });
    }
    throw error;
  }
}
