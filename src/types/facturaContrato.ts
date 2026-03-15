// Tipos para el control de facturación de contratos

export enum EstadoFactura {
  PENDIENTE = 0,
  PAGADA = 1,
  ANULADA = 2
}

export const EstadoFacturaLabels: Record<EstadoFactura, string> = {
  [EstadoFactura.PENDIENTE]: 'Pendiente',
  [EstadoFactura.PAGADA]: 'Pagada',
  [EstadoFactura.ANULADA]: 'Anulada'
};

export interface FacturaContrato {
  id_factura_contrato?: number;
  id_solicitud_equipo: number;
  id_contrato: number;
  numero_factura: string;
  monto_subtotal: number;
  monto_iva: number;
  monto_total: number;
  fecha_emision: string;
  estado_factura: EstadoFactura;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContratoConFactura {
  id_contrato: number;
  numero_contrato: string;
  id_solicitud_equipo: number;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  estado_contrato: number;
  monto_total_facturas?: number;
  cantidad_facturas?: number;
}
