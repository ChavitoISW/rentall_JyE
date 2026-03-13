// Estados de Orden de Recolección
export enum EstadoOrdenRecoleccion {
  PENDIENTE = 0,
  EN_RUTA = 1,
  COMPLETADA = 2,
  CANCELADA = 3
}

export const EstadoOrdenRecoleccionLabels: Record<EstadoOrdenRecoleccion, string> = {
  [EstadoOrdenRecoleccion.PENDIENTE]: 'Pendiente',
  [EstadoOrdenRecoleccion.EN_RUTA]: 'En Ruta',
  [EstadoOrdenRecoleccion.COMPLETADA]: 'Completada',
  [EstadoOrdenRecoleccion.CANCELADA]: 'Cancelada'
};

export interface OrdenRecoleccion {
  id_orden_recoleccion?: number;
  numero_orden_recoleccion?: string;
  id_detalle_solicitud_equipo?: number;
  id_solicitud_equipo?: number;
  numero_solicitud_equipo?: string;
  fecha_creacion?: string;
  fecha_programada_recoleccion?: string;
  nombre_equipo?: string;
  cantidad?: number;
  estado?: EstadoOrdenRecoleccion;
  observaciones?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
}
