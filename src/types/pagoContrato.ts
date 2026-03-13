export enum TipoPago {
  EFECTIVO = 'efectivo',
  SIMPE = 'simpe',
  TRANSFERENCIA = 'transferencia'
}

export enum EstadoPagoContrato {
  PENDIENTE = 'pendiente',
  PAGO_PARCIAL = 'pago_parcial',
  PAGADO = 'pagado'
}

export interface PagoContrato {
  id_pago_contrato?: number;
  id_contrato: number;
  tipo_pago: TipoPago;
  monto: number;
  fecha_pago: string;
  
  // Campos opcionales según tipo de pago
  numero_comprobante?: string; // Para SIMPE
  banco?: string; // Para Transferencia
  numero_transferencia?: string; // Para Transferencia
  
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContratoConPago {
  id_contrato: number;
  numero_contrato: string;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  total_contrato: number;
  usa_factura: boolean;
  iva_contrato: number;
  monto_pagado: number;
  monto_pendiente: number;
  estado_pago: EstadoPagoContrato;
  fecha_inicio: string;
  fecha_vencimiento: string;
}
