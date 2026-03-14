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
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_recoleccion, estado, numero_solicitud_equipo, id_detalle_solicitud_equipo } = req.query;

  let query = 'SELECT * FROM orden_recoleccion';
  const conditions: string[] = [];
  const values: any[] = [];

  if (id_orden_recoleccion) {
    conditions.push(`id_orden_recoleccion = ?`);
    values.push(id_orden_recoleccion);
  }

  if (estado !== undefined) {
    conditions.push(`estado = ?`);
    values.push(estado);
  }

  if (numero_solicitud_equipo) {
    conditions.push(`numero_solicitud_equipo = ?`);
    values.push(numero_solicitud_equipo);
  }

  if (id_detalle_solicitud_equipo) {
    conditions.push(`id_detalle_solicitud_equipo = ?`);
    values.push(id_detalle_solicitud_equipo);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fecha_creacion DESC, numero_orden_recoleccion DESC';

  const result = db.prepare(query).all(...values);
  return res.status(200).json({ success: true, data: result });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    id_detalle_solicitud_equipo,
    id_solicitud_equipo,
    numero_solicitud_equipo,
    fecha_programada_recoleccion,
    nombre_equipo,
    cantidad,
    estado,
    observaciones,
    provincia,
    canton,
    distrito,
    otras_senas,
    nombre_cliente,
    telefono_cliente
  } = req.body;

  // Generar número de orden automáticamente
  const ultimaOrden = db.prepare(
    `SELECT numero_orden_recoleccion FROM orden_recoleccion ORDER BY numero_orden_recoleccion DESC LIMIT 1`
  ).get() as any;
  
  let nuevoNumero = '00001';
  if (ultimaOrden) {
    const ultimoNumero = parseInt(ultimaOrden.numero_orden_recoleccion) || 0;
    nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
  }

  // Transacción para crear la orden y actualizar inventario
  const transaction = db.transaction(() => {
    // 1. Insertar orden de recolección
    const insert = db.prepare(
      `INSERT INTO orden_recoleccion (
        numero_orden_recoleccion, id_detalle_solicitud_equipo, id_solicitud_equipo,
        numero_solicitud_equipo, fecha_programada_recoleccion, nombre_equipo, cantidad,
        estado, observaciones, provincia, canton, distrito, otras_senas,
        nombre_cliente, telefono_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = insert.run(
      nuevoNumero, id_detalle_solicitud_equipo, id_solicitud_equipo,
      numero_solicitud_equipo, fecha_programada_recoleccion, nombre_equipo, cantidad || 1,
      estado || 0, observaciones, provincia, canton, distrito, otras_senas,
      nombre_cliente, telefono_cliente
    );

    // 2. Obtener id_equipo del detalle
    if (id_detalle_solicitud_equipo) {
      const detalle = db.prepare(
        `SELECT id_equipo, cantidad_equipo FROM detalle_solicitud_equipo 
         WHERE id_detalle_solicitud_equipo = ?`
      ).get(id_detalle_solicitud_equipo) as any;

      if (detalle && detalle.id_equipo) {
        // 3. Actualizar inventario: de alquilado a en_recoleccion
        const cantidadRecolectar = cantidad || detalle.cantidad_equipo || 1;
        
        db.prepare(
          `UPDATE equipo
           SET cantidad_alquilado = MAX(0, COALESCE(cantidad_alquilado, 0) - ?),
               cantidad_en_recoleccion = COALESCE(cantidad_en_recoleccion, 0) + ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id_equipo = ?`
        ).run(cantidadRecolectar, cantidadRecolectar, detalle.id_equipo);
      }
    }

    return result.lastInsertRowid;
  });

  const ordenId = transaction();
  const ordenCreada = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(ordenId);

  return res.status(201).json({ success: true, data: ordenCreada });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_recoleccion } = req.query;
  const {
    fecha_programada_recoleccion,
    estado,
    observaciones
  } = req.body;

  if (!id_orden_recoleccion) {
    return res.status(400).json({ success: false, error: 'ID de orden requerido' });
  }

  // Obtener la orden actual antes de actualizarla
  const ordenActual = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(id_orden_recoleccion) as any;

  if (!ordenActual) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (fecha_programada_recoleccion !== undefined) {
    updates.push('fecha_programada_recoleccion = ?');
    values.push(fecha_programada_recoleccion);
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

  values.push(id_orden_recoleccion);

  // Transacción para actualizar estado y revertir inventario si se cancela
  const transaction = db.transaction(() => {
    // 1. Actualizar la orden
    const update = db.prepare(
      `UPDATE orden_recoleccion SET ${updates.join(', ')} WHERE id_orden_recoleccion = ?`
    );
    update.run(...values);

    // 2. Si se está cancelando (estado = 3), revertir inventario y estado de SE
    if (estado === 3 && ordenActual.estado !== 3) {
      if (ordenActual.id_detalle_solicitud_equipo) {
        const detalle = db.prepare(
          `SELECT id_equipo, cantidad_equipo FROM detalle_solicitud_equipo 
           WHERE id_detalle_solicitud_equipo = ?`
        ).get(ordenActual.id_detalle_solicitud_equipo) as any;

        if (detalle && detalle.id_equipo) {
          const cantidadRevertir = ordenActual.cantidad || detalle.cantidad_equipo || 1;
          
          // Revertir: en_recoleccion → alquilado
          db.prepare(
            `UPDATE equipo
             SET cantidad_en_recoleccion = MAX(0, COALESCE(cantidad_en_recoleccion, 0) - ?),
                 cantidad_alquilado = COALESCE(cantidad_alquilado, 0) + ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id_equipo = ?`
          ).run(cantidadRevertir, cantidadRevertir, detalle.id_equipo);
        }
      }

      // Revertir estado de la SE a DONDE_CLIENTE (4)
      if (ordenActual.id_solicitud_equipo) {
        db.prepare(
          `UPDATE encabezado_solicitud_equipo
           SET estado_solicitud_equipo = 4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id_solicitud_equipo = ?`
        ).run(ordenActual.id_solicitud_equipo);
      }
    }
  });

  transaction();

  const ordenActualizada = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(id_orden_recoleccion);

  return res.status(200).json({ success: true, data: ordenActualizada });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_recoleccion } = req.query;

  if (!id_orden_recoleccion) {
    return res.status(400).json({ success: false, error: 'ID de orden requerido' });
  }

  const ordenAEliminar = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(id_orden_recoleccion) as any;

  if (!ordenAEliminar) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  // Transacción para eliminar la orden y revertir inventario
  const transaction = db.transaction(() => {
    // 1. Revertir inventario si la orden tiene id_detalle_solicitud_equipo
    if (ordenAEliminar.id_detalle_solicitud_equipo) {
      const detalle = db.prepare(
        `SELECT id_equipo, cantidad_equipo FROM detalle_solicitud_equipo 
         WHERE id_detalle_solicitud_equipo = ?`
      ).get(ordenAEliminar.id_detalle_solicitud_equipo) as any;

      if (detalle && detalle.id_equipo) {
        const cantidadRevertir = ordenAEliminar.cantidad || detalle.cantidad_equipo || 1;
        
        // Revertir: en_recoleccion → alquilado
        db.prepare(
          `UPDATE equipo
           SET cantidad_en_recoleccion = MAX(0, COALESCE(cantidad_en_recoleccion, 0) - ?),
               cantidad_alquilado = COALESCE(cantidad_alquilado, 0) + ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id_equipo = ?`
        ).run(cantidadRevertir, cantidadRevertir, detalle.id_equipo);
      }
    }

    // 2. Revertir estado de la SE a DONDE_CLIENTE (4)
    if (ordenAEliminar.id_solicitud_equipo) {
      db.prepare(
        `UPDATE encabezado_solicitud_equipo
         SET estado_solicitud_equipo = 4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_solicitud_equipo = ?`
      ).run(ordenAEliminar.id_solicitud_equipo);
    }

    // 3. Eliminar la orden
    db.prepare('DELETE FROM orden_recoleccion WHERE id_orden_recoleccion = ?').run(id_orden_recoleccion);
  });

  transaction();

  return res.status(200).json({ success: true, data: ordenAEliminar });
}
