import React, { useState, useEffect } from 'react';
import Menu from '../componentes/Menu';
import Footer from '../componentes/Footer';
import Spinner from '../componentes/Spinner';
import styles from '../styles/SolicitudEquipo.module.css';

interface FacturaReporte {
  numero_factura: string;
  numero_solicitud_equipo: string;
  numero_contrato: string;
  nombre_cliente: string;
  fecha_emision: string;
  monto_subtotal: number;
  monto_iva: number;
  monto_total: number;
  estado_pago: string;
}

interface ReporteData {
  facturas: FacturaReporte[];
  totales: {
    total_facturas: number;
    total_subtotal: number;
    total_iva: number;
    total_general: number;
    facturas_pagadas: number;
    facturas_pendientes: number;
    facturas_pago_parcial: number;
  };
  rango: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

const ReporteFacturas: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Establecer fechas por defecto (mes actual)
  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    setFechaInicio(primerDia.toISOString().split('T')[0]);
    setFechaFin(ultimoDia.toISOString().split('T')[0]);
  }, []);

  const generarReporte = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Debe seleccionar ambas fechas');
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setError('La fecha de inicio debe ser menor o igual a la fecha final');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });

      const response = await fetch(`/api/reportes/facturas?${params.toString()}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setReporteData(result.data);
      } else {
        setError(result.message || 'Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const imprimirPDF = async () => {
    if (!reporteData) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/pdf/reporte-facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reporteData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-facturas-${fechaInicio}-${fechaFin}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError('Error al generar el PDF');
      }
    } catch (error) {
      console.error('Error al imprimir PDF:', error);
      setError('Error al generar el PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const obtenerColorEstado = (estado: string): { bg: string; text: string } => {
    if (estado === 'pagado') return { bg: '#e8f5e9', text: '#4caf50' };
    if (estado === 'pago_parcial') return { bg: '#fff3e0', text: '#ff9800' };
    return { bg: '#ffebee', text: '#f44336' };
  };

  const obtenerTextoEstado = (estado: string): string => {
    if (estado === 'pagado') return 'Pagado';
    if (estado === 'pago_parcial') return 'Pago Parcial';
    return 'Pendiente';
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>📄 Reporte de Facturas</h1>
        </div>

        {/* Filtros */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '16px', 
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(74, 144, 226, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            color: '#2c3e50',
            fontSize: '1.1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📅 Seleccionar Rango de Fechas
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600,
                color: '#2c3e50'
              }}>
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600,
                color: '#2c3e50'
              }}>
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={generarReporte}
              disabled={isLoading}
              style={{ 
                height: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center',
                padding: '0.875rem 2rem',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: isLoading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)'
              }}
            >
              {isLoading ? 'Generando...' : '📊 Generar Reporte'}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '8px',
              borderLeft: '4px solid #e74c3c',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Resultados */}
        {reporteData && (
          <>
            {/* Botón Imprimir PDF */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={imprimirPDF}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                }}
              >
                🖨️ Imprimir PDF
              </button>
            </div>

            {/* Cards de Totales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(74, 144, 226, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.95, marginBottom: '0.4rem', fontWeight: 500 }}>
                  Total Facturas
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {reporteData.totales.total_facturas}
                </div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.95, marginBottom: '0.4rem', fontWeight: 500 }}>
                  Facturas Pagadas
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {reporteData.totales.facturas_pagadas}
                </div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(255, 152, 0, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.95, marginBottom: '0.4rem', fontWeight: 500 }}>
                  Pago Parcial
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {reporteData.totales.facturas_pago_parcial}
                </div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(244, 67, 54, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.95, marginBottom: '0.4rem', fontWeight: 500 }}>
                  Facturas Pendientes
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {reporteData.totales.facturas_pendientes}
                </div>
              </div>
            </div>

            {/* Totales de montos */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem' }}>
                💰 Resumen de Montos
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Subtotal</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2c3e50' }}>
                    ¢{reporteData.totales.total_subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>IVA</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2c3e50' }}>
                    ¢{reporteData.totales.total_iva.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total General</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1E40AF' }}>
                    ¢{reporteData.totales.total_general.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de facturas */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Factura</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>SE</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Contrato</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Cliente</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Fecha</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Subtotal</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>IVA</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Total</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteData.facturas.map((factura, index) => {
                      const estadoColors = obtenerColorEstado(factura.estado_pago);
                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{factura.numero_factura}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{factura.numero_solicitud_equipo}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{factura.numero_contrato}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{factura.nombre_cliente}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                            {new Date(factura.fecha_emision).toLocaleDateString('es-CR')}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right' }}>
                            ¢{factura.monto_subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right' }}>
                            ¢{factura.monto_iva.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: 600 }}>
                            ¢{factura.monto_total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              backgroundColor: estadoColors.bg,
                              color: estadoColors.text,
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}>
                              {obtenerTextoEstado(factura.estado_pago)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReporteFacturas;
