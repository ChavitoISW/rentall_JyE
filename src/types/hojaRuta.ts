// Estados de Hoja de Ruta
export enum EstadoHojaRuta {
  BORRADOR = 0,
  ACTIVA = 1,
  COMPLETADA = 2,
  CANCELADA = 3
}

export const EstadoHojaRutaLabels: Record<EstadoHojaRuta, string> = {
  [EstadoHojaRuta.BORRADOR]: 'Borrador',
  [EstadoHojaRuta.ACTIVA]: 'Activa',
  [EstadoHojaRuta.COMPLETADA]: 'Completada',
  [EstadoHojaRuta.CANCELADA]: 'Cancelada'
};

// Tipos de operación en hoja de ruta
export enum TipoOperacionRuta {
  ENTREGA = 0,
  RECOLECCION = 1,
  CAMBIO = 2
}

export const TipoOperacionRutaLabels: Record<TipoOperacionRuta, string> = {
  [TipoOperacionRuta.ENTREGA]: 'Entrega',
  [TipoOperacionRuta.RECOLECCION]: 'Recolección',
  [TipoOperacionRuta.CAMBIO]: 'Cambio'
};

// Estado de detalle de hoja de ruta
export enum EstadoDetalleRuta {
  PENDIENTE = 0,
  COMPLETADO = 1,
  COMPLETADO_PARCIAL = 2,
  FALLIDO = 3,
  NO_EJECUTADA = 4
}

export const EstadoDetalleRutaLabels: Record<EstadoDetalleRuta, string> = {
  [EstadoDetalleRuta.PENDIENTE]: 'Pendiente',
  [EstadoDetalleRuta.COMPLETADO]: 'Completado',
  [EstadoDetalleRuta.COMPLETADO_PARCIAL]: 'Parcial',
  [EstadoDetalleRuta.FALLIDO]: 'Fallido',
  [EstadoDetalleRuta.NO_EJECUTADA]: 'No Ejecutada'
};

export interface HojaRuta {
  id_hoja_ruta?: number;
  numero_hoja_ruta?: string;
  fecha_creacion?: string;
  fecha_ruta?: string;
  conductor?: string;
  vehiculo?: string;
  estado?: EstadoHojaRuta;
  observaciones?: string;
}

export interface DetalleHojaRuta {
  id_detalle_hoja_ruta?: number;
  id_hoja_ruta?: number;
  tipo_operacion?: TipoOperacionRuta;
  id_referencia?: number;
  numero_referencia?: string;
  orden_visita?: number;
  direccion?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  estado?: EstadoDetalleRuta;
  hora_estimada?: string;
  hora_real?: string;
  notas?: string;
  equipos_info?: string;
}

export interface HojaRutaExtendida extends HojaRuta {
  detalles?: DetalleHojaRuta[];
  total_paradas?: number;
}
