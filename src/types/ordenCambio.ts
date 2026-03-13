// Estados de Orden de Cambio
export enum EstadoOrdenCambio {
  PENDIENTE = 0,
  EN_RUTA = 1,
  COMPLETADA = 2,
  CANCELADA = 3
}

export const EstadoOrdenCambioLabels: Record<EstadoOrdenCambio, string> = {
  [EstadoOrdenCambio.PENDIENTE]: 'Pendiente',
  [EstadoOrdenCambio.EN_RUTA]: 'En Ruta',
  [EstadoOrdenCambio.COMPLETADA]: 'Completada',
  [EstadoOrdenCambio.CANCELADA]: 'Cancelada'
};

export interface OrdenCambio {
  id_orden_cambio?: number;
  numero_orden_cambio?: string;
  id_solicitud_equipo?: number;
  numero_solicitud_equipo?: string;
  id_equipo_actual?: number;
  nombre_equipo_actual?: string;
  id_equipo_nuevo?: number;
  nombre_equipo_nuevo?: string;
  motivo_cambio?: string;
  fecha_creacion?: string;
  fecha_programada?: string;
  estado?: EstadoOrdenCambio;
  observaciones?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
}
