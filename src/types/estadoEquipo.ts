export enum EstadoEquipo {
  DISPONIBLE = 1,
  RESERVADO = 2,
  ASIGNADO = 3,
  EN_RECOLECCION = 4,
  EN_MANTENIMIENTO = 5,
  NO_DISPONIBLE = 6
}

export const EstadoEquipoLabels: Record<EstadoEquipo, string> = {
  [EstadoEquipo.DISPONIBLE]: 'Disponible',
  [EstadoEquipo.RESERVADO]: 'Reservado',
  [EstadoEquipo.ASIGNADO]: 'Asignado',
  [EstadoEquipo.EN_RECOLECCION]: 'En recolección',
  [EstadoEquipo.EN_MANTENIMIENTO]: 'En mantenimiento',
  [EstadoEquipo.NO_DISPONIBLE]: 'No Disponible'
};
