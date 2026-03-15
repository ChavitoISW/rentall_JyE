import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'rentall.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    return handlePut(req, res);
  }
  
  return res.status(405).json({ error: 'Método no permitido' });
}

function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const {
    id_equipo,
    cantidad_disponible,
    cantidad_alquilado,
    cantidad_en_transito,
    cantidad_en_recoleccion,
    cantidad_en_mantenimiento,
    cantidad_reservado
  } = req.body;

  if (!id_equipo) {
    return res.status(400).json({ error: 'ID de equipo requerido' });
  }

  const db = new Database(dbPath);

  try {
    // Obtener el equipo actual
    const equipo = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(id_equipo) as any;
    
    if (!equipo) {
      db.close();
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Validar que todas las cantidades sean números no negativos
    const cantidades = {
      cantidad_disponible: cantidad_disponible || 0,
      cantidad_alquilado: cantidad_alquilado || 0,
      cantidad_en_transito: cantidad_en_transito || 0,
      cantidad_en_recoleccion: cantidad_en_recoleccion || 0,
      cantidad_en_mantenimiento: cantidad_en_mantenimiento || 0,
      cantidad_reservado: cantidad_reservado || 0
    };

    // Validar que sean números
    for (const [key, value] of Object.entries(cantidades)) {
      if (typeof value !== 'number' || value < 0) {
        db.close();
        return res.status(400).json({ error: `${key} debe ser un número no negativo` });
      }
    }

    // Calcular la suma
    const suma = 
      cantidades.cantidad_disponible +
      cantidades.cantidad_alquilado +
      cantidades.cantidad_en_transito +
      cantidades.cantidad_en_recoleccion +
      cantidades.cantidad_en_mantenimiento +
      cantidades.cantidad_reservado;

    // VALIDACIÓN CRÍTICA: La suma NUNCA puede ser mayor al total
    if (suma > equipo.cantidad_equipo) {
      db.close();
      return res.status(400).json({ 
        error: `La suma de las cantidades (${suma}) no puede exceder el total del equipo (${equipo.cantidad_equipo})` 
      });
    }

    // Actualizar el inventario (NO se toca la bitácora)
    const stmt = db.prepare(`
      UPDATE equipo
      SET cantidad_disponible = ?,
          cantidad_alquilado = ?,
          cantidad_en_transito = ?,
          cantidad_en_recoleccion = ?,
          cantidad_en_mantenimiento = ?,
          cantidad_reservado = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id_equipo = ?
    `);

    stmt.run(
      cantidades.cantidad_disponible,
      cantidades.cantidad_alquilado,
      cantidades.cantidad_en_transito,
      cantidades.cantidad_en_recoleccion,
      cantidades.cantidad_en_mantenimiento,
      cantidades.cantidad_reservado,
      id_equipo
    );

    // Obtener el equipo actualizado
    const equipoActualizado = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(id_equipo);

    db.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Inventario actualizado correctamente',
      equipo: equipoActualizado
    });

  } catch (error: any) {
    db.close();
    console.error('Error al actualizar inventario:', error);
    return res.status(500).json({ 
      error: 'Error al actualizar inventario',
      details: error.message 
    });
  }
}
