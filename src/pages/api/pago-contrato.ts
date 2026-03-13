import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/database';

interface PagoContratoDb {
  id_pago_contrato: number;
  id_contrato: number;
  tipo_pago: string;
  monto: number;
  fecha_pago: string;
  numero_comprobante?: string;
  banco?: string;
  numero_transferencia?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

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
    console.error('Error en API pago-contrato:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id_pago_contrato, id_contrato } = req.query;

  let query = 'SELECT * FROM pago_contrato';
  const conditions: string[] = [];
  const values: any[] = [];

  if (id_pago_contrato) {
    conditions.push('id_pago_contrato = ?');
    values.push(id_pago_contrato);
  }

  if (id_contrato) {
    conditions.push('id_contrato = ?');
    values.push(id_contrato);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fecha_pago DESC, created_at DESC';

  const result = db.prepare(query).all(...values);
  return res.status(200).json({ success: true, data: result });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    id_contrato,
    tipo_pago,
    monto,
    fecha_pago,
    numero_comprobante,
    banco,
    numero_transferencia,
    observaciones
  } = req.body;

  if (!id_contrato || !tipo_pago || !monto || !fecha_pago) {
    return res.status(400).json({ 
      success: false, 
      error: 'Faltan campos requeridos: id_contrato, tipo_pago, monto, fecha_pago' 
    });
  }

  // Validar tipo de pago
  if (!['efectivo', 'simpe', 'transferencia'].includes(tipo_pago)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Tipo de pago inválido. Debe ser: efectivo, simpe o transferencia' 
    });
  }

  const insert = db.prepare(`
    INSERT INTO pago_contrato (
      id_contrato, tipo_pago, monto, fecha_pago,
      numero_comprobante, banco, numero_transferencia, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    id_contrato,
    tipo_pago,
    monto,
    fecha_pago,
    numero_comprobante || null,
    banco || null,
    numero_transferencia || null,
    observaciones || null
  );

  const nuevoPago = db.prepare('SELECT * FROM pago_contrato WHERE id_pago_contrato = ?').get(result.lastInsertRowid);

  return res.status(201).json({ success: true, data: nuevoPago });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id_pago_contrato } = req.query;
  
  if (!id_pago_contrato) {
    return res.status(400).json({ success: false, error: 'ID de pago requerido' });
  }

  const pagoExistente = db.prepare('SELECT * FROM pago_contrato WHERE id_pago_contrato = ?').get(id_pago_contrato) as PagoContratoDb | undefined;

  if (!pagoExistente) {
    return res.status(404).json({ success: false, error: 'Pago no encontrado' });
  }

  const {
    tipo_pago,
    monto,
    fecha_pago,
    numero_comprobante,
    banco,
    numero_transferencia,
    observaciones
  } = req.body;

  const update = db.prepare(`
    UPDATE pago_contrato SET
      tipo_pago = ?,
      monto = ?,
      fecha_pago = ?,
      numero_comprobante = ?,
      banco = ?,
      numero_transferencia = ?,
      observaciones = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id_pago_contrato = ?
  `);

  update.run(
    tipo_pago || pagoExistente.tipo_pago,
    monto !== undefined ? monto : pagoExistente.monto,
    fecha_pago || pagoExistente.fecha_pago,
    numero_comprobante !== undefined ? numero_comprobante : pagoExistente.numero_comprobante,
    banco !== undefined ? banco : pagoExistente.banco,
    numero_transferencia !== undefined ? numero_transferencia : pagoExistente.numero_transferencia,
    observaciones !== undefined ? observaciones : pagoExistente.observaciones,
    id_pago_contrato
  );

  const pagoActualizado = db.prepare('SELECT * FROM pago_contrato WHERE id_pago_contrato = ?').get(id_pago_contrato);

  return res.status(200).json({ success: true, data: pagoActualizado });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id_pago_contrato } = req.query;

  if (!id_pago_contrato) {
    return res.status(400).json({ success: false, error: 'ID de pago requerido' });
  }

  const pagoAEliminar = db.prepare('SELECT * FROM pago_contrato WHERE id_pago_contrato = ?').get(id_pago_contrato);

  if (!pagoAEliminar) {
    return res.status(404).json({ success: false, error: 'Pago no encontrado' });
  }

  const deleteStmt = db.prepare('DELETE FROM pago_contrato WHERE id_pago_contrato = ?');
  deleteStmt.run(id_pago_contrato);

  return res.status(200).json({ success: true, data: pagoAEliminar });
}
