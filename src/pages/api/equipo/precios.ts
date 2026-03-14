import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id_equipo } = req.query;

    if (!id_equipo) {
      return res.status(400).json({ success: false, error: 'id_equipo es requerido' });
    }

    // Obtener información del equipo
    const equipo = db.prepare(`
      SELECT e.*, c.nombre as nombre_categoria
      FROM equipo e
      LEFT JOIN categoria_equipo c ON e.id_equipo_categoria = c.id
      WHERE e.id_equipo = ?
    `).get(Number(id_equipo)) as any;

    if (!equipo) {
      return res.status(404).json({ success: false, error: 'Equipo no encontrado' });
    }

    // Si no tiene equipo específico, no hay precios
    if (!equipo.id_equipo_especifico) {
      return res.status(200).json({
        success: true,
        data: {
          id_equipo: equipo.id_equipo,
          nombre_equipo: equipo.nombre_equipo,
          precio_dia: 0,
          precio_semana: 0,
          precio_quincena: 0,
          precio_mes: 0
        }
      });
    }

    // Determinar la tabla específica según la categoría
    const categoria = equipo.nombre_categoria?.toLowerCase() || '';
    let tablaNombre = '';
    let idColumna = '';

    if (categoria.includes('mezcladora')) {
      tablaNombre = 'mezcladora';
      idColumna = 'id_mezcladora';
    } else if (categoria.includes('andamio')) {
      tablaNombre = 'andamio';
      idColumna = 'id_andamio';
    } else if (categoria.includes('compactador')) {
      tablaNombre = 'compactador';
      idColumna = 'id_compactador';
    } else if (categoria.includes('rompedor')) {
      tablaNombre = 'rompedor';
      idColumna = 'id_rompedor';
    } else if (categoria.includes('vibrador')) {
      tablaNombre = 'vibrador';
      idColumna = 'id_vibrador';
    } else if (categoria.includes('puntal')) {
      tablaNombre = 'puntal';
      idColumna = 'id_puntal';
    } else {
      return res.status(200).json({
        success: true,
        data: {
          id_equipo: equipo.id_equipo,
          nombre_equipo: equipo.nombre_equipo,
          precio_dia: 0,
          precio_semana: 0,
          precio_quincena: 0,
          precio_mes: 0
        }
      });
    }

    // Obtener precios de la tabla específica
    const precios = db.prepare(`
      SELECT precio_dia, precio_semana, precio_quincena, precio_mes
      FROM ${tablaNombre}
      WHERE ${idColumna} = ?
    `).get(equipo.id_equipo_especifico) as any;

    if (!precios) {
      return res.status(200).json({
        success: true,
        data: {
          id_equipo: equipo.id_equipo,
          nombre_equipo: equipo.nombre_equipo,
          precio_dia: 0,
          precio_semana: 0,
          precio_quincena: 0,
          precio_mes: 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id_equipo: equipo.id_equipo,
        nombre_equipo: equipo.nombre_equipo,
        precio_dia: precios.precio_dia || 0,
        precio_semana: precios.precio_semana || 0,
        precio_quincena: precios.precio_quincena || 0,
        precio_mes: precios.precio_mes || 0
      }
    });
  } catch (error: any) {
    console.error('Error al obtener precios:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
