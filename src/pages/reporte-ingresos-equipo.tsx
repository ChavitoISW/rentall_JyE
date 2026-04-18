import React, { useState, useEffect } from 'react';
import Menu from '../componentes/Menu';
import Footer from '../componentes/Footer';
import Spinner from '../componentes/Spinner';
import styles from '../styles/SolicitudEquipo.module.css';

interface EquipoIngreso {
  nombre_equipo: string;
  codigo_equipo: string;
  categoria: string;
  cantidad_contratos: number;
  monto_cobrado?: number;
  monto_pendiente?: number;
}

interface ReporteData {
  cobrado: EquipoIngreso[];
  pendiente: EquipoIngreso[];
  totales: {
    total_cobrado: number;
    total_pendiente: number;
  };
  rango: {
    fecha_inicio: string;
    fecha_fin: string;
  };
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

  const cardStyle = (color: string): React.CSSProperties => ({
    background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
    borderRadius: '12px',
    padding: '1.5rem',
    color: 'white',
    boxShadow: `0 4px 15px ${color}55`,
    minWidth: 0,
  });

  const tableContainer: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    overflow: 'hidden',
    border: '1px solid #e8ecf0',
  };

  const thStyle: React.CSSProperties = {
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontSize: '0.82rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#fff',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    borderBottom: '1px solid #f1f3f5',
    color: '#333',
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>💹 Recaudado por Equipo</h1>
        </div>

        {/* Filtros */}
        <div style={{
          background: 'white', padding: '1.75rem', borderRadius: '12px',
          marginBottom: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          border: '1px solid rgba(74,144,226,0.12)'
        }}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#2c3e50', fontWeight: 600 }}>
            📅 Rango de Fechas
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className={styles.searchInput}
                style={{ minWidth: '160px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className={styles.searchInput}
                style={{ minWidth: '160px' }}
              />
            </div>
            <button
              onClick={generarReporte}
              className={styles.btnSubmit}
              style={{ padding: '0.65rem 2rem', fontSize: '0.95rem' }}
            >
              Generar Reporte
            </button>
          </div>
          {error && <p style={{ color: '#e74c3c', marginTop: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}
        </div>

        {reporteData && (
          <>
            {/* Tarjetas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={cardStyle('#27ae60')}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.4rem' }}>Total Cobrado</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fmt(reporteData.totales.total_cobrado)}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.4rem' }}>{reporteData.cobrado.length} equipos</div>
              </div>
              <div style={cardStyle('#e67e22')}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.4rem' }}>Total Pendiente</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fmt(reporteData.totales.total_pendiente)}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.4rem' }}>{reporteData.pendiente.length} equipos</div>
              </div>
              <div style={cardStyle('#4a90e2')}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.4rem' }}>Total General</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fmt(reporteData.totales.total_cobrado + reporteData.totales.total_pendiente)}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.4rem' }}>
                  {new Date(reporteData.rango.fecha_inicio + 'T00:00:00').toLocaleDateString('es-CR')} —{' '}
                  {new Date(reporteData.rango.fecha_fin + 'T00:00:00').toLocaleDateString('es-CR')}
                </div>
              </div>
            </div>

            {/* Tablas en dos columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>

              {/* Cobrado */}
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#27ae60', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✅ Ya Cobrado
                </h2>
                <div style={tableContainer}>
                  {reporteData.cobrado.length === 0 ? (
                    <p style={{ padding: '1.5rem', textAlign: 'center', color: '#999' }}>Sin registros</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }}>
                          <th style={thStyle}>Equipo</th>
                          <th style={thStyle}>Categoría</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Contratos</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Monto Cobrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteData.cobrado.map((row, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: '#2c3e50' }}>{row.nombre_equipo}</div>
                              {row.codigo_equipo && <div style={{ fontSize: '0.78rem', color: '#999' }}>{row.codigo_equipo}</div>}
                            </td>
                            <td style={tdStyle}><span style={{ background: '#e8f5e9', color: '#27ae60', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{row.categoria}</span></td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{row.cantidad_contratos}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#27ae60' }}>{fmt(row.monto_cobrado ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#e8f5e9' }}>
                          <td colSpan={3} style={{ ...tdStyle, fontWeight: 700, color: '#27ae60' }}>TOTAL</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#27ae60', fontSize: '1rem' }}>{fmt(reporteData.totales.total_cobrado)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>

              {/* Pendiente */}
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e67e22', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⏳ Pendiente de Cobrar
                </h2>
                <div style={tableContainer}>
                  {reporteData.pendiente.length === 0 ? (
                    <p style={{ padding: '1.5rem', textAlign: 'center', color: '#999' }}>Sin pendientes</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' }}>
                          <th style={thStyle}>Equipo</th>
                          <th style={thStyle}>Categoría</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Contratos</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Monto Pendiente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteData.pendiente.map((row, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f3' }}>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: '#2c3e50' }}>{row.nombre_equipo}</div>
                              {row.codigo_equipo && <div style={{ fontSize: '0.78rem', color: '#999' }}>{row.codigo_equipo}</div>}
                            </td>
                            <td style={tdStyle}><span style={{ background: '#fff3e0', color: '#e67e22', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{row.categoria}</span></td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{row.cantidad_contratos}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#e67e22' }}>{fmt(row.monto_pendiente ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#fff3e0' }}>
                          <td colSpan={3} style={{ ...tdStyle, fontWeight: 700, color: '#e67e22' }}>TOTAL</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#e67e22', fontSize: '1rem' }}>{fmt(reporteData.totales.total_pendiente)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReporteIngresosEquipo;
