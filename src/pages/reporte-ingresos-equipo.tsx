import React, { useState, useEffect } from 'react';
import Menu from '../componentes/Menu';
import Footer from '../componentes/Footer';
import Spinner from '../componentes/Spinner';
import styles from '../styles/SolicitudEquipo.module.css';

interface CategoriaIngreso {
  categoria: string;
  cantidad_contratos: number;
  total_pagado: number;
}

interface ReporteData {
  categorias: CategoriaIngreso[];
  total: number;
  rango: { fecha_inicio: string; fecha_fin: string };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(n ?? 0);

const ReporteIngresosEquipo: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    setFechaInicio(primerDia.toISOString().split('T')[0]);
    setFechaFin(ultimoDia.toISOString().split('T')[0]);
  }, []);

  const generarReporte = async () => {
    if (!fechaInicio || !fechaFin) { setError('Debe seleccionar ambas fechas'); return; }
    if (new Date(fechaInicio) > new Date(fechaFin)) { setError('La fecha inicio debe ser menor o igual a la fecha fin'); return; }

    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      const response = await fetch(`/api/reportes/ingresos-equipo?${params}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setReporteData(result.data);
      } else {
        setError(result.error || 'Error al generar el reporte');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const thStyle: React.CSSProperties = {
    padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.82rem',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#fff', whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', fontSize: '0.9rem',
    borderBottom: '1px solid #f1f3f5', color: '#333',
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>💹 Recaudado por Categoría</h1>
        </div>

        {/* Filtros */}
        <div style={{ background: 'white', padding: '1.75rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(74,144,226,0.12)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#2c3e50', fontWeight: 600 }}>📅 Rango de Fechas</h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>Fecha Inicio</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={styles.searchInput} style={{ minWidth: '160px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>Fecha Fin</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={styles.searchInput} style={{ minWidth: '160px' }} />
            </div>
            <button onClick={generarReporte} className={styles.btnSubmit} style={{ padding: '0.65rem 2rem', fontSize: '0.95rem' }}>
              Generar Reporte
            </button>
          </div>
          {error && <p style={{ color: '#e74c3c', marginTop: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}
        </div>

        {reporteData && (
          <>
            {/* Tarjeta total */}
            <div style={{ background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)', borderRadius: '12px', padding: '1.5rem 2rem', marginBottom: '2rem', color: 'white', boxShadow: '0 4px 15px rgba(39,174,96,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Recaudado</div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{fmt(reporteData.total)}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
                  {new Date(reporteData.rango.fecha_inicio + 'T00:00:00').toLocaleDateString('es-CR')} —{' '}
                  {new Date(reporteData.rango.fecha_fin + 'T00:00:00').toLocaleDateString('es-CR')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{reporteData.categorias.length} categorías activas</div>
              </div>
            </div>

            {/* Tabla */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1px solid #e8ecf0', maxWidth: '700px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)' }}>
                    <th style={thStyle}>Categoría</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Contratos</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total Pagado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.categorias.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#2c3e50' }}>{row.categoria}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{row.cantidad_contratos}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#27ae60' }}>{fmt(row.total_pagado)}</td>
                    </tr>
                  ))}

                </tbody>
                <tfoot>
                  <tr style={{ background: '#e8f5e9' }}>
                    <td colSpan={2} style={{ ...tdStyle, fontWeight: 700, color: '#27ae60', fontSize: '1rem' }}>TOTAL RECAUDADO</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#27ae60', fontSize: '1.05rem' }}>{fmt(reporteData.total)}</td>
                  </tr>
                </tfoot>
              </table>
              {reporteData.categorias.length === 0 && (
                <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No hay pagos en este periodo</p>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReporteIngresosEquipo;
