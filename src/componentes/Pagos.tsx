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

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
