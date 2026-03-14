import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/SolicitudEquipo.module.css';
import {
  OrdenRecoleccion,
  EstadoOrdenRecoleccion,
  EstadoOrdenRecoleccionLabels
} from '../types/ordenRecoleccion';

const OrdenesRecoleccion: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenRecoleccion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | 'todos'>('todos');

  const [currentOrden, setCurrentOrden] = useState<OrdenRecoleccion>({
    estado: EstadoOrdenRecoleccion.PENDIENTE
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orden-recoleccion');
      const result = await response.json();
      setOrdenes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      setOrdenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (orden: OrdenRecoleccion) => {
    setCurrentOrden(orden);
    setIsViewing(true);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (orden: OrdenRecoleccion) => {
    setCurrentOrden(orden);
    setIsViewing(false);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCancelar = (orden: OrdenRecoleccion) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Cancelar orden?',
      message: '¿Estás seguro de que deseas cancelar esta orden de recolección?',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${orden.id_orden_recoleccion}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: EstadoOrdenRecoleccion.CANCELADA })
          });
          if (response.ok) {
            fetchOrdenes();
          }
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleCompletar = (orden: OrdenRecoleccion) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Marcar como completada?',
      message: '¿Confirma que la recolección se ha completado exitosamente?',
      type: 'info',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${orden.id_orden_recoleccion}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: EstadoOrdenRecoleccion.COMPLETADA })
          });
          if (response.ok) {
            fetchOrdenes();
          }
        } catch (error) {
          console.error('Error al completar orden:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOrden({ estado: EstadoOrdenRecoleccion.PENDIENTE });
    setIsViewing(false);
    setIsEditing(false);
  };

  const filteredOrdenes = ordenes.filter(orden => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (orden.numero_orden_recoleccion?.toLowerCase() || '').includes(search) ||
      (orden.numero_solicitud_equipo?.toLowerCase() || '').includes(search) ||
      (orden.nombre_equipo?.toLowerCase() || '').includes(search) ||
      (orden.nombre_cliente?.toLowerCase() || '').includes(search)
    );

    const matchesEstado =
      estadoFiltro === 'todos' ? true :
      orden.estado === estadoFiltro;

    return matchesSearch && matchesEstado;
  }).sort((a, b) => {
    const numA = a.numero_orden_recoleccion || '';
    const numB = b.numero_orden_recoleccion || '';
    return numB.localeCompare(numA);
  });

  const columns: Column<OrdenRecoleccion>[] = [
    { key: 'numero_orden_recoleccion', header: 'Número Orden', width: '150px' },
    { key: 'numero_solicitud_equipo', header: 'Solicitud', width: '130px' },
    { key: 'nombre_equipo', header: 'Equipo', width: '220px' },
    { 
      key: 'cantidad', 
      header: 'Cantidad', 
      width: '100px',
      render: (o) => o.cantidad || 1
    },
    { key: 'nombre_cliente', header: 'Cliente', width: '200px' },
    { key: 'fecha_programada_recoleccion', header: 'Fecha Programada', width: '150px' },
    {
      key: 'provincia',
      header: 'Ubicación',
      width: '180px',
      render: (o) => `${o.provincia || ''}, ${o.canton || ''}`
    },
    {
      key: 'estado',
      header: 'Estado',
      width: '120px',
      render: (o) => {
        const estado = o.estado ?? EstadoOrdenRecoleccion.PENDIENTE;
        const label = EstadoOrdenRecoleccionLabels[estado] || 'Desconocido';

        let className = styles.statusActive;
        if (estado === EstadoOrdenRecoleccion.CANCELADA) {
          className = styles.statusInactive;
        } else if (estado === EstadoOrdenRecoleccion.COMPLETADA) {
          className = styles.statusSuccess;
        } else if (estado === EstadoOrdenRecoleccion.EN_RUTA) {
          className = styles.statusContrato;
        }

        return <span className={className}>{label}</span>;
      }
    }
  ];

  const actions: TableAction<OrdenRecoleccion>[] = [
    {
      label: '👁️',
      onClick: handleView,
      className: styles.btnView,
      tooltip: 'Ver detalles'
    },
    {
      label: '✏️',
      onClick: handleEdit,
      className: styles.btnEdit,
      tooltip: 'Editar orden',
      condition: (orden) =>
        orden.estado === EstadoOrdenRecoleccion.PENDIENTE
    },
    {
      label: '✅',
      onClick: handleCompletar,
      className: styles.btnContrato,
      tooltip: 'Marcar como completada',
      condition: (orden) =>
        orden.estado === EstadoOrdenRecoleccion.EN_RUTA
    },
    {
      label: '🚫',
      onClick: handleCancelar,
      className: styles.btnAnular,
      tooltip: 'Cancelar orden',
      condition: (orden) =>
        orden.estado !== EstadoOrdenRecoleccion.COMPLETADA &&
        orden.estado !== EstadoOrdenRecoleccion.CANCELADA
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Órdenes de Recolección</h1>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar órdenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
            className={styles.searchInput}
            style={{ width: '220px', marginLeft: '1rem' }}
          >
            <option value="todos">Todos los estados</option>
            {Object.entries(EstadoOrdenRecoleccionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredOrdenes}
          actions={actions}
          keyExtractor={(o) => o.id_orden_recoleccion!}
          noDataMessage="No se encontraron órdenes de recolección"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isViewing ? 'Ver Orden de Recolección' : 'Editar Orden de Recolección'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>×</button>
              </div>

              <div className={styles.form}>
                <div className={styles.section}>
                  <h3>Datos de la Orden</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Número de Orden</label>
                      <input
                        type="text"
                        value={currentOrden.numero_orden_recoleccion || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Solicitud Equipo</label>
                      <input
                        type="text"
                        value={currentOrden.numero_solicitud_equipo || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Equipo</label>
                      <input
                        type="text"
                        value={currentOrden.nombre_equipo || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cantidad</label>
                      <input
                        type="number"
                        value={currentOrden.cantidad || 1}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Fecha Programada</label>
                      <input
                        type="date"
                        value={currentOrden.fecha_programada_recoleccion || ''}
                        onChange={(e) => setCurrentOrden({ ...currentOrden, fecha_programada_recoleccion: e.target.value })}
                        disabled={isViewing}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Estado</label>
                      <input
                        type="text"
                        value={EstadoOrdenRecoleccionLabels[currentOrden.estado || EstadoOrdenRecoleccion.PENDIENTE]}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Cliente y Dirección</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Cliente</label>
                      <input
                        type="text"
                        value={currentOrden.nombre_cliente || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Teléfono</label>
                      <input
                        type="text"
                        value={currentOrden.telefono_cliente || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Provincia</label>
                      <input
                        type="text"
                        value={currentOrden.provincia || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cantón</label>
                      <input
                        type="text"
                        value={currentOrden.canton || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Distrito</label>
                      <input
                        type="text"
                        value={currentOrden.distrito || ''}
                        readOnly
                        style={{ background: '#f0f0f0' }}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Otras Señas</label>
                    <textarea
                      value={currentOrden.otras_senas || ''}
                      readOnly
                      style={{ background: '#f0f0f0' }}
                      rows={3}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Observaciones</label>
                  <textarea
                    value={currentOrden.observaciones || ''}
                    onChange={(e) => setCurrentOrden({ ...currentOrden, observaciones: e.target.value })}
                    disabled={isViewing}
                    rows={4}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>
                    Cerrar
                  </button>
                  {!isViewing && isEditing && (
                    <button
                      type="button"
                      className={styles.btnSubmit}
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const response = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${currentOrden.id_orden_recoleccion}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              fecha_programada_recoleccion: currentOrden.fecha_programada_recoleccion,
                              observaciones: currentOrden.observaciones
                            })
                          });
                          if (response.ok) {
                            await fetchOrdenes();
                            closeModal();
                          }
                        } catch (error) {
                          console.error('Error actualizando orden:', error);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Actualizar
                    </button>
                  )}
                </div>
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

export default OrdenesRecoleccion;
