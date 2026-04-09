import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/SolicitudEquipo.module.css';
import { ContratoConPago, PagoContrato, TipoPago, EstadoPagoContrato } from '../types/pagoContrato';

const ControlPagos: React.FC = () => {
  const { usuario } = useAuth();
  const [contratos, setContratos] = useState<ContratoConPago[]>([]);
  const [pagos, setPagos] = useState<PagoContrato[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalPagosOpen, setIsModalPagosOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string | 'todos'>('todos');
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoConPago | null>(null);

  const [currentPago, setCurrentPago] = useState<PagoContrato>({
    id_contrato: 0,
    tipo_pago: TipoPago.EFECTIVO,
    monto: 0,
    fecha_pago: new Date().toISOString().split('T')[0]
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  // Formatear fecha sin depender del locale del navegador
  // Formato: dd/mm/yyyy
  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    const fechaParte = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr.split(' ')[0];
    const partes = fechaParte.split('-');
    
    if (partes.length !== 3) return fechaStr;
    
    const [year, month, day] = partes;
    const dayStr = day.padStart(2, '0');
    const monthStr = month.padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  };

  useEffect(() => {
    fetchContratos();
  }, []);

  const fetchContratos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contrato/con-pagos');
      const result = await response.json();
      setContratos(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      setContratos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPagosContrato = async (id_contrato: number) => {
    try {
      const response = await fetch(`/api/pago-contrato?id_contrato=${id_contrato}`);
      const result = await response.json();
      setPagos(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setPagos([]);
    }
  };

  const handleRegistrarPago = (contrato: ContratoConPago) => {
    setContratoSeleccionado(contrato);
    setCurrentPago({
      id_contrato: contrato.id_contrato,
      tipo_pago: TipoPago.EFECTIVO,
      monto: contrato.monto_pendiente,
      fecha_pago: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleVerPagos = async (contrato: ContratoConPago) => {
    setContratoSeleccionado(contrato);
    await fetchPagosContrato(contrato.id_contrato);
    setIsModalPagosOpen(true);
  };

  const handleSubmitPago = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentPago.monto <= 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'El monto debe ser mayor a cero',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/pago-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPago)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConfirmDialog({
          isOpen: true,
          title: 'Éxito',
          message: 'Pago registrado exitosamente',
          type: 'info',
          onConfirm: () => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            closeModal();
            fetchContratos();
          }
        });
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: result.error || 'Error al registrar pago',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al registrar el pago',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarPago = (pago: PagoContrato) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar pago?',
      message: `¿Está seguro de eliminar el pago de ₡${pago.monto.toLocaleString()}?`,
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/pago-contrato?id_pago_contrato=${pago.id_pago_contrato}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            await fetchPagosContrato(pago.id_contrato);
            await fetchContratos();
            setConfirmDialog({
              ...confirmDialog,
              isOpen: false
            });
          }
        } catch (error) {
          console.error('Error al eliminar pago:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setContratoSeleccionado(null);
    setCurrentPago({
      id_contrato: 0,
      tipo_pago: TipoPago.EFECTIVO,
      monto: 0,
      fecha_pago: new Date().toISOString().split('T')[0]
    });
  };

  const closeModalPagos = () => {
    setIsModalPagosOpen(false);
    setContratoSeleccionado(null);
    setPagos([]);
  };

  const filteredContratos = contratos.filter(contrato => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (contrato.numero_contrato?.toLowerCase() || '').includes(search) ||
      (contrato.numero_solicitud_equipo?.toLowerCase() || '').includes(search) ||
      (contrato.nombre_cliente?.toLowerCase() || '').includes(search)
    );

    const matchesEstado =
      estadoFiltro === 'todos' ? true : contrato.estado_pago === estadoFiltro;

    return matchesSearch && matchesEstado;
  });

  const columns: Column<ContratoConPago>[] = [
    { key: 'numero_contrato', header: 'N° Contrato', width: '120px' },
    { key: 'numero_solicitud_equipo', header: 'N° SE', width: '120px' },
    { key: 'nombre_cliente', header: 'Cliente', width: '220px' },
    {
      key: 'fecha_inicio',
      header: 'Fecha Inicio',
      width: '190px',
      render: (c) => c.fecha_inicio ? formatearFecha(c.fecha_inicio) : '-'
    },
    {
      key: 'fecha_vencimiento',
      header: 'Vencimiento',
      width: '120px',
      render: (c) => {
        if (!c.fecha_vencimiento) return '-';
        
        const fechaVencimiento = new Date(c.fecha_vencimiento);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        fechaVencimiento.setHours(0, 0, 0, 0);
        
        // No aplicar colores si está pagado
        if (c.estado_pago === EstadoPagoContrato.PAGADO) {
          return formatearFecha(c.fecha_vencimiento);
        }
        
        const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
        
        let className = '';
        if (diferenciaDias <= 1) {
          className = styles.fechaVencida;
        } else if (diferenciaDias <= 3) {
          className = styles.fechaPorVencer;
        }
        
        return (
          <span className={className}>
            {formatearFecha(c.fecha_vencimiento)}
          </span>
        );
      }
    },
    {
      key: 'total_contrato',
      header: 'Monto Contrato',
      width: '150px',
      render: (c) => `₡${c.total_contrato.toLocaleString()}`
    },
    {
      key: 'usa_factura',
      header: 'Paga IVA',
      width: '100px',
      render: (c) => c.iva_contrato > 0 ? 'Sí' : 'No'
    },
    {
      key: 'iva_contrato',
      header: 'IVA',
      width: '120px',
      render: (c) => c.iva_contrato > 0 ? `₡${c.iva_contrato.toLocaleString()}` : '-'
    },
    {
      key: 'monto_pagado',
      header: 'Pagado',
      width: '130px',
      render: (c) => `₡${c.monto_pagado.toLocaleString()}`
    },
    {
      key: 'monto_pendiente',
      header: 'Pendiente',
      width: '130px',
      render: (c) => `₡${c.monto_pendiente.toLocaleString()}`
    },
    {
      key: 'estado_pago',
      header: 'Estado',
      width: '130px',
      render: (c) => {
        let className = styles.statusActive;
        let label = 'Pendiente';

        if (c.estado_pago === EstadoPagoContrato.PAGADO) {
          className = styles.statusSuccess;
          label = 'Pagado';
        } else if (c.estado_pago === EstadoPagoContrato.PAGO_PARCIAL) {
          className = styles.statusContrato;
          label = 'Pago Parcial';
        }

        return <span className={className}>{label}</span>;
      }
    }
  ];

  const actions: TableAction<ContratoConPago>[] = [
    {
      label: '💰',
      onClick: handleRegistrarPago,
      className: styles.btnAdd,
      tooltip: 'Registrar pago',
      condition: (c) => {
        const esContable = usuario?.usuario_rol === 4;
        return c.estado_pago !== EstadoPagoContrato.PAGADO && !esContable;
      }
    },
    {
      label: '📋',
      onClick: handleVerPagos,
      className: styles.btnView,
      tooltip: 'Ver pagos'
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Control de Pagos</h1>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por contrato, SE o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className={styles.searchInput}
            style={{ width: '200px', marginLeft: '1rem' }}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pago_parcial">Pago Parcial</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredContratos}
          actions={actions}
          keyExtractor={(c) => c.id_contrato}
          noDataMessage="No se encontraron contratos"
        />

        {/* Modal Registrar Pago */}
        {isModalOpen && contratoSeleccionado && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>Registrar Pago - Contrato {contratoSeleccionado.numero_contrato}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmitPago} className={styles.form}>
                <div className={styles.section}>
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <div><strong>Cliente:</strong> {contratoSeleccionado.nombre_cliente}</div>
                    <div><strong>Total Contrato:</strong> ₡{contratoSeleccionado.total_contrato.toLocaleString()}</div>
                    <div><strong>Pagado:</strong> ₡{contratoSeleccionado.monto_pagado.toLocaleString()}</div>
                    <div><strong>Pendiente:</strong> ₡{contratoSeleccionado.monto_pendiente.toLocaleString()}</div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Tipo de Pago *</label>
                      <select
                        value={currentPago.tipo_pago}
                        onChange={(e) => setCurrentPago({ ...currentPago, tipo_pago: e.target.value as TipoPago })}
                        required
                      >
                        <option value={TipoPago.EFECTIVO}>Efectivo</option>
                        <option value={TipoPago.SIMPE}>SIMPE Móvil</option>
                        <option value={TipoPago.TRANSFERENCIA}>Transferencia</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Monto *</label>
                      <input
                        type="number"
                        value={currentPago.monto || ''}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setCurrentPago({ ...currentPago, monto: valor === '' ? 0 : parseInt(valor) || 0 });
                        }}
                        required
                        min="0"
                        step="1"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Fecha de Pago *</label>
                      <input
                        type="date"
                        value={currentPago.fecha_pago}
                        onChange={(e) => setCurrentPago({ ...currentPago, fecha_pago: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {currentPago.tipo_pago === TipoPago.SIMPE && (
                    <div className={styles.formGroup}>
                      <label>Número de Comprobante *</label>
                      <input
                        type="text"
                        value={currentPago.numero_comprobante || ''}
                        onChange={(e) => setCurrentPago({ ...currentPago, numero_comprobante: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {currentPago.tipo_pago === TipoPago.TRANSFERENCIA && (
                    <>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Banco *</label>
                          <input
                            type="text"
                            value={currentPago.banco || ''}
                            onChange={(e) => setCurrentPago({ ...currentPago, banco: e.target.value })}
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Número de Transferencia *</label>
                          <input
                            type="text"
                            value={currentPago.numero_transferencia || ''}
                            onChange={(e) => setCurrentPago({ ...currentPago, numero_transferencia: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles.formGroup}>
                    <label>Observaciones</label>
                    <textarea
                      value={currentPago.observaciones || ''}
                      onChange={(e) => setCurrentPago({ ...currentPago, observaciones: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSubmit}>
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ver Pagos */}
        {isModalPagosOpen && contratoSeleccionado && (
          <div className={styles.modalOverlay} onClick={closeModalPagos}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
              <div className={styles.modalHeader}>
                <h2>💰 Historial de Pagos - Contrato {contratoSeleccionado.numero_contrato}</h2>
                <button className={styles.closeBtn} onClick={closeModalPagos}>×</button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {/* Resumen del Contrato */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #0070f3'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Cliente</div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{contratoSeleccionado.nombre_cliente}</div>
                  </div>
                  
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #333'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Contrato</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                      ₡{contratoSeleccionado.total_contrato.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#d4edda', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #28a745'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#155724', marginBottom: '0.25rem' }}>Total Pagado</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#155724' }}>
                      ₡{contratoSeleccionado.monto_pagado.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: contratoSeleccionado.monto_pendiente > 0 ? '#fff3cd' : '#d4edda', 
                    borderRadius: '8px',
                    borderLeft: `4px solid ${contratoSeleccionado.monto_pendiente > 0 ? '#ffc107' : '#28a745'}`
                  }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: contratoSeleccionado.monto_pendiente > 0 ? '#856404' : '#155724', 
                      marginBottom: '0.25rem' 
                    }}>
                      Saldo Pendiente
                    </div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem', 
                      color: contratoSeleccionado.monto_pendiente > 0 ? '#856404' : '#155724' 
                    }}>
                      ₡{contratoSeleccionado.monto_pendiente.toLocaleString()}
                    </div>
                  </div>
                </div>

                {pagos.length > 0 ? (
                  <div>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#333' }}>
                      📋 Detalle de Pagos ({pagos.length})
                    </h3>
                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }}>
                      {pagos.map((pago, index) => (
                        <div 
                          key={pago.id_pago_contrato}
                          style={{
                            padding: '1rem',
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                            borderBottom: index < pagos.length - 1 ? '1px solid #e0e0e0' : 'none',
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: '1rem',
                            alignItems: 'start'
                          }}
                        >
                          {/* Fecha e ícono */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: '1.5rem',
                              marginBottom: '0.25rem'
                            }}>
                              {pago.tipo_pago === 'efectivo' && '💵'}
                              {pago.tipo_pago === 'simpe' && '📱'}
                              {pago.tipo_pago === 'transferencia' && '🏦'}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#666',
                              whiteSpace: 'nowrap'
                            }}>
                              {formatearFecha(pago.fecha_pago)}
                            </div>
                          </div>

                          {/* Detalles del pago */}
                          <div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{ 
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                color: '#28a745'
                              }}>
                                ₡{pago.monto.toLocaleString()}
                              </span>
                              <span style={{
                                fontSize: '0.85rem',
                                padding: '0.2rem 0.5rem',
                                backgroundColor: '#e7f3ff',
                                color: '#0070f3',
                                borderRadius: '4px',
                                textTransform: 'capitalize'
                              }}>
                                {pago.tipo_pago}
                              </span>
                            </div>

                            {pago.tipo_pago === 'simpe' && pago.numero_comprobante && (
                              <div style={{ 
                                fontSize: '0.85rem', 
                                color: '#555',
                                marginBottom: '0.25rem'
                              }}>
                                <strong>Comprobante:</strong> {pago.numero_comprobante}
                              </div>
                            )}

                            {pago.tipo_pago === 'transferencia' && (
                              <>
                                {pago.banco && (
                                  <div style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#555',
                                    marginBottom: '0.25rem'
                                  }}>
                                    <strong>Banco:</strong> {pago.banco}
                                  </div>
                                )}
                                {pago.numero_transferencia && (
                                  <div style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#555',
                                    marginBottom: '0.25rem'
                                  }}>
                                    <strong>N° Transferencia:</strong> {pago.numero_transferencia}
                                  </div>
                                )}
                              </>
                            )}

                            {pago.observaciones && (
                              <div style={{ 
                                fontSize: '0.85rem', 
                                color: '#666',
                                fontStyle: 'italic',
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px'
                              }}>
                                💬 {pago.observaciones}
                              </div>
                            )}
                          </div>

                          {/* Botón eliminar - oculto para rol 4 (Contable) */}
                          {usuario?.usuario_rol !== 4 && (
                            <div>
                              <button
                                onClick={() => handleEliminarPago(pago)}
                                className={styles.btnAnular}
                                title="Eliminar pago"
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '1.2rem'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 2rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <div style={{ fontSize: '1.1rem', color: '#666', fontWeight: '500' }}>
                      No hay pagos registrados para este contrato
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                      Registra el primer pago para comenzar a llevar el control
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={closeModalPagos}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Aceptar"
        cancelText="Cancelar"
        type={confirmDialog.type}
        showCancel={true}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default ControlPagos;
