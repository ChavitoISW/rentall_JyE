import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id } = req.query;
  const { equipos, descuento } = req.body; // Array de { id_equipo, periodicidad, cantidad_periodos, fecha_devolucion } + descuento opcional

  if (!id || !equipos || !Array.isArray(equipos) || equipos.length === 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const transaction = db.transaction(() => {
    try {
      // 1. Obtener contrato original con todos los datos de la SE
      const contratoOriginal = db.prepare(`
        SELECT c.*, 
               se.id_solicitud_equipo,
               se.numero_solicitud_equipo,
               se.fecha_vencimiento, 
               se.fecha_inicio as se_fecha_inicio,
               se.fecha_elaboracion,
               se.id_cliente, 
               se.nombre_recibe,
               se.cedula_recibe,
               se.telefono_recibe,
               se.provincia_solicitud_equipo,
               se.canton_solicitud_equipo,
               se.distrito_solicitud_equipo,
               se.otras_senas_solicitud_equipo,
               se.observaciones_solicitud_equipo,
               se.usa_factura, 
               se.pago_envio, 
               se.monto_envio,
               se.es_extension,
               se.numero_se_origen
        FROM contrato c
        LEFT JOIN encabezado_solicitud_equipo se ON c.id_solicitud_equipo = se.id_solicitud_equipo
        WHERE c.id_contrato = ?
      `).get(id) as any;

      if (!contratoOriginal) {
        throw new Error('Contrato no encontrado');
      }

      if (contratoOriginal.estado !== 1) { // Solo contratos GENERADOS
        throw new Error('Solo se pueden extender contratos en estado GENERADO');
      }

      // 2. Determinar el número base de la SE (si ya es extensión, usar el origen)
      const numeroSEBase = contratoOriginal.es_extension 
        ? contratoOriginal.numero_se_origen 
        : contratoOriginal.numero_solicitud_equipo;

      // 3. Calcular el siguiente sufijo de extensión
      // Buscar todas las extensiones existentes de esta SE base
      const extensionesExistentes = db.prepare(`
        SELECT numero_solicitud_equipo
        FROM encabezado_solicitud_equipo
        WHERE numero_se_origen = ? OR (numero_solicitud_equipo LIKE ? AND es_extension = 1)
        ORDER BY numero_solicitud_equipo DESC
      `).all(numeroSEBase, `${numeroSEBase}-EXT%`) as any[];

      // Determinar el próximo número de extensión (EXT1, EXT2, etc.)
      let numeroExtension = 1;
      if (extensionesExistentes.length > 0) {
        // Buscar el mayor sufijo existente (-EXT1, -EXT2, etc.)
        for (const ext of extensionesExistentes) {
          const match = ext.numero_solicitud_equipo.match(/-EXT(\d+)$/);
          if (match) {
            const sufijo = parseInt(match[1]);
            if (sufijo >= numeroExtension) {
              numeroExtension = sufijo + 1;
            }
          }
        }
      }

      // Generar nuevo número: 00007-EXT1, 00007-EXT2, etc.
      const nuevoNumeroSE = `${numeroSEBase}-EXT${numeroExtension}`;

      // 4. Calcular fechas
      // REGLA DE NEGOCIO: La fecha de inicio de una extensión es la misma
      // que la fecha de vencimiento del contrato raíz
      const fechaVencimiento = new Date(contratoOriginal.fecha_vencimiento);
      const fechaVencimientoEsperada = new Date(fechaVencimiento);
      fechaVencimientoEsperada.setHours(0, 0, 0, 0);
      
      const nuevaFechaInicio = new Date(fechaVencimiento);
      nuevaFechaInicio.setHours(0, 0, 0, 0);
      const fechaInicioStr = nuevaFechaInicio.toISOString().split('T')[0];

      // Validar que las fechas de devolución sean posteriores a la fecha de inicio de la extensión
      const fechasDevolucion = equipos.map(e => new Date(e.fecha_devolucion));
      for (const fechaDevolucion of fechasDevolucion) {
        if (fechaDevolucion < nuevaFechaInicio) {
          throw new Error(
            `Las fechas de devolución deben ser posteriores a la fecha de inicio de la extensión (${fechaInicioStr})`
          );
        }
      }

      const maxFechaDevolucion = new Date(Math.max(...fechasDevolucion.map(f => f.getTime())));
      const fechaVencimientoStr = maxFechaDevolucion.toISOString().split('T')[0];

      const fechaActual = new Date().toISOString().split('T')[0];

      // 5. Calcular totales para la nueva SE
      // 5. Calcular totales para la nueva SE
      let subtotalGeneral = 0;
      let ivaGeneral = 0;

      for (const equipo of equipos) {
        // Obtener datos del equipo y su categoría
        const datosEquipo = db.prepare(`
          SELECT e.nombre_equipo, e.id_equipo_categoria, e.cantidad_equipo, 
                 e.id_equipo_especifico, c.nombre as nombre_categoria
          FROM equipo e
          LEFT JOIN categoria_equipo c ON e.id_equipo_categoria = c.id
          WHERE e.id_equipo = ?
        `).get(equipo.id_equipo) as any;

        if (!datosEquipo) {
          throw new Error(`No se encontró el equipo ${equipo.id_equipo}`);
        }

        // Obtener precio actual según periodicidad y tabla específica
        let precioUnitario = 0;
        
        if (datosEquipo.id_equipo_especifico) {
          const categoria = datosEquipo.nombre_categoria?.toLowerCase() || '';
          let tablaNombre = '';
          let idColumna = '';
          let campoPeriodicidad = '';

          // Mapear periodicidad numérica a nombre de columna
          switch (equipo.periodicidad) {
            case 0: campoPeriodicidad = 'precio_dia'; break;
            case 1: campoPeriodicidad = 'precio_semana'; break;
            case 2: campoPeriodicidad = 'precio_quincena'; break;
            case 4: campoPeriodicidad = 'precio_mes'; break;
            default: campoPeriodicidad = 'precio_mes';
          }

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
          }

          if (tablaNombre) {
            const precioEquipo = db.prepare(`
              SELECT ${campoPeriodicidad} as precio
              FROM ${tablaNombre}
              WHERE ${idColumna} = ?
            `).get(datosEquipo.id_equipo_especifico) as any;

            precioUnitario = precioEquipo?.precio || 0;
          }
        }

        if (precioUnitario === 0) {
          throw new Error(`No se encontró precio para el equipo ${datosEquipo.nombre_equipo}`);
        }

        // Calcular montos
        const cantidad = equipo.cantidad_equipo || 1;
        const subtotal = precioUnitario * equipo.cantidad_periodos * cantidad;
        const iva = contratoOriginal.usa_factura ? subtotal * 0.13 : 0;
        const total = subtotal + iva;

        subtotalGeneral += subtotal;
        ivaGeneral += iva;
      }

      // 6. Crear NUEVA SE de extensión (no modificar la original)
      const observacionExtension = `Extensión del contrato #${id} (SE origen: ${numeroSEBase})`;
      
      const resultSE = db.prepare(`
        INSERT INTO encabezado_solicitud_equipo (
          numero_solicitud_equipo,
          id_cliente,
          fecha_elaboracion,
          fecha_inicio,
          fecha_vencimiento,
          nombre_recibe,
          cedula_recibe,
          telefono_recibe,
          precio_total_equipos,
          provincia_solicitud_equipo,
          canton_solicitud_equipo,
          distrito_solicitud_equipo,
          otras_senas_solicitud_equipo,
          observaciones_solicitud_equipo,
          pago_envio,
          monto_envio,
          usa_factura,
          subtotal_solicitud_equipo,
          descuento_solicitud_equipo,
          total_solicitud_equipo,
          iva_solicitud_equipo,
          estado_solicitud_equipo,
          es_extension,
          numero_se_origen,
          id_solicitud_origen,
          id_contrato_origen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nuevoNumeroSE,
        contratoOriginal.id_cliente,
        fechaActual,
        fechaInicioStr,
        fechaVencimientoStr,
        contratoOriginal.nombre_recibe,
        contratoOriginal.cedula_recibe,
        contratoOriginal.telefono_recibe,
        subtotalGeneral + ivaGeneral,
        contratoOriginal.provincia_solicitud_equipo,
        contratoOriginal.canton_solicitud_equipo,
        contratoOriginal.distrito_solicitud_equipo,
        contratoOriginal.otras_senas_solicitud_equipo,
        observacionExtension,
        contratoOriginal.pago_envio,
        contratoOriginal.monto_envio,
        contratoOriginal.usa_factura,
        subtotalGeneral,
        descuento || 0, // descuento_solicitud_equipo
        subtotalGeneral + ivaGeneral - (descuento || 0),
        ivaGeneral,
        4, // estado_solicitud_equipo: DONDE_CLIENTE (Contrato Activo)
        1, // es_extension: true
        numeroSEBase, // numero_se_origen
        contratoOriginal.id_solicitud_equipo, // id_solicitud_origen
        id // id_contrato_origen
      );

      const nuevaSolicitudId = resultSE.lastInsertRowid as number;

      // 7. Insertar detalles en la NUEVA SE

      // 7. Insertar detalles en la NUEVA SE
      for (const equipo of equipos) {
        // Obtener datos del equipo y su categoría
        const datosEquipo = db.prepare(`
          SELECT e.nombre_equipo, e.id_equipo_categoria, e.cantidad_equipo, 
                 e.id_equipo_especifico, c.nombre as nombre_categoria
          FROM equipo e
          LEFT JOIN categoria_equipo c ON e.id_equipo_categoria = c.id
          WHERE e.id_equipo = ?
        `).get(equipo.id_equipo) as any;

        if (!datosEquipo) {
          throw new Error(`No se encontró el equipo ${equipo.id_equipo}`);
        }

        // Obtener precio actual según periodicidad y tabla específica
        let precioUnitario = 0;
        
        if (datosEquipo.id_equipo_especifico) {
          const categoria = datosEquipo.nombre_categoria?.toLowerCase() || '';
          let tablaNombre = '';
          let idColumna = '';
          let campoPeriodicidad = '';

          // Mapear periodicidad numérica a nombre de columna
          switch (equipo.periodicidad) {
            case 0: campoPeriodicidad = 'precio_dia'; break;
            case 1: campoPeriodicidad = 'precio_semana'; break;
            case 2: campoPeriodicidad = 'precio_quincena'; break;
            case 4: campoPeriodicidad = 'precio_mes'; break;
            default: campoPeriodicidad = 'precio_mes';
          }

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
          }

          if (tablaNombre) {
            const precioEquipo = db.prepare(`
              SELECT ${campoPeriodicidad} as precio
              FROM ${tablaNombre}
              WHERE ${idColumna} = ?
            `).get(datosEquipo.id_equipo_especifico) as any;

            precioUnitario = precioEquipo?.precio || 0;
          }
        }

        if (precioUnitario === 0) {
          throw new Error(`No se encontró precio para el equipo ${datosEquipo.nombre_equipo}`);
        }

        // Calcular montos
        const cantidad = equipo.cantidad_equipo || 1;
        const subtotal = precioUnitario * equipo.cantidad_periodos * cantidad;
        const iva = contratoOriginal.usa_factura ? subtotal * 0.13 : 0;
        const total = subtotal + iva;

        // Insertar detalle en la NUEVA SE
        db.prepare(`
          INSERT INTO detalle_solicitud_equipo (
            numero_solicitud_equipo,
            id_equipo,
            cantidad_equipo,
            periodicidad,
            cantidad_periodicidad,
            subtotal_detalle,
            iva_detalle,
            monto_descuento,
            monto_final,
            fecha_devolucion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          nuevoNumeroSE,
          equipo.id_equipo,
          cantidad,
          equipo.periodicidad,
          equipo.cantidad_periodos,
          subtotal,
          iva,
          0, // monto_descuento
          total,
          equipo.fecha_devolucion
        );

        // NO actualizar inventario: los equipos ya están con el cliente
        // Solo se está extendiendo el periodo de uso, no reservando equipos adicionales
      }

      // 8. Marcar contrato original como EXTENDIDO
      db.prepare(`
        UPDATE contrato
        SET estado = 3
        WHERE id_contrato = ?
      `).run(id);

      // 9. Marcar SE original como EXTENDIDO
      db.prepare(`
        UPDATE encabezado_solicitud_equipo
        SET estado_solicitud_equipo = 9
        WHERE id_solicitud_equipo = ?
      `).run(contratoOriginal.id_solicitud_equipo);

      // 10. Crear NUEVO contrato apuntando a la NUEVA SE
      const resultContrato = db.prepare(`
        INSERT INTO contrato (id_solicitud_equipo, estado)
        VALUES (?, 1)
      `).run(nuevaSolicitudId);

      const nuevoContratoId = resultContrato.lastInsertRowid as number;

      // Asignar numero_contrato igual al id generado (igual que contratos normales)
      db.prepare(`
        UPDATE contrato SET numero_contrato = ? WHERE id_contrato = ?
      `).run(String(nuevoContratoId), nuevoContratoId);

      // 11. Actualizar bitácoras del contrato original (NO crear nuevas)
      // Las bitácoras se mantienen activas pero ahora asociadas a la extensión
      for (const equipo of equipos) {
        // Actualizar observaciones de bitácoras existentes
        db.prepare(`
          UPDATE bitacora_equipo
          SET observaciones = observaciones || ' | Extendido: nueva SE ${nuevoNumeroSE} hasta ${fechaVencimientoStr}',
              updated_at = CURRENT_TIMESTAMP
          WHERE id_solicitud_equipo = ?
            AND id_equipo = ?
            AND estado_bitacora = 1
        `).run(
          contratoOriginal.id_solicitud_equipo,
          equipo.id_equipo
        );
      }

      return {
        success: true,
        data: {
          id_contrato: nuevoContratoId,
          id_solicitud_equipo: nuevaSolicitudId,
          numero_solicitud_equipo: nuevoNumeroSE,
          fecha_inicio: fechaInicioStr,
          fecha_vencimiento: fechaVencimientoStr,
          total: subtotalGeneral + ivaGeneral,
          extension_de: numeroSEBase
        }
      };
    } catch (error: any) {
      throw error;
    }
  });

  try {
    const result = transaction();
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error al extender contrato:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al extender contrato' 
    });
  }
}
