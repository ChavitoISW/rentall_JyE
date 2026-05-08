import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database', 'rentall.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'PUT') {
    return handlePut(req, res);
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

function handleGet(_req: NextApiRequest, res: NextApiResponse) {
  const db = new Database(dbPath);
  try {
    const rows = db.prepare(`
      SELECT
        se.id_solicitud_equipo,
        se.numero_solicitud_equipo,
        se.fecha_inicio,
        se.fecha_vencimiento,
        se.estado_solicitud_equipo,
        cli.nombre_cliente,
        co.numero_contrato
      FROM encabezado_solicitud_equipo se
      LEFT JOIN cliente cli ON se.id_cliente = cli.id_cliente
      LEFT JOIN contrato co ON co.id_solicitud_equipo = se.id_solicitud_equipo
      ORDER BY se.id_solicitud_equipo DESC
    `).all() as any[];

    return res.status(200).json({ data: rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al obtener solicitudes' });
  } finally {
    db.close();
  }
}

function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id_solicitud_equipo, estado_solicitud_equipo, motivo } = req.body;

  if (!id_solicitud_equipo) {
    return res.status(400).json({ error: 'id_solicitud_equipo es requerido' });
  }
  if (estado_solicitud_equipo === undefined || estado_solicitud_equipo === null) {
    return res.status(400).json({ error: 'estado_solicitud_equipo es requerido' });
  }
  if (!motivo || !String(motivo).trim()) {
    return res.status(400).json({ error: 'El motivo del ajuste es requerido' });
  }

  const estadoNum = Number(estado_solicitud_equipo);
  if (!Number.isInteger(estadoNum) || estadoNum < 1 || estadoNum > 9) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const db = new Database(dbPath);
  try {
    const se = db.prepare(
      'SELECT id_solicitud_equipo FROM encabezado_solicitud_equipo WHERE id_solicitud_equipo = ?'
    ).get(id_solicitud_equipo) as any;

    if (!se) {
      return res.status(404).json({ error: 'Solicitud de equipo no encontrada' });
    }

    db.prepare(
      'UPDATE encabezado_solicitud_equipo SET estado_solicitud_equipo = ? WHERE id_solicitud_equipo = ?'
    ).run(estadoNum, id_solicitud_equipo);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al actualizar estado' });
  } finally {
    db.close();
  }
}
