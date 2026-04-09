import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';
import styles from '../styles/SolicitudEquipo.module.css';

interface Empleado {
  id_empleado: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  fecha_ingreso: string;
  fecha_salida?: string;
  estado?: number;
}

interface ResumenVacaciones {
  id_empleado: number;
  nombre_completo: string;
  dias_acumulados: number;
  dias_usados: number;
  dias_disponibles: number;
  solicitudes: SolicitudVacacion[];
}

interface SolicitudVacacion {
  id_solicitud_vacaciones: number;
  fecha_solicitud: string;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_dias: number;
  estado: string;
  observaciones?: string;
}

const ReporteVacaciones: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [reporteData, setReporteData] = useState<ResumenVacaciones[]>([]);
  const [filteredData, setFilteredData] = useState<ResumenVacaciones[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Función para formatear fecha sin ajuste de zona horaria
  // Formato: dd/mm/yyyy
  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '-';
    
    // Extraer solo la parte de la fecha (antes de 'T' o espacio)
    const fechaParte = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr.split(' ')[0];
    const partes = fechaParte.split('-');
    
    if (partes.length !== 3) return fechaStr; // Retornar original si no tiene el formato esperado
    
    const [year, month, day] = partes;
    // Asegurar que día y mes tengan 2 dígitos
    const dayStr = day.padStart(2, '0');
    const monthStr = month.padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  };

  useEffect(() => {
    if (usuario && usuario.usuario_rol !== 1) {
      router.push('/');
      return;
    }
  }, [usuario, router]);

  useEffect(() => {
    fetchReporte();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(reporteData);
    } else {
      const filtered = reporteData.filter(item => 
        item.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, reporteData]);

  const fetchReporte = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los empleados
      const empResponse = await fetch('/api/empleado');
      const empResult = await empResponse.json();
      const empleados: Empleado[] = Array.isArray(empResult.data) ? empResult.data : [];

      // Obtener todas las solicitudes
      const solResponse = await fetch('/api/solicitud-vacaciones');
      const solResult = await solResponse.json();
      const solicitudes = Array.isArray(solResult.data) ? solResult.data : [];

      // Para cada empleado, obtener su resumen
      const reportePromises = empleados.map(async (emp) => {
        try {
          const diasRes = await fetch(`/api/solicitud-vacaciones/empleado/${emp.id_empleado}`);
          const diasResult = await diasRes.json();

          // Filtrar solicitudes del empleado
          const solicitudesEmpleado = solicitudes.filter(
            (sol: any) => sol.id_empleado === emp.id_empleado
          );

          return {
            id_empleado: emp.id_empleado,
            nombre_completo: `${emp.nombre} ${emp.apellidos}`,
            dias_acumulados: diasResult.success ? diasResult.data.dias_acumulados : 0,
            dias_usados: diasResult.success ? diasResult.data.dias_usados : 0,
            dias_disponibles: diasResult.success ? diasResult.data.dias_disponibles : 0,
            solicitudes: solicitudesEmpleado.map((sol: any) => ({
              id_solicitud_vacaciones: sol.id_solicitud_vacaciones,
              fecha_solicitud: sol.fecha_solicitud,
              fecha_inicio: sol.fecha_inicio,
              fecha_fin: sol.fecha_fin,
              cantidad_dias: sol.cantidad_dias,
              estado: sol.estado,
              observaciones: sol.observaciones
            }))
          };
        } catch (error) {
          console.error(`Error al cargar datos para ${emp.nombre}:`, error);
          return {
            id_empleado: emp.id_empleado,
            nombre_completo: `${emp.nombre} ${emp.apellidos}`,
            dias_acumulados: 0,
            dias_usados: 0,
            dias_disponibles: 0,
            solicitudes: []
          };
        }
      });

      const reporte = await Promise.all(reportePromises);
      setReporteData(reporte);
      setFilteredData(reporte);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      setReporteData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: { [key: string]: { bg: string; text: string } } = {
      'pendiente': { bg: '#fff3cd', text: '#856404' },
      'aprobada': { bg: '#d4edda', text: '#155724' },
      'rechazada': { bg: '#f8d7da', text: '#721c24' }
    };
    const badge = badges[estado] || badges['pendiente'];
    return (
      <span style={{
        padding: '0.3rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        background: badge.bg,
        color: badge.text,
        textTransform: 'capitalize'
      }}>
        {estado}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Menu />
        <main className={styles.main}>
          <Spinner />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Menu />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>📊 Reporte de Vacaciones</h1>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
            Consolidado de días de vacaciones por empleado
          </p>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="🔍 Buscar empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {filteredData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            color: '#6c757d',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '1.2rem', margin: 0 }}>
              {searchTerm ? '❌ No se encontraron empleados' : '📋 No hay empleados registrados'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredData.map((item) => (
              <div
                key={item.id_empleado}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                {/* Header del empleado */}
                <div
                  onClick={() => toggleRow(item.id_empleado)}
                  style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: expandedRows.has(item.id_empleado) 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      {item.nombre_completo.split(' ')[0][0]}{item.nombre_completo.split(' ')[1]?.[0] || ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: expandedRows.has(item.id_empleado) ? 'white' : '#2c3e50'
                      }}>
                        {item.nombre_completo}
                      </h3>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.9rem',
                        color: expandedRows.has(item.id_empleado) ? 'rgba(255,255,255,0.9)' : '#7f8c8d'
                      }}>
                        {item.solicitudes.length} solicitud{item.solicitudes.length !== 1 ? 'es' : ''} registrada{item.solicitudes.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '2rem',
                    alignItems: 'center',
                    marginRight: '2rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        color: expandedRows.has(item.id_empleado) ? 'rgba(255,255,255,0.9)' : '#7f8c8d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Acumulados
                      </div>
                      <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: expandedRows.has(item.id_empleado) ? 'white' : '#9b59b6'
                      }}>
                        {item.dias_acumulados}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        color: expandedRows.has(item.id_empleado) ? 'rgba(255,255,255,0.9)' : '#7f8c8d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Usados
                      </div>
                      <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: expandedRows.has(item.id_empleado) ? 'white' : '#3498db'
                      }}>
                        {item.dias_usados}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        color: expandedRows.has(item.id_empleado) ? 'rgba(255,255,255,0.9)' : '#7f8c8d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Disponibles
                      </div>
                      <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: expandedRows.has(item.id_empleado) 
                          ? 'white' 
                          : item.dias_disponibles < 0 ? '#e74c3c' : '#27ae60'
                      }}>
                        {item.dias_disponibles}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '1.5rem',
                    color: expandedRows.has(item.id_empleado) ? 'white' : '#667eea',
                    transition: 'transform 0.3s ease',
                    transform: expandedRows.has(item.id_empleado) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </div>
                </div>

                {/* Detalle de solicitudes */}
                {expandedRows.has(item.id_empleado) && (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderTop: '2px solid #e0e0e0'
                  }}>
                    {item.solicitudes.length === 0 ? (
                      <p style={{
                        textAlign: 'center',
                        color: '#6c757d',
                        margin: 0,
                        padding: '1rem'
                      }}>
                        📋 No hay solicitudes de vacaciones registradas
                      </p>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gap: '1rem'
                      }}>
                        <h4 style={{
                          margin: '0 0 1rem 0',
                          fontSize: '1.1rem',
                          color: '#2c3e50',
                          borderBottom: '2px solid #667eea',
                          paddingBottom: '0.5rem'
                        }}>
                          📅 Solicitudes de Vacaciones
                        </h4>
                        {item.solicitudes.map((sol) => (
                          <div
                            key={sol.id_solicitud_vacaciones}
                            style={{
                              backgroundColor: 'white',
                              padding: '1rem',
                              borderRadius: '8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                              gap: '1rem',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                                Fecha Solicitud
                              </div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                {formatearFecha(sol.fecha_solicitud)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                                Inicio
                              </div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                {formatearFecha(sol.fecha_inicio)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                                Fin
                              </div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                {formatearFecha(sol.fecha_fin)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                                Días
                              </div>
                              <div style={{
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                color: '#667eea'
                              }}>
                                {sol.cantidad_dias}
                              </div>
                            </div>
                            <div>
                              {getEstadoBadge(sol.estado)}
                            </div>
                            {sol.observaciones && (
                              <div style={{
                                gridColumn: '1 / -1',
                                padding: '0.75rem',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '6px',
                                marginTop: '0.5rem'
                              }}>
                                <div style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                                  💬 Observaciones:
                                </div>
                                <div style={{ color: '#2c3e50', fontSize: '0.9rem' }}>
                                  {sol.observaciones}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReporteVacaciones;
