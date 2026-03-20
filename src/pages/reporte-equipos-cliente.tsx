import React, { useState, useEffect, useRef } from 'react';
import Menu from '../componentes/Menu';
import Footer from '../componentes/Footer';
import Spinner from '../componentes/Spinner';
import styles from '../styles/SolicitudEquipo.module.css';

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  apellidos_cliente: string;
  documento_identidad_cliente: string;
  estado_cliente?: number | boolean;
}

interface Equipo {
  id_equipo: number;
  nombre_equipo: string;
  cantidad_equipo: number;
  periodicidad: number;
  cantidad_periodicidad: number;
  fecha_devolucion: string;
  monto_final: number;
}

interface Contrato {
  id_contrato: number;
  numero_contrato: string;
  numero_solicitud_equipo: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado_contrato: number;
  estado_equipo: string;
  numero_hoja_ruta?: string;
  conductor?: string;
  vehiculo?: string;
  equipos: Equipo[];
}

interface ClienteReporte {
  id_cliente: number;
  nombre_completo_cliente: string;
  documento_identidad_cliente: string;
  contratos: Contrato[];
}

interface Estadisticas {
  total_clientes: number;
  total_contratos: number;
  total_equipos: number;
  contratos_activos: number;
  en_ruta_entrega: number;
  en_ruta_recoleccion: number;
}

const ReporteEquiposCliente: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteFiltro, setClienteFiltro] = useState<number>(0);
  const [clienteSearchTerm, setClienteSearchTerm] = useState<string>('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteDropdownRef = useRef<HTMLDivElement>(null);
  const [reporteData, setReporteData] = useState<ClienteReporte[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [error, setError] = useState('');
  const [expandedClientes, setExpandedClientes] = useState<Set<number>>(new Set());
  const [expandedContratos, setExpandedContratos] = useState<Set<number>>(new Set());

  // Función para cargar clientes
  const fetchClientes = async () => {
    try {
      setIsLoadingClientes(true);
      console.log('📥 Cargando clientes...');
      const response = await fetch('/api/cliente');
      const result = await response.json();
      
      console.log('📊 Respuesta de clientes:', result);
      console.log('📊 Total de clientes recibidos:', result.data?.length || 0);
      
      if (result.success && Array.isArray(result.data)) {
        console.log('✅ Clientes válidos:', result.data.length);
        
        // Mostrar todos los clientes (el modelo ya filtra por activos con boolean true)
        const clientesActivos = result.data.filter((c: any) => {
          const activo = c.estado_cliente === true || c.estado_cliente === 1;
          console.log(`🔍 Cliente: ${c.nombre_cliente}, Estado:`, c.estado_cliente, '→ Activo:', activo);
          return activo;
        });
        
        console.log('👥 Clientes activos después del filtro:', clientesActivos.length);
        
        // Si no hay clientes activos, mostrar todos para debug
        if (clientesActivos.length === 0 && result.data.length > 0) {
          console.warn('⚠️ No hay clientes activos, mostrando todos para debug');
          setClientes(result.data);
        } else {
          // Ordenar alfabéticamente por nombre
          clientesActivos.sort((a: any, b: any) => {
            const nombreA = `${a.nombre_cliente} ${a.apellidos_cliente}`.toLowerCase();
            const nombreB = `${b.nombre_cliente} ${b.apellidos_cliente}`.toLowerCase();
            return nombreA.localeCompare(nombreB);
          });
          
          setClientes(clientesActivos);
          console.log('✅ Clientes cargados en el estado:', clientesActivos.length);
        }
      } else {
        console.error('❌ Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('❌ Error al cargar clientes:', error);
    } finally {
      setIsLoadingClientes(false);
    }
  };

  // Cargar lista de clientes al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

  // Generar reporte automáticamente cuando se cambia el filtro
  useEffect(() => {
    if (clientes.length > 0 || clienteFiltro === 0) {
      generarReporte();
    }
  }, [clienteFiltro]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };

    if (showClienteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClienteDropdown]);

  const generarReporte = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      
      if (clienteFiltro !== 0) {
        params.append('id_cliente', String(clienteFiltro));
        console.log('🔍 Filtrando por cliente ID:', clienteFiltro);
      } else {
        console.log('📋 Mostrando todos los clientes');
      }

      console.log('📡 URL:', `/api/reportes/equipos-cliente?${params.toString()}`);
      const response = await fetch(`/api/reportes/equipos-cliente?${params.toString()}`);
      const result = await response.json();

      console.log('📊 Resultado:', result);

      if (response.ok && result.success) {
        const reporteRecibido = result.data.reporte || [];
        setReporteData(reporteRecibido);
        setEstadisticas(result.data.estadisticas || null);
        
        console.log('✅ Reporte generado:', reporteRecibido.length, 'clientes');
        console.log('📦 Datos del reporte:', reporteRecibido);
        
        // Si hay un solo cliente, expandirlo automáticamente
        if (reporteRecibido.length === 1) {
          const clienteId = reporteRecibido[0].id_cliente;
          setExpandedClientes(new Set([clienteId]));
          console.log('🔓 Auto-expandiendo cliente:', clienteId, reporteRecibido[0].nombre_completo_cliente);
        } else if (reporteRecibido.length > 0) {
          // Si hay múltiples clientes, resetear expansión
          setExpandedClientes(new Set());
          setExpandedContratos(new Set());
          console.log('🔄 Reseteo de expansión - Tienes', reporteRecibido.length, 'clientes, haz clic para expandir');
        } else {
          console.log('⚠️ No hay datos para mostrar');
        }
      } else {
        setError(result.error || 'Error al generar el reporte');
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCliente = (idCliente: number) => {
    const newExpanded = new Set(expandedClientes);
    if (newExpanded.has(idCliente)) {
      newExpanded.delete(idCliente);
    } else {
      newExpanded.add(idCliente);
    }
    setExpandedClientes(newExpanded);
  };

  const toggleContrato = (idContrato: number) => {
    const newExpanded = new Set(expandedContratos);
    if (newExpanded.has(idContrato)) {
      newExpanded.delete(idContrato);
    } else {
      newExpanded.add(idContrato);
    }
    setExpandedContratos(newExpanded);
  };

  const expandirTodos = () => {
    const todosClientes = new Set(reporteData.map(c => c.id_cliente));
    const todosContratos = new Set<number>();
    reporteData.forEach(cliente => {
      cliente.contratos.forEach(contrato => {
        todosContratos.add(contrato.id_contrato);
      });
    });
    setExpandedClientes(todosClientes);
    setExpandedContratos(todosContratos);
  };

  const contraerTodos = () => {
    setExpandedClientes(new Set());
    setExpandedContratos(new Set());
  };

  // Funciones para manejar selección de cliente
  const filteredClientes = clientes.filter(cliente =>
    clienteSearchTerm === '' ||
    cliente.nombre_cliente.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    cliente.apellidos_cliente.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    cliente.documento_identidad_cliente.toLowerCase().includes(clienteSearchTerm.toLowerCase())
  );

  const handleSelectCliente = (cliente: Cliente) => {
    setClienteFiltro(cliente.id_cliente);
    setClienteSearchTerm(`${cliente.nombre_cliente} ${cliente.apellidos_cliente}`);
    setShowClienteDropdown(false);
  };

  const getClienteNombre = (id: number) => {
    if (id === 0) return '';
    const cliente = clientes.find(c => c.id_cliente === id);
    return cliente ? `${cliente.nombre_cliente} ${cliente.apellidos_cliente}` : '';
  };

  const getEstadoClase = (estado: string) => {
    switch (estado) {
      case 'Contrato Activo':
        return styles.statusActive;
      case 'En Ruta de Entrega':
        return styles.statusPending;
      case 'En Ruta de Recolección':
        return styles.statusWarning;
      default:
        return '';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Contrato Activo':
        return '✅';
      case 'En Ruta de Entrega':
        return '🚚';
      case 'En Ruta de Recolección':
        return '📦';
      default:
        return '📋';
    }
  };

  const formatPeriodicidad = (periodicidad: number) => {
    const labels: Record<number, string> = {
      1: 'Día',
      7: 'Semana',
      15: 'Quincena',
      30: 'Mes'
    };
    return labels[periodicidad] || 'N/A';
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CR');
  };

  const imprimirReporte = () => {
    window.print();
  };

  const exportarCSV = () => {
    let csv = 'Cliente,Documento,Contrato,Solicitud,Estado,Equipo,Cantidad,Periodicidad,Fecha Devolución,Monto\n';
    
    reporteData.forEach(cliente => {
      cliente.contratos.forEach(contrato => {
        contrato.equipos.forEach(equipo => {
          csv += `"${cliente.nombre_completo_cliente}",`;
          csv += `"${cliente.documento_identidad_cliente}",`;
          csv += `"${contrato.numero_contrato || '-'}",`;
          csv += `"${contrato.numero_solicitud_equipo}",`;
          csv += `"${contrato.estado_equipo}",`;
          csv += `"${equipo.nombre_equipo}",`;
          csv += `"${equipo.cantidad_equipo}",`;
          csv += `"${formatPeriodicidad(equipo.periodicidad)}",`;
          csv += `"${formatFecha(equipo.fecha_devolucion)}",`;
          csv += `"${equipo.monto_final ? equipo.monto_final.toFixed(2) : '0.00'}"\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_equipos_cliente_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.pageContainer}>
      <Menu />
      <div className={styles.container} style={{ padding: '2rem 3rem' }}>
        <div className={styles.reportHeader}>
          <div className={styles.reportHeaderContent}>
            <h1 className={styles.title}>📊 Reporte de Equipos por Cliente</h1>
            <p className={styles.subtitle}>Visualización detallada de equipos asignados por contrato y estado</p>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup} style={{ alignItems: 'flex-start' }}>
            <label htmlFor="clienteFiltro" className={styles.label}>
              🔍 Cliente:
            </label>
            <div style={{ flex: 1, position: 'relative', width: '100%' }} ref={clienteDropdownRef}>
              <input
                type="text"
                value={clienteSearchTerm}
                onChange={(e) => {
                  setClienteSearchTerm(e.target.value);
                  setShowClienteDropdown(true);
                }}
                onClick={() => {
                  if (clienteFiltro !== 0) {
                    setClienteSearchTerm('');
                    setClienteFiltro(0);
                  }
                  setShowClienteDropdown(true);
                }}
                onFocus={() => setShowClienteDropdown(true)}
                placeholder={clienteFiltro === 0 ? "🔎 Buscar cliente por nombre o documento..." : ""}
                disabled={isLoadingClientes}
                style={{ 
                  width: '100%',
                  padding: '0.8rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s',
                  cursor: isLoadingClientes ? 'not-allowed' : 'pointer',
                  background: isLoadingClientes ? '#f0f0f0' : 'white'
                }}
              />
              {showClienteDropdown && filteredClientes.length > 0 && (
                <div className={styles.dropdown} style={{ maxHeight: '400px', left: 0, right: 0 }}>
                  {clienteFiltro !== 0 && (
                    <div
                      className={styles.dropdownItem}
                      onClick={() => {
                        setClienteFiltro(0);
                        setClienteSearchTerm('');
                        setShowClienteDropdown(false);
                      }}
                      style={{ 
                        fontWeight: 'bold', 
                        background: '#f0f8ff',
                        borderBottom: '1px solid #ddd',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📋 Todos los clientes ({clientes.length})
                    </div>
                  )}
                  {filteredClientes.map(c => (
                    <div
                      key={c.id_cliente}
                      className={styles.dropdownItem}
                      onClick={() => handleSelectCliente(c)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      👤 {c.nombre_cliente} {c.apellidos_cliente} - 📄 {c.documento_identidad_cliente}
                    </div>
                  ))}
                </div>
              )}
              {clienteSearchTerm && filteredClientes.length === 0 && showClienteDropdown && (
                <div className={styles.dropdown} style={{ maxHeight: '400px', left: 0, right: 0 }}>
                  <div className={styles.dropdownItem} style={{ color: '#666', fontStyle: 'italic' }}>
                    No se encontraron clientes con "{clienteSearchTerm}"
                  </div>
                </div>
              )}
            </div>
            
            {clientes.length === 0 && !isLoadingClientes && (
              <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: '#f57c00',
                  fontWeight: 500 
                }}>
                  ⚠️ No hay clientes activos disponibles
                </span>
                <button 
                  onClick={fetchClientes}
                  className={styles.btnSecondary}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  🔄 Recargar
                </button>
              </div>
            )}
          </div>

          {clienteFiltro !== 0 && (
            <div className={styles.filterInfo}>
              ℹ️ Mostrando resultados para: <strong>{getClienteNombre(clienteFiltro)}</strong>
            </div>
          )}

          <div className={styles.filterActions}>
            <button onClick={expandirTodos} className={styles.btnSecondary}>
              ➕ Expandir Todos
            </button>
            <button onClick={contraerTodos} className={styles.btnSecondary}>
              ➖ Contraer Todos
            </button>
            <button onClick={imprimirReporte} className={styles.btnInfo}>
              🖨️ Imprimir
            </button>
            <button onClick={exportarCSV} className={styles.btnSuccess}>
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            ❌ {error}
          </div>
        )}

        {/* Estadísticas */}
        {estadisticas && (
          <div className={styles.statsContainer}>
            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Clientes</div>
                <div className={styles.statValue}>{estadisticas.total_clientes}</div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardPurple}`}>
              <div className={styles.statIcon}>📄</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Contratos</div>
                <div className={styles.statValue}>{estadisticas.total_contratos}</div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardOrange}`}>
              <div className={styles.statIcon}>🔧</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Equipos</div>
                <div className={styles.statValue}>{estadisticas.total_equipos}</div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Contratos Activos</div>
                <div className={styles.statValue}>{estadisticas.contratos_activos}</div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardYellow}`}>
              <div className={styles.statIcon}>🚚</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>En Ruta Entrega</div>
                <div className={styles.statValue}>{estadisticas.en_ruta_entrega}</div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardRed}`}>
              <div className={styles.statIcon}>📦</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>En Ruta Recolección</div>
                <div className={styles.statValue}>{estadisticas.en_ruta_recoleccion}</div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <Spinner />
        ) : reporteData.length === 0 ? (
          <div className={styles.noData}>
            📂 No hay equipos en los estados seleccionados para el filtro aplicado.
            {clienteFiltro !== 0 && (
              <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
                El cliente seleccionado no tiene contratos activos o en ruta.
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ 
              background: 'white', 
              padding: '1rem 1.5rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>📊 Mostrando:</strong> {reporteData.length} cliente{reporteData.length !== 1 ? 's' : ''}
                {' con un total de '}
                {reporteData.reduce((sum, c) => sum + c.contratos.length, 0)} contrato{reporteData.reduce((sum, c) => sum + c.contratos.length, 0) !== 1 ? 's' : ''}
              </div>
              {reporteData.length > 1 && (
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  💡 Haz clic en las tarjetas para expandir/contraer
                </div>
              )}
            </div>
            <div className={styles.reporteContainer}>
            {reporteData.map((cliente) => (
              <div key={cliente.id_cliente} className={styles.clienteCard}>
                <div 
                  className={styles.clienteHeader}
                  onClick={() => toggleCliente(cliente.id_cliente)}
                >
                  <div className={styles.clienteHeaderLeft}>
                    <span className={styles.toggleIcon}>
                      {expandedClientes.has(cliente.id_cliente) ? '▼' : '▶'}
                    </span>
                    <div className={styles.clienteAvatar}>👤</div>
                    <div className={styles.clienteInfo}>
                      <h3>{cliente.nombre_completo_cliente}</h3>
                      <p className={styles.clienteDoc}>
                        <span className={styles.docBadge}>📇 {cliente.documento_identidad_cliente}</span>
                      </p>
                    </div>
                  </div>
                  <div className={styles.clienteBadge}>
                    <span className={styles.contractCount}>{cliente.contratos.length}</span>
                    <span className={styles.contractLabel}>Contrato{cliente.contratos.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {expandedClientes.has(cliente.id_cliente) && (
                  <div className={styles.contratosContainer}>
                    {cliente.contratos.map((contrato) => (
                      <div key={contrato.id_contrato} className={styles.contratoCard}>
                        <div 
                          className={styles.contratoHeader}
                          onClick={() => toggleContrato(contrato.id_contrato)}
                        >
                          <span className={styles.toggleIcon}>
                            {expandedContratos.has(contrato.id_contrato) ? '▼' : '▶'}
                          </span>
                          <div className={styles.contratoInfo}>
                            <div className={styles.contratoTitulo}>
                              <span className={styles.contratoNumero}>
                                📋 {contrato.numero_contrato || 'N/A'}
                              </span>
                              <span className={styles.seNumero}>
                                🔖 SE: {contrato.numero_solicitud_equipo}
                              </span>
                              <span className={`${styles.estadoBadge} ${getEstadoClase(contrato.estado_equipo)}`}>
                                {getEstadoIcon(contrato.estado_equipo)} {contrato.estado_equipo}
                              </span>
                            </div>
                            {contrato.numero_hoja_ruta && (
                              <div className={styles.hojaRutaInfo}>
                                <span className={styles.hrBadge}>🗺️ HR: {contrato.numero_hoja_ruta}</span>
                                {contrato.conductor && (
                                  <span className={styles.conductorBadge}>👨‍✈️ {contrato.conductor}</span>
                                )}
                                {contrato.vehiculo && (
                                  <span className={styles.vehiculoBadge}>🚗 {contrato.vehiculo}</span>
                                )}
                              </div>
                            )}
                            <div className={styles.fechasContrato}>
                              <span className={styles.fechaBadge}>📅 {formatFecha(contrato.fecha_inicio)}</span>
                              <span className={styles.fechaSeparator}>→</span>
                              <span className={styles.fechaBadge}>🏁 {formatFecha(contrato.fecha_vencimiento)}</span>
                            </div>
                          </div>
                        </div>

                        {expandedContratos.has(contrato.id_contrato) && (
                          <div className={styles.equiposTable}>
                            <table>
                              <thead>
                                <tr>
                                  <th>🔧 Equipo</th>
                                  <th>📊 Cantidad</th>
                                  <th>⏱️ Periodicidad</th>
                                  <th>🔢 Periodos</th>
                                  <th>📆 Fecha Devolución</th>
                                  <th>💰 Monto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {contrato.equipos.map((equipo, idx) => (
                                  <tr key={`${equipo.id_equipo}-${idx}`}>
                                    <td className={styles.equipoNombre}>{equipo.nombre_equipo}</td>
                                    <td><span className={styles.cantidadBadge}>{equipo.cantidad_equipo}</span></td>
                                    <td><span className={styles.periodicidadBadge}>{formatPeriodicidad(equipo.periodicidad)}</span></td>
                                    <td>{equipo.cantidad_periodicidad}</td>
                                    <td><span className={styles.fechaCell}>{formatFecha(equipo.fecha_devolucion)}</span></td>
                                    <td className={styles.montoCell}>₡{equipo.monto_final ? equipo.monto_final.toLocaleString('es-CR', { minimumFractionDigits: 2 }) : '0.00'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ReporteEquiposCliente;
