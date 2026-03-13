import React, { useState, useEffect } from 'react';
import Menu from '../componentes/Menu';
import styles from '../styles/SolicitudEquipo.module.css';

interface GananciaPorCategoria {
  categoria: string;
  total_ganancias: number;
  cantidad_contratos: number;
  cantidad_pagos: number;
}

interface Totales {
  total_general: number;
  total_contratos: number;
  total_pagos: number;
  saldos_pendientes: number;
  contratos_con_saldo: number;
}

interface ReporteData {
  ganancias: GananciaPorCategoria[];
  totales: Totales;
  rango: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

const Reportes: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [equipoFiltro, setEquipoFiltro] = useState<string>('todos');
  const [equipos, setEquipos] = useState<Array<{ nombre_equipo: string }>>([]);
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

  // Cargar lista de equipos consolidados
  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const response = await fetch('/api/equipo');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Extraer nombres únicos de equipos
          const nombresUnicos = Array.from(
            new Set(result.data.map((eq: any) => eq.nombre_equipo))
          ).map(nombre => ({ nombre_equipo: nombre as string }));
          setEquipos(nombresUnicos);
        }
      } catch (error) {
        console.error('Error al cargar equipos:', error);
      }
    };
    fetchEquipos();
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
      
      if (equipoFiltro !== 'todos') {
        params.append('nombre_equipo', equipoFiltro);
      }

      const response = await fetch(`/api/reportes/ganancias?${params.toString()}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setReporteData(result.data);
      } else {
        setError(result.error || 'Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const obtenerColorCategoria = (index: number): string => {
    const colores = [
      '#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', 
      '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
    ];
    return colores[index % colores.length];
  };

  return (
    <div className={styles.container}>
      <Menu />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>📊 Reportes de Ganancias</h1>
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
                className={styles.input}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4a90e2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
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
                className={styles.input}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4a90e2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
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
                Equipo
              </label>
              <select
                value={equipoFiltro}
                onChange={(e) => setEquipoFiltro(e.target.value)}
                className={styles.input}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4a90e2';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="todos">Todos los equipos</option>
                {equipos.map((equipo, index) => (
                  <option key={index} value={equipo.nombre_equipo}>
                    {equipo.nombre_equipo}
                  </option>
                ))}
              </select>
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
                boxShadow: isLoading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
                transform: isLoading ? 'none' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(74, 144, 226, 0.3)',
                    borderTopColor: '#4a90e2',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Generando...
                </>
              ) : (
                <>📈 Generar Reporte</>
              )}
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
            {/* Cards de Totales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              marginBottom: '2.5rem'
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(74, 144, 226, 0.25)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(74, 144, 226, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(74, 144, 226, 0.25)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  fontSize: '5rem',
                  opacity: 0.1
                }}>💰</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.95, 
                  marginBottom: '0.4rem',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  Total de Ganancias
                </div>
                <div style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.15rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  ₡{reporteData.totales.total_general.toLocaleString()}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    fontSize: '0.8rem'
                  }}>
                    📊 Período Actual
                  </span>
                </div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(46, 204, 113, 0.25)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(46, 204, 113, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 204, 113, 0.25)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  fontSize: '5rem',
                  opacity: 0.1
                }}>📄</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.95, 
                  marginBottom: '0.4rem',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  Total de Contratos
                </div>
                <div style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.15rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {reporteData.totales.total_contratos}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    fontSize: '0.8rem'
                  }}>
                    ✅ Activos
                  </span>
                </div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                color: 'white',
                padding: '1.25rem', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(243, 156, 18, 0.25)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(243, 156, 18, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(243, 156, 18, 0.25)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  fontSize: '5rem',
                  opacity: 0.1
                }}>💳</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.95, 
                  marginBottom: '0.4rem',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  Saldos Pendientes
                </div>
                <div style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.15rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  ₡{reporteData.totales.saldos_pendientes.toLocaleString()}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    fontSize: '0.8rem'
                  }}>
                    ⏳ {reporteData.totales.contratos_con_saldo} Contratos
                  </span>
                </div>
              </div>
            </div>

            {/* Tabla de Ganancias por Categoría */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(74, 144, 226, 0.1)'
            }}>
              <div style={{
                padding: '2rem',
                borderBottom: '2px solid #f0f0f0',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
              }}>
                <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem', fontWeight: 600 }}>
                  📊 Ganancias por Categoría de Equipo
                </h2>
                <p style={{ margin: '0.75rem 0 0 0', color: '#7f8c8d', fontSize: '0.95rem' }}>
                  Período: {new Date(reporteData.rango.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} - {new Date(reporteData.rango.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {reporteData.ganancias.length === 0 ? (
                <div style={{ 
                  padding: '4rem', 
                  textAlign: 'center',
                  color: '#95a5a6'
                }}>
                  <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                  <p style={{ margin: '0', fontSize: '1.2rem', fontWeight: 500, color: '#7f8c8d' }}>
                    No hay datos para el rango de fechas seleccionado
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#bdc3c7' }}>
                    Intenta seleccionar un período diferente
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', padding: '1rem' }}>
                  <table className={styles.table} style={{ marginBottom: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ width: '40%', padding: '1rem', color: '#2c3e50', fontWeight: 600 }}>Categoría</th>
                        <th style={{ width: '25%', textAlign: 'right', padding: '1rem', color: '#2c3e50', fontWeight: 600 }}>Ganancias</th>
                        <th style={{ width: '15%', textAlign: 'center', padding: '1rem', color: '#2c3e50', fontWeight: 600 }}>Contratos</th>
                        <th style={{ width: '15%', textAlign: 'center', padding: '1rem', color: '#2c3e50', fontWeight: 600 }}>Pagos</th>
                        <th style={{ width: '5%', padding: '1rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteData.ganancias.map((item, index) => {
                        const porcentaje = ((item.total_ganancias / reporteData.totales.total_general) * 100).toFixed(1);
                        const color = obtenerColorCategoria(index);
                        
                        return (
                          <tr key={index} style={{
                            transition: 'all 0.2s',
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.transform = 'scale(1.01)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          >
                            <td style={{ padding: '1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: color,
                                  boxShadow: `0 0 8px ${color}40`
                                }} />
                                <span style={{ fontWeight: 600, fontSize: '1rem', color: '#2c3e50' }}>{item.categoria}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', padding: '1.25rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: color, marginBottom: '0.25rem' }}>
                                ₡{item.total_ganancias.toLocaleString()}
                              </div>
                              <div style={{ 
                                fontSize: '0.85rem', 
                                color: '#7f8c8d',
                                padding: '0.25rem 0.5rem',
                                background: '#ecf0f1',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                {porcentaje}% del total
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '1.25rem' }}>
                              <span style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                color: '#1565c0',
                                borderRadius: '25px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(21, 101, 192, 0.2)'
                              }}>
                                {item.cantidad_contratos}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '1.25rem' }}>
                              <span style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                                color: '#6a1b9a',
                                borderRadius: '25px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(106, 27, 154, 0.2)'
                              }}>
                                {item.cantidad_pagos}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem' }}>
                              <div style={{
                                width: '100%',
                                height: '6px',
                                background: '#ecf0f1',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${porcentaje}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                                  transition: 'width 0.5s ease',
                                  boxShadow: `0 0 8px ${color}60`
                                }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reportes;
