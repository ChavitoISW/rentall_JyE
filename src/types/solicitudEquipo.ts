// Enums y tipos compartidos que pueden usarse tanto en cliente como en servidor

export enum EstadoSolicitudEquipo {
  SOLICITUD = 1,
  CONTRATO_GENERADO = 2,
  EN_RUTA_ENTREGA = 3,
  DONDE_CLIENTE = 4,
  EN_RUTA_RECOLECCION = 5,
  FINALIZADO = 6,
  CANCELADO = 7,
  ANULADO = 8,
  EXTENDIDO = 9
}

export const EstadoSolicitudEquipoLabels: Record<EstadoSolicitudEquipo, string> = {
  [EstadoSolicitudEquipo.SOLICITUD]: 'Solicitud',
  [EstadoSolicitudEquipo.CONTRATO_GENERADO]: 'Contrato Generado',
  [EstadoSolicitudEquipo.EN_RUTA_ENTREGA]: 'En Ruta Entrega',
  [EstadoSolicitudEquipo.DONDE_CLIENTE]: 'Contrato Activo',
  [EstadoSolicitudEquipo.EN_RUTA_RECOLECCION]: 'En Ruta Recolección',
  [EstadoSolicitudEquipo.FINALIZADO]: 'Finalizado',
  [EstadoSolicitudEquipo.CANCELADO]: 'Cancelado',
  [EstadoSolicitudEquipo.ANULADO]: 'Anulado',
  [EstadoSolicitudEquipo.EXTENDIDO]: 'Extendido'
};

export interface EncabezadoSolicitudEquipo {
  id_solicitud_equipo?: number;
  numero_solicitud_equipo?: string;
  id_cliente?: number;
  fecha_elaboracion?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  nombre_recibe?: string;
  cedula_recibe?: string;
  telefono_recibe?: string;
  precio_total_equipos?: number;
  provincia_solicitud_equipo?: string;
  canton_solicitud_equipo?: string;
  distrito_solicitud_equipo?: string;
  otras_senas_solicitud_equipo?: string;
  observaciones_solicitud_equipo?: string;
  pago_envio?: boolean;
  monto_envio?: number;
  usa_factura?: boolean;
  subtotal_solicitud_equipo?: number;
  descuento_solicitud_equipo?: number;
  total_solicitud_equipo?: number;
  iva_solicitud_equipo?: number;
  estado_solicitud_equipo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleSolicitudEquipo {
  id_detalle_solicitud_equipo?: number;
  numero_solicitud_equipo?: string;
  id_equipo?: number;
  cantidad_equipo?: number;
  periodicidad?: number;
  cantidad_periodicidad?: number;
  iva_detalle?: number;
  subtotal_detalle?: number;
  monto_descuento?: number;
  monto_final?: number;
  fecha_devolucion?: string;
  created_at?: string;
  updated_at?: string;
}
