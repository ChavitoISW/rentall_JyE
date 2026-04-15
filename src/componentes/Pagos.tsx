import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import styles from '../styles/SolicitudEquipo.module.css';
import Spinner from './Spinner';

interface Pago {
  id_pago_contrato: number;
  id_contrato: number;
  tipo_pago: 'efectivo' | 'simpe' | 'transferencia';
  monto: number;
  fecha_pago: string;
  numero_comprobante?: string;
  banco?: string;
  numero_transferencia?: string;
  observaciones?: string;
  numero_contrato?: string;
  numero_solicitud_equipo?: string;
  nombre_cliente?: string;
  created_at?: string;
}

interface PagosPorTipo {
  efectivo: Pago[];
  simpe: Pago[];
  transferencia: Pago[];
}

interface Totales {
  efectivo: number;
  simpe: number;
  transferencia: number;
  total: number;
}

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosPorTipo, setPagosPorTipo] = useState<PagosPorTipo>({
    efectivo: [],
    simpe: [],
    transferencia: []
  });
  const [totales, setTotales] = useState<Totales>({
    efectivo: 0,
    simpe: 0,
    transferencia: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    setIsLoading(true);
    setError('');

    try {
      let url = '/api/pagos';
      if (fechaInicio && fechaFin) {
        url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setPagos(result.data.todos);
        setPagosPorTipo(result.data.porTipo);
        setTotales(result.data.totales);
      } else {
        setError(result.error || 'Error al cargar pagos');
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (fechaInicio && fechaFin) {
      if (fechaInicio > fechaFin) {
        setError('La fecha de inicio no puede ser mayor a la fecha fin');
        return;
      }
    }
    cargarPagos();
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    cargarPagos();
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(monto);
  };

  // Formatear fecha sin depender del locale del navegador
  // Formato: dd/mm/yyyy
  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    
    const fechaParte = fecha.includes('T') ? fecha.split('T')[0] : fecha.split(' ')[0];
    const partes = fechaParte.split('-');
    
    if (partes.length !== 3) return fecha;
    
    const [year, month, day] = partes;
    const dayStr = day.padStart(2, '0');
    const monthStr = month.padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  };

  const getTipoPagoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      simpe: 'SIMPE Móvil',
      transferencia: 'Transferencia'
    };
    return labels[tipo] || tipo;
  };

  const getTipoPagoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      efectivo: '💵',
      simpe: '📱',
      transferencia: '🏦'
    };
    return icons[tipo] || '💰';
  };

  const imprimirPDF = async () => {
    setIsLoading(true);
    try {
      const reporteData = {
        todos: pagos,
        porTipo: pagosPorTipo,
        totales: totales,
        rango: fechaInicio && fechaFin ? {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        } : undefined
      };

      const response = await fetch('/api/pdf/reporte-pagos', {
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
        link.download = `reporte-pagos-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const descargarExcel = async () => {
    setIsLoading(true);
    try {
      const reporteData = {
        todos: pagos,
        totales: totales
      };

      const response = await fetch('/api/excel/reporte-pagos', {
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
        link.download = `reporte-pagos-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError('Error al generar el archivo Excel');
      }
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      setError('Error al generar el archivo Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTablaPagos = (tipo: 'efectivo' | 'simpe' | 'transferencia', titulo: string, icon: string) => {
    const pagosDelTipo = pagosPorTipo[tipo];
    
    if (pagosDelTipo.length === 0) {
      return null;
    }

    return (
      <div className={styles.tableSection} key={tipo}>
        <h2 className={styles.sectionTitle}>{icon} {titulo} <span className={styles.countBadge}>({pagosDelTipo.length} pagos)</span></h2>
        
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Contrato</th>
                <th>Monto</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {pagosDelTipo.map((pago) => (
                <tr key={pago.id_pago_contrato}>
                  <td>{formatearFecha(pago.fecha_pago)}</td>
                  <td>{pago.nombre_cliente || 'N/A'}</td>
                  <td>{pago.numero_contrato || 'N/A'}</td>
                  <td><strong>{formatearMoneda(pago.monto)}</strong></td>
                  <td>
                    {tipo === 'simpe' && pago.numero_comprobante && (
                      <div>🔢 {pago.numero_comprobante}</div>
                    )}
                    {tipo === 'transferencia' && (
                      <div>
                        {pago.banco && `🏦 ${pago.banco}`}
                        {pago.numero_transferencia && ` - ${pago.numero_transferencia}`}
                      </div>
                    )}
                    {pago.observaciones && (
                      <div style={{color: '#666', fontSize: '0.9em', marginTop: '0.25rem'}}>{pago.observaciones}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>📊 Reporte de Pagos</h1>
        </div>

        {/* Filtros */}
        <div className={styles.filterSection}>
          <form onSubmit={handleFiltrar} className={styles.filterForm}>
            <div className={styles.filterGroup}>
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterActions}>
              <button type="submit" className={styles.btnView}>
                🔍 Filtrar
              </button>
              <button type="button" onClick={limpiarFiltros} className={styles.btnEdit}>
                🔄 Limpiar
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* Botones de exportación */}
        {pagos.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end', 
            marginBottom: '1.5rem' 
          }}>
            <button
              onClick={imprimirPDF}
              className={styles.btnView}
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
            <button
              onClick={descargarExcel}
              className={styles.btnView}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)'
              }}
            >
              📊 Descargar Excel
            </button>
          </div>
        )}

        {/* Resumen de Totales */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💵</div>
            <div className={styles.statInfo}>
              <h3>Efectivo</h3>
              <p className={styles.statValue}>{formatearMoneda(totales.efectivo)}</p>
              <span className={styles.statLabel}>{pagosPorTipo.efectivo.length} pagos</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📱</div>
            <div className={styles.statInfo}>
              <h3>SIMPE Móvil</h3>
              <p className={styles.statValue}>{formatearMoneda(totales.simpe)}</p>
              <span className={styles.statLabel}>{pagosPorTipo.simpe.length} pagos</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏦</div>
            <div className={styles.statInfo}>
              <h3>Transferencia</h3>
              <p className={styles.statValue}>{formatearMoneda(totales.transferencia)}</p>
              <span className={styles.statLabel}>{pagosPorTipo.transferencia.length} pagos</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardTotal}`}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statInfo}>
              <h3>Total General</h3>
              <p className={styles.statValue}>{formatearMoneda(totales.total)}</p>
              <span className={styles.statLabel}>{pagos.length} pagos</span>
            </div>
          </div>
        </div>

        {/* Tablas de Pagos por Tipo */}
        {pagos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>📭 No hay pagos para mostrar</p>
          </div>
        ) : (
          <>
            {renderTablaPagos('efectivo', 'Pagos en Efectivo', '💵')}
            {renderTablaPagos('simpe', 'Pagos por SIMPE Móvil', '📱')}
            {renderTablaPagos('transferencia', 'Pagos por Transferencia', '🏦')}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Pagos;
