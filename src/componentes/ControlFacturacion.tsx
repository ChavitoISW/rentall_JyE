import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/SolicitudEquipo.module.css';
import { FacturaContrato, EstadoFactura, EstadoFacturaLabels } from '../types/facturaContrato';

interface FacturaExtendida extends FacturaContrato {
  numero_contrato?: string;
  numero_solicitud_equipo?: string;
  nombre_cliente?: string;
}

interface ContratoConIVA {
  id_contrato: number;
  numero_contrato: string;
  id_solicitud_equipo: number;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  total_solicitud_equipo: number;
  iva_solicitud_equipo: number;
  estado_contrato: number;
  total_facturas: number;
  facturas_pagadas: number;
}

const ControlFacturacion: React.FC = () => {
  const { usuario } = useAuth();
  const [facturas, setFacturas] = useState<FacturaExtendida[]>([]);
  const [contratosIVA, setContratosIVA] = useState<ContratoConIVA[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const [currentFactura, setCurrentFactura] = useState<FacturaContrato>({
    id_solicitud_equipo: 0,
    id_contrato: 0,
    numero_factura: '',
    monto_subtotal: 0,
    monto_iva: 0,
    monto_total: 0,
    fecha_emision: new Date().toISOString().split('T')[0],
    estado_factura: EstadoFactura.PENDIENTE,
    observaciones: ''
  });

  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoConIVA | null>(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchFacturas();
    fetchContratosIVA();
  }, []);

  const fetchFacturas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/factura-contrato');
      const result = await response.json();
      setFacturas(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      setFacturas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContratosIVA = async () => {
    try {
      const response = await fetch('/api/contrato/con-iva');
      const result = await response.json();
      setContratosIVA(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar contratos con IVA:', error);
      setContratosIVA([]);
    }
  };

  const handleAgregarFactura = () => {
    setIsEditMode(false);
    setContratoSeleccionado(null);
    setCurrentFactura({
      id_solicitud_equipo: 0,
      id_contrato: 0,
      numero_factura: '',
      monto_subtotal: 0,
      monto_iva: 0,
      monto_total: 0,
      fecha_emision: new Date().toISOString().split('T')[0],
      estado_factura: EstadoFactura.PENDIENTE,
      observaciones: ''
    });
    setIsModalOpen(true);
  };

  const handleSeleccionarContrato = (idContrato: number) => {
    const contrato = contratosIVA.find(c => c.id_contrato === idContrato);
    if (contrato) {
      setContratoSeleccionado(contrato);
      
      // Calcular subtotal desde el total (total = subtotal + iva)
      const total = contrato.total_solicitud_equipo;
      const iva = contrato.iva_solicitud_equipo;
      const subtotal = total - iva;

      setCurrentFactura({
        ...currentFactura,
        id_solicitud_equipo: contrato.id_solicitud_equipo,
        id_contrato: contrato.id_contrato,
        monto_subtotal: subtotal,
        monto_iva: iva,
        monto_total: total
      });
    }
  };

  const handleEditarFactura = (factura: FacturaExtendida) => {
    setIsEditMode(true);
    setCurrentFactura({
      id_factura_contrato: factura.id_factura_contrato,
      id_solicitud_equipo: factura.id_solicitud_equipo,
      id_contrato: factura.id_contrato,
      numero_factura: factura.numero_factura,
      monto_subtotal: factura.monto_subtotal,
      monto_iva: factura.monto_iva,
      monto_total: factura.monto_total,
      fecha_emision: factura.fecha_emision,
      estado_factura: factura.estado_factura,
      observaciones: factura.observaciones || ''
    });
    
    // Buscar el contrato asociado para mostrar info
    const contrato = contratosIVA.find(c => c.id_contrato === factura.id_contrato);
    setContratoSeleccionado(contrato || null);
    
    setIsModalOpen(true);
  };

  const handleEliminarFactura = (factura: FacturaExtendida) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Factura',
      message: `¿Está seguro de eliminar la factura ${factura.numero_factura}?`,
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/factura-contrato?id_factura_contrato=${factura.id_factura_contrato}`, {
            method: 'DELETE'
          });

          const result = await response.json();

          if (response.ok) {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            await fetchFacturas();
            
            setConfirmDialog({
              isOpen: true,
              title: 'Éxito',
              message: 'Factura eliminada correctamente',
              type: 'info',
              onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
            });
          } else {
            throw new Error(result.message || 'Error al eliminar la factura');
          }
        } catch (error: any) {
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: error.message || 'Error al eliminar la factura',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleSubmitFactura = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentFactura.id_contrato) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Debe seleccionar un contrato',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    if (!currentFactura.numero_factura.trim()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'El número de factura es requerido',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    if (currentFactura.monto_total <= 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'El monto total debe ser mayor a cero',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    setIsLoading(true);
    try {
      const url = '/api/factura-contrato';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentFactura),
      });

      const result = await response.json();

      if (response.ok) {
        setIsModalOpen(false);
        await fetchFacturas();
        await fetchContratosIVA();
        
        setConfirmDialog({
          isOpen: true,
          title: 'Éxito',
          message: isEditMode ? 'Factura actualizada correctamente' : 'Factura registrada correctamente',
          type: 'info',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      } else {
        throw new Error(result.message || 'Error al procesar la factura');
      }
    } catch (error: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Error al procesar la factura',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFacturas = facturas.filter(factura => {
    const searchLower = searchTerm.toLowerCase();
    return (
      factura.numero_factura?.toLowerCase().includes(searchLower) ||
      factura.numero_contrato?.toLowerCase().includes(searchLower) ||
      factura.numero_solicitud_equipo?.toLowerCase().includes(searchLower) ||
      factura.nombre_cliente?.toLowerCase().includes(searchLower)
    );
  });

  const columnsFacturas: Column<FacturaExtendida>[] = [
    {
      key: 'numero_factura',
      header: 'Número Factura',
      width: '150px'
    },
    {
      key: 'numero_solicitud_equipo',
      header: 'SE',
      width: '140px'
    },
    {
      key: 'numero_contrato',
      header: 'Contrato',
      width: '140px'
    },
    {
      key: 'nombre_cliente',
      header: 'Cliente',
      width: '280px'
    },
    {
      key: 'fecha_emision',
      header: 'Fecha',
      width: '130px',
      render: (f) => new Date(f.fecha_emision).toLocaleDateString('es-CR')
    },
    {
      key: 'monto_subtotal',
      header: 'Subtotal',
      width: '130px',
      render: (f) => `₡${f.monto_subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'monto_iva',
      header: 'IVA',
      width: '130px',
      render: (f) => `₡${f.monto_iva.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'monto_total',
      header: 'Total',
      width: '130px',
      render: (f) => `₡${f.monto_total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`
    }
  ];

  const actionsFacturas: TableAction<FacturaExtendida>[] = [
    {
      label: '✏️',
      onClick: handleEditarFactura,
      className: styles.btnEdit,
      tooltip: 'Editar factura'
    },
    {
      label: '🗑️',
      onClick: handleEliminarFactura,
      className: styles.btnDelete,
      tooltip: 'Eliminar factura'
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Control de Facturación</h1>
          <button className={styles.btnAdd} onClick={handleAgregarFactura}>
            + Agregar Factura
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columnsFacturas}
          data={filteredFacturas}
          actions={actionsFacturas}
          keyExtractor={(f) => f.id_factura_contrato!}
          noDataMessage="No hay facturas registradas"
        />
      </main>

      <Footer />

      {/* Modal Agregar/Editar Factura */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: contratoSeleccionado || isEditMode ? '600px' : '900px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className={styles.modalHeader}>
              <h2>{isEditMode ? '✏️ Editar Factura' : '📄 Agregar Factura'}</h2>
              <button
                className={styles.modalClose}
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleSubmitFactura}>
                {!isEditMode && !contratoSeleccionado && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem', borderBottom: '2px solid #e0e0e0', paddingBottom: '0.5rem' }}>
                      📋 Seleccionar Contrato
                    </h3>
                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto', 
                      border: '2px solid #e0e0e0', 
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      {contratosIVA.length === 0 ? (
                        <div style={{
                          padding: '3rem',
                          textAlign: 'center',
                          color: '#6c757d'
                        }}>
                          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                            No hay contratos con IVA disponibles
                          </div>
                        </div>
                      ) : (
                        contratosIVA.map((contrato) => (
                          <div
                            key={contrato.id_contrato}
                            style={{
                              padding: '1rem',
                              borderBottom: '1px solid #dee2e6',
                              cursor: 'pointer',
                              backgroundColor: 'white',
                              transition: 'all 0.2s ease',
                              margin: '0.5rem',
                              borderRadius: '6px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => handleSeleccionarContrato(contrato.id_contrato)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e3f2fd';
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                              <div style={{
                                minWidth: '40px',
                                height: '40px',
                                borderRadius: '8px',
                              background: 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}>
                                📄
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: '#333' }}>
                                  📋 Contrato: {contrato.numero_contrato}
                                  <span style={{ 
                                    marginLeft: '0.5rem', 
                                    fontSize: '0.85rem', 
                                    color: '#4a90e2',
                                    fontWeight: '500'
                                  }}>
                                    (SE: {contrato.numero_solicitud_equipo})
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.25rem' }}>
                                  <strong>Cliente:</strong> {contrato.nombre_cliente}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#666' }}>
                                  <div>
                                    <strong>Total:</strong> ₡{contrato.total_solicitud_equipo.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div>
                                    <strong>IVA:</strong> ₡{contrato.iva_solicitud_equipo.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                              <div style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                Seleccionar →
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {(contratoSeleccionado || isEditMode) && (
                  <>
                    {/* Información del Contrato */}
                    <div style={{
                      background: 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <div>
                          <div style={{ opacity: 0.9, marginBottom: '0.25rem' }}>Contrato:</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{contratoSeleccionado?.numero_contrato}</div>
                        </div>
                        <div>
                          <div style={{ opacity: 0.9, marginBottom: '0.25rem' }}>SE:</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {contratoSeleccionado?.numero_solicitud_equipo}
                          </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ opacity: 0.9, marginBottom: '0.25rem' }}>Cliente:</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{contratoSeleccionado?.nombre_cliente}</div>
                        </div>
                      </div>
                    </div>

                    {/* Datos de la Factura */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ 
                        fontSize: '1.05rem', 
                        color: '#333', 
                        marginBottom: '1.25rem', 
                        borderBottom: '3px solid',
                        borderImage: 'linear-gradient(90deg, #4a90e2 0%, #2874d9 100%) 1',
                        paddingBottom: '0.75rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem'
                        }}>📝</span>
                        Datos de la Factura
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                          <label style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '600', 
                            color: '#555',
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            🔢 Número de Factura *
                          </label>
                          <input
                            type="text"
                            className={styles.modalInput}
                            value={currentFactura.numero_factura}
                            onChange={(e) => setCurrentFactura({ ...currentFactura, numero_factura: e.target.value })}
                            required
                            placeholder="Ej: FAC-001-2026"
                            style={{ 
                              padding: '0.75rem 1rem',
                              fontSize: '0.95rem',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fafafa'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#4a90e2';
                              e.target.style.backgroundColor = 'white';
                              e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e0e0e0';
                              e.target.style.backgroundColor = '#fafafa';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>

                        <div style={{ position: 'relative' }}>
                          <label style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '600', 
                            color: '#555',
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            📅 Fecha de Emisión *
                          </label>
                          <input
                            type="date"
                            className={styles.modalInput}
                            value={currentFactura.fecha_emision}
                            onChange={(e) => setCurrentFactura({ ...currentFactura, fecha_emision: e.target.value })}
                            required
                            style={{ 
                              padding: '0.75rem 1rem',
                              fontSize: '0.95rem',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fafafa'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#4a90e2';
                              e.target.style.backgroundColor = 'white';
                              e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e0e0e0';
                              e.target.style.backgroundColor = '#fafafa';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Montos */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ 
                        fontSize: '1.05rem', 
                        color: '#333', 
                        marginBottom: '1.25rem', 
                        borderBottom: '3px solid',
                        borderImage: 'linear-gradient(90deg, #27ae60 0%, #229954 100%) 1',
                        paddingBottom: '0.75rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem'
                        }}>💰</span>
                        Montos
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                          <label style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '600', 
                            color: '#555',
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            💵 Subtotal (₡)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className={styles.modalInput}
                            value={currentFactura.monto_subtotal}
                            readOnly
                            placeholder="0.00"
                            style={{ 
                              padding: '0.75rem 1rem',
                              fontSize: '0.95rem',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              backgroundColor: '#f0f0f0',
                              fontWeight: '600',
                              color: '#666',
                              cursor: 'not-allowed'
                            }}
                          />
                        </div>

                        <div style={{ position: 'relative' }}>
                          <label style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '600', 
                            color: '#555',
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            📊 IVA (₡)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className={styles.modalInput}
                            value={currentFactura.monto_iva}
                            readOnly
                            placeholder="0.00"
                            style={{ 
                              padding: '0.75rem 1rem',
                              fontSize: '0.95rem',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              backgroundColor: '#f0f0f0',
                              fontWeight: '600',
                              color: '#666',
                              cursor: 'not-allowed'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{
                        marginTop: '1.5rem',
                        padding: '1.25rem 1.5rem',
                        background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.25rem' }}>Total a Pagar</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                              💎 MONTO TOTAL
                            </div>
                          </div>
                          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                            ₡{currentFactura.monto_total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isEditMode && (
                      <label className={styles.modalLabel} style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Estado</span>
                        <select
                          className={styles.modalInput}
                          value={currentFactura.estado_factura}
                          onChange={(e) => setCurrentFactura({ ...currentFactura, estado_factura: parseInt(e.target.value) })}
                          style={{ marginTop: '0.25rem' }}
                        >
                          <option value={EstadoFactura.PENDIENTE}>⏳ Pendiente</option>
                          <option value={EstadoFactura.PAGADA}>✅ Pagada</option>
                          <option value={EstadoFactura.ANULADA}>🚫 Anulada</option>
                        </select>
                      </label>
                    )}

                    <label className={styles.modalLabel}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Observaciones</span>
                      <textarea
                        className={styles.modalTextarea}
                        value={currentFactura.observaciones}
                        onChange={(e) => setCurrentFactura({ ...currentFactura, observaciones: e.target.value })}
                        rows={3}
                        placeholder="Observaciones adicionales sobre la factura..."
                        style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}
                      />
                    </label>

                    <div className={styles.modalActions} style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className={styles.btnCancel}
                        onClick={() => setIsModalOpen(false)}
                        style={{
                          padding: '0.75rem 2rem',
                          fontSize: '1rem',
                          borderRadius: '8px',
                          fontWeight: '500'
                        }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className={styles.btnSubmit}
                        style={{
                          padding: '0.75rem 2rem',
                          fontSize: '1rem',
                          borderRadius: '8px',
                          fontWeight: '500',
                          background: 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                          boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)'
                        }}
                      >
                        {isEditMode ? '✅ Actualizar Factura' : '💾 Registrar Factura'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          type={confirmDialog.type}
        />
      )}
    </div>
  );
};

export default ControlFacturacion;
