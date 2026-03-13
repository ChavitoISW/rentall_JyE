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
    console.error('Error en API orden-recoleccion:', error);
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

  const ordenCreada = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(result.lastInsertRowid);

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

  const update = db.prepare(
    `UPDATE orden_recoleccion SET ${updates.join(', ')} WHERE id_orden_recoleccion = ?`
  );
  
  const result = update.run(...values);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  const ordenActualizada = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(id_orden_recoleccion);

  return res.status(200).json({ success: true, data: ordenActualizada });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id_orden_recoleccion } = req.query;

  if (!id_orden_recoleccion) {
    return res.status(400).json({ success: false, error: 'ID de orden requerido' });
  }

  const ordenAEliminar = db.prepare('SELECT * FROM orden_recoleccion WHERE id_orden_recoleccion = ?').get(id_orden_recoleccion);

  if (!ordenAEliminar) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  }

  const deleteStmt = db.prepare('DELETE FROM orden_recoleccion WHERE id_orden_recoleccion = ?');
  deleteStmt.run(id_orden_recoleccion);

  return res.status(200).json({ success: true, data: ordenAEliminar });
}
