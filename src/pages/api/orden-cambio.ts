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
    console.error('Error en API orden-cambio:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Error interno del servidor' 
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_cambio, estado, numero_solicitud_equipo } = req.query;

  let query = 'SELECT * FROM orden_cambio_equipo';
  const conditions: string[] = [];
  const values: any[] = [];

  if (id_orden_cambio) {
    conditions.push(`id_orden_cambio = ?`);
    values.push(id_orden_cambio);
  }

  if (estado !== undefined) {
    conditions.push(`estado = ?`);
    values.push(estado);
  }

  if (numero_solicitud_equipo) {
    conditions.push(`numero_solicitud_equipo = ?`);
    values.push(numero_solicitud_equipo);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fecha_creacion DESC, numero_orden_cambio DESC';

  const result = db.prepare(query).all(...values);
  return res.status(200).json({ success: true, data: result });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Iniciando creación de orden de cambio ===');
  console.log('Body recibido:', JSON.stringify(req.body, null, 2));
  
  const {
    id_solicitud_equipo,
    numero_solicitud_equipo,
    id_equipo_actual,
    nombre_equipo_actual,
    id_equipo_nuevo,
    nombre_equipo_nuevo,
    motivo_cambio,
    fecha_programada,
    estado,
    observaciones,
    provincia,
    canton,
    distrito,
    otras_senas,
    nombre_cliente,
    telefono_cliente
  } = req.body;

  if (!motivo_cambio || !motivo_cambio.trim()) {
    console.log('Error: Motivo de cambio vacío');
    return res.status(400).json({ success: false, error: 'El motivo del cambio es obligatorio' });
  }

  if (!id_equipo_actual || !id_equipo_nuevo) {
    console.log('Error: Equipos no especificados', { id_equipo_actual, id_equipo_nuevo });
    return res.status(400).json({ success: false, error: 'Se requieren ambos equipos (actual y nuevo)' });
  }

  // Iniciar transacción para manejar inventario
  const transaction = db.transaction(() => {
    console.log('Paso 1: Generando número de orden...');
    // 1. Generar número de orden automáticamente
    const ultimaOrden = db.prepare(
      `SELECT numero_orden_cambio FROM orden_cambio_equipo ORDER BY numero_orden_cambio DESC LIMIT 1`
    ).get() as any;
    
    let nuevoNumero = '00001';
    if (ultimaOrden) {
      const ultimoNumero = parseInt(ultimaOrden.numero_orden_cambio) || 0;
      nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
    }
    console.log('Número de orden generado:', nuevoNumero);

    console.log('Paso 2: Actualizando inventario equipo actual...');
    // 2. Actualizar inventario al generar la orden de cambio
    // Equipo actual: alquilado → en_recoleccion
    const equipoActual = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(id_equipo_actual) as any;
    console.log('Equipo actual encontrado:', equipoActual);
    
    if (!equipoActual) {
      throw new Error(`Equipo actual con ID ${id_equipo_actual} no encontrado`);
    }
    
    const cantidadAlquilado = equipoActual.cantidad_alquilado || 0;
    const cantidadEnRecoleccion = equipoActual.cantidad_en_recoleccion || 0;
    console.log(`Cantidades actuales - Alquilado: ${cantidadAlquilado}, En recolección: ${cantidadEnRecoleccion}`);
    
    if (cantidadAlquilado <= 0) {
      throw new Error(`Equipo ${nombre_equipo_actual} no tiene unidades alquiladas para cambiar`);
    }
    
    db.prepare(
      `UPDATE equipo 
       SET cantidad_alquilado = ?, 
           cantidad_en_recoleccion = ?
       WHERE id_equipo = ?`
    ).run(cantidadAlquilado - 1, cantidadEnRecoleccion + 1, id_equipo_actual);
    console.log('Inventario equipo actual actualizado');

    console.log('Paso 3: Actualizando inventario equipo nuevo...');
    // Equipo nuevo: disponible → reservado
    const equipoNuevo = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(id_equipo_nuevo) as any;
    console.log('Equipo nuevo encontrado:', equipoNuevo);
    
    if (!equipoNuevo) {
      throw new Error(`Equipo nuevo con ID ${id_equipo_nuevo} no encontrado`);
    }
    
    const cantidadDisponible = equipoNuevo.cantidad_disponible || 0;
    const cantidadReservado = equipoNuevo.cantidad_reservado || 0;
    console.log(`Cantidades nuevo - Disponible: ${cantidadDisponible}, Reservado: ${cantidadReservado}`);
    
    if (cantidadDisponible <= 0) {
      throw new Error(`Equipo ${nombre_equipo_nuevo} no tiene unidades disponibles`);
    }
    
    db.prepare(
      `UPDATE equipo 
       SET cantidad_disponible = ?, 
           cantidad_reservado = ?
       WHERE id_equipo = ?`
    ).run(cantidadDisponible - 1, cantidadReservado + 1, id_equipo_nuevo);
    console.log('Inventario equipo nuevo actualizado');

    console.log('Paso 4: Insertando orden de cambio en la base de datos...');
    // 3. Crear la orden de cambio
    const insert = db.prepare(
      `INSERT INTO orden_cambio_equipo (
        numero_orden_cambio, id_solicitud_equipo, numero_solicitud_equipo,
        id_equipo_actual, nombre_equipo_actual, id_equipo_nuevo, nombre_equipo_nuevo,
        motivo_cambio, fecha_programada, estado, observaciones,
        provincia, canton, distrito, otras_senas, nombre_cliente, telefono_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = insert.run(
      nuevoNumero, id_solicitud_equipo, numero_solicitud_equipo,
      id_equipo_actual, nombre_equipo_actual, id_equipo_nuevo, nombre_equipo_nuevo,
      motivo_cambio, fecha_programada, estado || 0, observaciones,
      provincia, canton, distrito, otras_senas, nombre_cliente, telefono_cliente
    );
    console.log('INSERT completado, lastInsertRowid:', result.lastInsertRowid);

    console.log('Paso 5: Obteniendo orden creada...');
    // 4. Obtener la orden creada
    const ordenCreada = db.prepare('SELECT * FROM orden_cambio_equipo WHERE id_orden_cambio = ?').get(result.lastInsertRowid);
    console.log('Orden obtenida:', ordenCreada);
    
    return ordenCreada;
  });

  try {
    console.log('Ejecutando transacción...');
    const ordenCreada = transaction();
    console.log('Orden creada exitosamente:', ordenCreada);
    return res.status(201).json({ success: true, data: ordenCreada });
  } catch (error: any) {
    console.error('Error al crear orden de cambio:', error);
    console.error('Stack trace:', error.stack);
    return res.status(400).json({ 
      success: false, 
      error: error.message || error.toString() || 'Error al crear orden de cambio'
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_cambio } = req.query;
  const {
    fecha_programada,
    estado,
    observaciones,
    actualizar_inventario,
    revertir_inventario
  } = req.body;

  if (!id_orden_cambio) {
    return res.status(400).json({ success: false, error: 'ID de orden requerido' });
  }

  // Obtener la orden actual
  const orden = db.prepare('SELECT * FROM orden_cambio_equipo WHERE id_orden_cambio = ?').get(id_orden_cambio) as any;
  
  if (!orden) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  // Si se va a revertir el inventario (usado en NO_EJECUTADA)
  if (revertir_inventario === true) {
    console.log('=== Revirtiendo inventario de orden no ejecutada ===');
    console.log('Orden:', orden.numero_orden_cambio);
    
    const transaction = db.transaction(() => {
      // Equipo actual: en_recoleccion → alquilado (revertir)
      const equipoActual = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(orden.id_equipo_actual) as any;
      if (equipoActual) {
        const cantidadEnRecoleccion = equipoActual.cantidad_en_recoleccion || 0;
        const cantidadAlquilado = equipoActual.cantidad_alquilado || 0;
        console.log(`Equipo actual ${orden.nombre_equipo_actual}: en_recoleccion ${cantidadEnRecoleccion} → alquilado ${cantidadAlquilado + 1}`);
        
        if (cantidadEnRecoleccion > 0) {
          db.prepare(
            `UPDATE equipo 
             SET cantidad_en_recoleccion = ?, 
                 cantidad_alquilado = ?
             WHERE id_equipo = ?`
          ).run(cantidadEnRecoleccion - 1, cantidadAlquilado + 1, orden.id_equipo_actual);
        }
      }

      // Equipo nuevo: reservado → disponible (revertir)
      const equipoNuevo = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(orden.id_equipo_nuevo) as any;
      if (equipoNuevo) {
        const cantidadReservado = equipoNuevo.cantidad_reservado || 0;
        const cantidadDisponible = equipoNuevo.cantidad_disponible || 0;
        console.log(`Equipo nuevo ${orden.nombre_equipo_nuevo}: reservado ${cantidadReservado} → disponible ${cantidadDisponible + 1}`);
        
        if (cantidadReservado > 0) {
          db.prepare(
            `UPDATE equipo 
             SET cantidad_reservado = ?, 
                 cantidad_disponible = ?
             WHERE id_equipo = ?`
          ).run(cantidadReservado - 1, cantidadDisponible + 1, orden.id_equipo_nuevo);
        }
      }
    });

    try {
      transaction();
      console.log('Inventario revertido exitosamente');
    } catch (error: any) {
      console.error('Error al revertir inventario:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message || error.toString() || 'Error al revertir inventario' 
      });
    }
  }

  // Si se va a CANCELAR la orden, revertir los cambios de inventario
  if (estado === 3 && orden.estado !== 3) { // 3 = CANCELADA
    const transaction = db.transaction(() => {
      // Equipo actual: en_recoleccion → alquilado (revertir)
      const equipoActual = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(orden.id_equipo_actual) as any;
      if (equipoActual) {
        const cantidadEnRecoleccion = equipoActual.cantidad_en_recoleccion || 0;
        const cantidadAlquilado = equipoActual.cantidad_alquilado || 0;
        
        if (cantidadEnRecoleccion > 0) {
          db.prepare(
            `UPDATE equipo 
             SET cantidad_en_recoleccion = ?, 
                 cantidad_alquilado = ?
             WHERE id_equipo = ?`
          ).run(cantidadEnRecoleccion - 1, cantidadAlquilado + 1, orden.id_equipo_actual);
        }
      }

      // Equipo nuevo: reservado → disponible (revertir)
      const equipoNuevo = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(orden.id_equipo_nuevo) as any;
      if (equipoNuevo) {
        const cantidadReservado = equipoNuevo.cantidad_reservado || 0;
        const cantidadDisponible = equipoNuevo.cantidad_disponible || 0;
        
        if (cantidadReservado > 0) {
          db.prepare(
            `UPDATE equipo 
             SET cantidad_reservado = ?, 
                 cantidad_disponible = ?
             WHERE id_equipo = ?`
          ).run(cantidadReservado - 1, cantidadDisponible + 1, orden.id_equipo_nuevo);
        }
      }
    });

    try {
      transaction();
    } catch (error: any) {
      console.error('Error al revertir inventario:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message || error.toString() || 'Error al revertir inventario' 
      });
    }
  }

  // Si se va a completar la orden de cambio, actualizar inventario
  if (actualizar_inventario === true && estado === 2) {

    // Obtener el numero_solicitud_equipo de la SE
    const se = db.prepare('SELECT numero_solicitud_equipo FROM encabezado_solicitud_equipo WHERE id_solicitud_equipo = ?')
      .get(orden.id_solicitud_equipo) as any;

    const transaction = db.transaction(() => {
      console.log('=== Completando orden de cambio ===');
      console.log('ID Orden:', orden.id_orden_cambio);
      console.log('Equipo actual:', orden.nombre_equipo_actual, '(ID:', orden.id_equipo_actual, ')');
      console.log('Equipo nuevo:', orden.nombre_equipo_nuevo, '(ID:', orden.id_equipo_nuevo, ')');
      
      // 1. Equipo actual: en_recoleccion → en_mantenimiento
      console.log('Paso 1: Moviendo equipo actual de En Recolección a Mantenimiento...');
      const equipoActual = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(orden.id_equipo_actual) as any;
      if (equipoActual) {
        const cantidadEnRecoleccion = equipoActual.cantidad_en_recoleccion || 0;
        const cantidadEnMantenimiento = equipoActual.cantidad_en_mantenimiento || 0;
        console.log(`  Estado actual - En recolección: ${cantidadEnRecoleccion}, Mantenimiento: ${cantidadEnMantenimiento}`);
        
        if (cantidadEnRecoleccion > 0) {
          db.prepare(
            `UPDATE equipo 
             SET cantidad_en_recoleccion = ?, 
                 cantidad_en_mantenimiento = ?
             WHERE id_equipo = ?`
          ).run(cantidadEnRecoleccion - 1, cantidadEnMantenimiento + 1, orden.id_equipo_actual);
          console.log(`  Actualizado - En recolección: ${cantidadEnRecoleccion - 1}, Mantenimiento: ${cantidadEnMantenimiento + 1}`);
        } else {
          throw new Error(`Equipo ${orden.nombre_equipo_actual} no tiene unidades en recolección para completar el cambio`);
        }
      }

      // 2. Equipo nuevo: reservado → alquilado
      console.log('Paso 2: Moviendo equipo nuevo de Reservado a Alquilado...');
      const equipoNuevo = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(orden.id_equipo_nuevo) as any;
      if (equipoNuevo) {
        const cantidadReservado = equipoNuevo.cantidad_reservado || 0;
        const cantidadAlquilado = equipoNuevo.cantidad_alquilado || 0;
        console.log(`  Estado actual - Reservado: ${cantidadReservado}, Alquilado: ${cantidadAlquilado}`);
        
        if (cantidadReservado > 0) {
          db.prepare(
            `UPDATE equipo 
             SET cantidad_reservado = ?, 
                 cantidad_alquilado = ?
             WHERE id_equipo = ?`
          ).run(cantidadReservado - 1, cantidadAlquilado + 1, orden.id_equipo_nuevo);
          console.log(`  Actualizado - Reservado: ${cantidadReservado - 1}, Alquilado: ${cantidadAlquilado + 1}`);
        } else {
          throw new Error(`Equipo ${orden.nombre_equipo_nuevo} no tiene unidades reservadas`);
        }
      }

      // 3. Actualizar detalle_solicitud_equipo: cambiar el id_equipo del equipo actual al nuevo
      // Esto es crucial para que cuando se genere la recolección, se recoja el equipo correcto
      if (se) {
        console.log('Paso 3: Actualizando detalle de SE...');
        console.log(`  Cambiando equipo en detalle_solicitud_equipo de ID ${orden.id_equipo_actual} a ${orden.id_equipo_nuevo}`);
        db.prepare(
          `UPDATE detalle_solicitud_equipo
           SET id_equipo = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE numero_solicitud_equipo = ? 
             AND id_equipo = ?`
        ).run(orden.id_equipo_nuevo, se.numero_solicitud_equipo, orden.id_equipo_actual);
        console.log('  Detalle de SE actualizado');
        
        // 4. Actualizar estado de la solicitud de equipo a "Contrato Activo" (DONDE_CLIENTE = 4)
        console.log('Paso 4: Actualizando estado de SE a Contrato Activo...');
        db.prepare(
          `UPDATE encabezado_solicitud_equipo
           SET estado_solicitud_equipo = 4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id_solicitud_equipo = ?`
        ).run(orden.id_solicitud_equipo);
        console.log('Estado de SE actualizado a Contrato Activo (4)');
      }
      
      console.log('=== Orden de cambio completada exitosamente ===');
    });

    try {
      transaction();
    } catch (error: any) {
      console.error('Error al actualizar inventario:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message || error.toString() || 'Error al actualizar inventario' 
      });
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (fecha_programada !== undefined) {
    updates.push('fecha_programada = ?');
    values.push(fecha_programada);
  }
  if (estado !== undefined) {
    updates.push('estado = ?');
    values.push(estado);
  }
  if (observaciones !== undefined) {
    updates.push('observaciones = ?');
    values.push(observaciones);
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
  }

  values.push(id_orden_cambio);

  const update = db.prepare(
    `UPDATE orden_cambio_equipo SET ${updates.join(', ')} WHERE id_orden_cambio = ?`
  );
  
  const result = update.run(...values);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  const ordenActualizada = db.prepare('SELECT * FROM orden_cambio_equipo WHERE id_orden_cambio = ?').get(id_orden_cambio);

  return res.status(200).json({ success: true, data: ordenActualizada });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_cambio } = req.query;

  if (!id_orden_cambio) {
    return res.status(400).json({ success: false, error: 'ID de orden requerido' });
  }

  const ordenAEliminar = db.prepare('SELECT * FROM orden_cambio_equipo WHERE id_orden_cambio = ?').get(id_orden_cambio);

  if (!ordenAEliminar) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  const deleteStmt = db.prepare('DELETE FROM orden_cambio_equipo WHERE id_orden_cambio = ?');
  deleteStmt.run(id_orden_cambio);

  return res.status(200).json({ success: true, data: ordenAEliminar });
}
