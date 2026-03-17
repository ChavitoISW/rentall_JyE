export enum EstadoContrato {
  ANULADO = 0,
  GENERADO = 1,
  FINALIZADO = 2,
  EXTENDIDO = 3
}

export const EstadoContratoLabels: Record<EstadoContrato, string> = {
  [EstadoContrato.ANULADO]: 'Anulado',
  [EstadoContrato.GENERADO]: 'Generado',
  [EstadoContrato.FINALIZADO]: 'Finalizado',
  [EstadoContrato.EXTENDIDO]: 'Extendido'
};

export interface Contrato {
  id_contrato?: number;
  id_solicitud_equipo: number;
  estado: number;
  created_at?: string;
  updated_at?: string;
}
