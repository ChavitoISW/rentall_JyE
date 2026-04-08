import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

// Usar la misma configuración que el resto del sistema
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database', 'rentall.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database(dbPath);

  try {
    if (req.method === 'GET') {
      const { id_contrato } = req.query;

      if (id_contrato) {
        // Obtener facturas de un contrato específico
        const facturas = db.prepare(`
          SELECT 
            fc.*,
            c.numero_contrato,
            ese.numero_solicitud_equipo,
            (cl.nombre_cliente || ' ' || COALESCE(cl.apellidos_cliente, '')) as nombre_cliente
          FROM factura_contrato fc
          INNER JOIN contrato c ON fc.id_contrato = c.id_contrato
          INNER JOIN encabezado_solicitud_equipo ese ON fc.id_solicitud_equipo = ese.id_solicitud_equipo
          INNER JOIN cliente cl ON ese.id_cliente = cl.id_cliente
          WHERE fc.id_contrato = ?
          ORDER BY fc.fecha_emision DESC, fc.created_at DESC
        `).all(id_contrato);

        return res.status(200).json({ 
          success: true, 
          data: facturas 
        });
      } else {
        // Obtener todas las facturas con información del estado de pago del contrato
        const facturas = db.prepare(`
          SELECT 
            fc.*,
            c.numero_contrato,
            ese.total_solicitud_equipo as total_contrato,
            ese.numero_solicitud_equipo,
            (cl.nombre_cliente || ' ' || COALESCE(cl.apellidos_cliente, '')) as nombre_cliente,
            COALESCE(
              (SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato),
              0
            ) as monto_pagado,
            (ese.total_solicitud_equipo - COALESCE(
              (SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato),
              0
            )) as monto_pendiente,
            CASE
              WHEN COALESCE((SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato), 0) = 0 THEN 'pendiente'
              WHEN COALESCE((SELECT SUM(monto) FROM pago_contrato WHERE id_contrato = c.id_contrato), 0) >= ese.total_solicitud_equipo THEN 'pagado'
              ELSE 'pago_parcial'
            END as estado_pago
          FROM factura_contrato fc
          INNER JOIN contrato c ON fc.id_contrato = c.id_contrato
          INNER JOIN encabezado_solicitud_equipo ese ON fc.id_solicitud_equipo = ese.id_solicitud_equipo
          INNER JOIN cliente cl ON ese.id_cliente = cl.id_cliente
          ORDER BY fc.fecha_emision DESC, fc.created_at DESC
        `).all();

        return res.status(200).json({ 
          success: true, 
          data: facturas 
        });
      }
    }

    if (req.method === 'POST') {
      const {
        id_solicitud_equipo,
        id_contrato,
        numero_factura,
        monto_subtotal,
        monto_iva,
        monto_total,
        fecha_emision,
        observaciones
      } = req.body;

      // Validaciones
      if (!id_solicitud_equipo || !id_contrato || !numero_factura || !fecha_emision) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos requeridos deben estar presentes'
        });
      }

      if (monto_total <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto total debe ser mayor a cero'
        });
      }

      // Verificar que no exista una factura para esta SE y contrato
      const facturaExistente = db.prepare(`
        SELECT id_factura_contrato, numero_factura
        FROM factura_contrato 
        WHERE id_solicitud_equipo = ? AND id_contrato = ?
      `).get(id_solicitud_equipo, id_contrato) as { id_factura_contrato: number; numero_factura: string } | undefined;

      if (facturaExistente) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una factura registrada (${facturaExistente.numero_factura}) para esta Solicitud de Equipo y Contrato`
        });
      }

      // Insertar factura
      const insert = db.prepare(`
        INSERT INTO factura_contrato (
          id_solicitud_equipo,
          id_contrato,
          numero_factura,
          monto_subtotal,
          monto_iva,
          monto_total,
          fecha_emision,
          estado_factura,
          observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);

      const result = insert.run(
        id_solicitud_equipo,
        id_contrato,
        numero_factura,
        monto_subtotal || 0,
        monto_iva || 0,
        monto_total,
        fecha_emision,
        observaciones || null
      );

      return res.status(201).json({
        success: true,
        message: 'Factura registrada exitosamente',
        data: { id_factura_contrato: result.lastInsertRowid }
      });
    }

    if (req.method === 'PUT') {
      const {
        id_factura_contrato,
        numero_factura,
        monto_subtotal,
        monto_iva,
        monto_total,
        fecha_emision,
        estado_factura,
        observaciones
      } = req.body;

      if (!id_factura_contrato) {
        return res.status(400).json({
          success: false,
          message: 'ID de factura requerido'
        });
      }

      // Actualizar factura
      const update = db.prepare(`
        UPDATE factura_contrato SET
          numero_factura = ?,
          monto_subtotal = ?,
          monto_iva = ?,
          monto_total = ?,
          fecha_emision = ?,
          estado_factura = ?,
          observaciones = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_factura_contrato = ?
      `);

      update.run(
        numero_factura,
        monto_subtotal,
        monto_iva,
        monto_total,
        fecha_emision,
        estado_factura,
        observaciones,
        id_factura_contrato
      );

      return res.status(200).json({
        success: true,
        message: 'Factura actualizada exitosamente'
      });
    }

    if (req.method === 'DELETE') {
      const { id_factura_contrato } = req.query;

      if (!id_factura_contrato) {
        return res.status(400).json({
          success: false,
          message: 'ID de factura requerido'
        });
      }

      // Eliminar factura
      const deleteStmt = db.prepare(`
        DELETE FROM factura_contrato WHERE id_factura_contrato = ?
      `);

      deleteStmt.run(id_factura_contrato);

      return res.status(200).json({
        success: true,
        message: 'Factura eliminada exitosamente'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });

  } catch (error: any) {
    console.error('Error en API de facturas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  } finally {
    db.close();
  }
}
