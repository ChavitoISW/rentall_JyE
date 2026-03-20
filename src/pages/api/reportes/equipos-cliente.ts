import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { id_cliente } = req.query;

      let query = `
        SELECT DISTINCT
          c.id_cliente,
          c.nombre_cliente || ' ' || c.apellidos_cliente AS nombre_completo_cliente,
          c.documento_identidad_cliente,
          cont.id_contrato,
          cont.numero_contrato,
          ese.numero_solicitud_equipo,
          ese.fecha_inicio,
          ese.fecha_vencimiento,
          cont.estado AS estado_contrato,
          eq.id_equipo,
          eq.nombre_equipo,
          dse.cantidad_equipo,
          dse.periodicidad,
          dse.cantidad_periodicidad,
          dse.fecha_devolucion,
          dse.monto_final,
          CASE
            WHEN hr.estado_hoja_ruta = 1 AND dhr.tipo_operacion = 0 THEN 'En Ruta de Entrega'
            WHEN hr.estado_hoja_ruta = 1 AND dhr.tipo_operacion = 1 THEN 'En Ruta de Recolección'
            WHEN cont.estado = 1 THEN 'Contrato Activo'
            ELSE 'Otro'
          END AS estado_equipo,
          hr.numero_hoja_ruta,
          hr.conductor,
          hr.vehiculo,
          dhr.tipo_operacion
        FROM cliente c
        INNER JOIN encabezado_solicitud_equipo ese ON c.id_cliente = ese.id_cliente
        INNER JOIN contrato cont ON ese.id_solicitud_equipo = cont.id_solicitud_equipo
        INNER JOIN detalle_solicitud_equipo dse ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
        INNER JOIN equipo eq ON dse.id_equipo = eq.id_equipo
        LEFT JOIN detalle_hoja_ruta dhr ON (
          dhr.numero_referencia = ese.numero_solicitud_equipo 
          OR dhr.id_referencia = ese.id_solicitud_equipo
        )
        LEFT JOIN hoja_ruta hr ON dhr.id_hoja_ruta = hr.id_hoja_ruta AND hr.estado_hoja_ruta = 1
        WHERE cont.estado = 1
      `;

      const params: any[] = [];

      if (id_cliente && id_cliente !== 'todos') {
        query += ' AND c.id_cliente = ?';
        params.push(Number(id_cliente));
      }

      query += ' ORDER BY c.nombre_cliente, cont.id_contrato, eq.nombre_equipo';

      const results = db.prepare(query).all(...params);

      // Agrupar resultados por cliente y contrato
      const reporteAgrupado: Record<number, any> = results.reduce((acc: Record<number, any>, row: any) => {
        const clienteKey = row.id_cliente;
        
        if (!acc[clienteKey]) {
          acc[clienteKey] = {
            id_cliente: row.id_cliente,
            nombre_completo_cliente: row.nombre_completo_cliente,
            documento_identidad_cliente: row.documento_identidad_cliente,
            contratos: []
          };
        }

        // Buscar si ya existe el contrato
        let contrato = acc[clienteKey].contratos.find(
          (c: any) => c.id_contrato === row.id_contrato
        );

        if (!contrato) {
          contrato = {
            id_contrato: row.id_contrato,
            numero_contrato: row.numero_contrato,
            numero_solicitud_equipo: row.numero_solicitud_equipo,
            fecha_inicio: row.fecha_inicio,
            fecha_vencimiento: row.fecha_vencimiento,
            estado_contrato: row.estado_contrato,
            estado_equipo: row.estado_equipo,
            numero_hoja_ruta: row.numero_hoja_ruta,
            conductor: row.conductor,
            vehiculo: row.vehiculo,
            equipos: []
          };
          acc[clienteKey].contratos.push(contrato);
        }

        // Agregar equipo al contrato
        contrato.equipos.push({
          id_equipo: row.id_equipo,
          nombre_equipo: row.nombre_equipo,
          cantidad_equipo: row.cantidad_equipo,
          periodicidad: row.periodicidad,
          cantidad_periodicidad: row.cantidad_periodicidad,
          fecha_devolucion: row.fecha_devolucion,
          monto_final: row.monto_final
        });

        return acc;
      }, {});

      // Convertir el objeto agrupado a array
      const reporte = Object.values(reporteAgrupado) as any[];

      // Obtener también estadísticas generales
      let statsQuery = `
        SELECT 
          COUNT(DISTINCT c.id_cliente) as total_clientes,
          COUNT(DISTINCT cont.id_contrato) as total_contratos,
          SUM(dse.cantidad_equipo) as total_equipos,
          COUNT(DISTINCT CASE WHEN cont.estado = 1 THEN cont.id_contrato END) as contratos_activos,
          COUNT(DISTINCT CASE WHEN hr.estado_hoja_ruta = 1 AND dhr.tipo_operacion = 0 THEN cont.id_contrato END) as en_ruta_entrega,
          COUNT(DISTINCT CASE WHEN hr.estado_hoja_ruta = 1 AND dhr.tipo_operacion = 1 THEN cont.id_contrato END) as en_ruta_recoleccion
        FROM cliente c
        INNER JOIN encabezado_solicitud_equipo ese ON c.id_cliente = ese.id_cliente
        INNER JOIN contrato cont ON ese.id_solicitud_equipo = cont.id_solicitud_equipo
        INNER JOIN detalle_solicitud_equipo dse ON ese.numero_solicitud_equipo = dse.numero_solicitud_equipo
        LEFT JOIN detalle_hoja_ruta dhr ON (
          dhr.numero_referencia = ese.numero_solicitud_equipo 
          OR dhr.id_referencia = ese.id_solicitud_equipo
        )
        LEFT JOIN hoja_ruta hr ON dhr.id_hoja_ruta = hr.id_hoja_ruta AND hr.estado_hoja_ruta = 1
        WHERE cont.estado = 1
      `;

      const statsParams: any[] = [];

      if (id_cliente && id_cliente !== 'todos') {
        statsQuery += ' AND c.id_cliente = ?';
        statsParams.push(Number(id_cliente));
      }

      const stats = db.prepare(statsQuery).get(...statsParams);

      res.status(200).json({
        success: true,
        data: {
          reporte,
          estadisticas: stats
        }
      });
    } catch (error) {
      console.error('Error al generar reporte de equipos por cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Error al generar el reporte'
      });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}
