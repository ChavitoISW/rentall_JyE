import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/SolicitudEquipo.module.css';
import {
  OrdenCambio,
  EstadoOrdenCambio,
  EstadoOrdenCambioLabels
} from '../types/ordenCambio';

const OrdenesCambio: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenCambio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | 'todos'>('todos');

  const [currentOrden, setCurrentOrden] = useState<OrdenCambio>({
    estado: EstadoOrdenCambio.PENDIENTE
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
      const response = await fetch('/api/orden-cambio');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setOrdenes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar órdenes de cambio:', error);
      setOrdenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (orden: OrdenCambio) => {
    setCurrentOrden(orden);
    setIsViewing(true);
    setIsModalOpen(true);
  };

  const handleCancelar = (orden: OrdenCambio) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Cancelar orden?',
      message: '¿Estás seguro de que deseas cancelar esta orden de cambio?',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/orden-cambio?id_orden_cambio=${orden.id_orden_cambio}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: EstadoOrdenCambio.CANCELADA })
          });
          if (response.ok) {
            fetchOrdenes();
          }
        } catch (error) {
          console.error('Error al cancelar orden:', error);
        } finally {
          setIsLoading(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewing(false);
    setCurrentOrden({ estado: EstadoOrdenCambio.PENDIENTE });
  };

  const filteredOrdenes = ordenes.filter(orden => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (orden.numero_orden_cambio?.toLowerCase() || '').includes(search) ||
      (orden.numero_solicitud_equipo?.toLowerCase() || '').includes(search) ||
      (orden.nombre_cliente?.toLowerCase() || '').includes(search) ||
      (orden.nombre_equipo_actual?.toLowerCase() || '').includes(search) ||
      (orden.nombre_equipo_nuevo?.toLowerCase() || '').includes(search)
    );
    const matchesEstado = estadoFiltro === 'todos' ? true : orden.estado === estadoFiltro;
    return matchesSearch && matchesEstado;
  });

  const getEstadoBadge = (estado: EstadoOrdenCambio | undefined) => {
    let className = styles.statusActive;
    
    switch(estado) {
      case EstadoOrdenCambio.PENDIENTE:
        className = styles.statusActive;
        break;
      case EstadoOrdenCambio.EN_RUTA:
        className = styles.statusInTransit;
        break;
      case EstadoOrdenCambio.COMPLETADA:
        className = styles.statusSuccess;
        break;
      case EstadoOrdenCambio.CANCELADA:
        className = styles.statusInactive;
        break;
    }

    return <span className={className}>{EstadoOrdenCambioLabels[estado || EstadoOrdenCambio.PENDIENTE]}</span>;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const columns: Column<OrdenCambio>[] = [
    {
      key: 'numero_orden_cambio',
      header: 'N° Orden',
      width: '120px',
      render: (orden) => <strong>{orden.numero_orden_cambio}</strong>
    },
    {
      key: 'numero_solicitud_equipo',
      header: 'N° SE',
      width: '110px',
      render: (orden) => (
        <a 
          href={`/solicitudes-equipos?numero=${orden.numero_solicitud_equipo}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkSolicitud}
        >
          {orden.numero_solicitud_equipo}
        </a>
      )
    },
    {
      key: 'nombre_cliente',
      header: 'Cliente',
      width: '200px'
    },
    {
      key: 'nombre_equipo_actual',
      header: 'Equipo Actual',
      width: '180px',
      render: (orden) => (
        <span style={{ color: '#dc3545', fontWeight: '500' }}>
          ← {orden.nombre_equipo_actual}
        </span>
      )
    },
    {
      key: 'nombre_equipo_nuevo',
      header: 'Equipo Nuevo',
      width: '180px',
      render: (orden) => (
        <span style={{ color: '#28a745', fontWeight: '500' }}>
          → {orden.nombre_equipo_nuevo}
        </span>
      )
    },
    {
      key: 'motivo_cambio',
      header: 'Motivo',
      width: '200px',
      render: (orden) => (
        <span className={styles.motivoText}>
          {orden.motivo_cambio || '-'}
        </span>
      )
    },
    {
      key: 'fecha_creacion',
      header: 'Fecha Creación',
      width: '130px',
      render: (orden) => formatDate(orden.fecha_creacion)
    },
    {
      key: 'estado',
      header: 'Estado',
      width: '120px',
      render: (orden) => getEstadoBadge(orden.estado)
    }
  ];

  const actions: TableAction<OrdenCambio>[] = [
    {
      label: 'Ver Detalle',
      onClick: handleView,
      className: styles.btnView
    },
    {
      label: 'Cancelar',
      onClick: handleCancelar,
      className: styles.btnDelete,
      condition: (orden) => orden.estado === EstadoOrdenCambio.PENDIENTE
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>🔄 Órdenes de Cambio de Equipos</h1>
            <p style={{ color: 'white', marginTop: '0.5rem' }}>
              Gestión de cambios de equipos en contratos activos
            </p>
          </div>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por N° orden, SE, cliente o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className={styles.searchInput}
            style={{ width: '200px' }}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
          >
            <option value="todos">Todos los estados</option>
            <option value={EstadoOrdenCambio.PENDIENTE}>Pendiente</option>
            <option value={EstadoOrdenCambio.EN_RUTA}>En Ruta</option>
            <option value={EstadoOrdenCambio.COMPLETADA}>Completada</option>
            <option value={EstadoOrdenCambio.CANCELADA}>Cancelada</option>
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredOrdenes}
          keyExtractor={(orden) => orden.id_orden_cambio!}
          actions={actions}
          noDataMessage="No se encontraron órdenes de cambio"
          itemsPerPage={15}
        />
      </main>

      {/* Modal de Detalle */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '700px' }}>
            <div className={styles.modalHeader}>
              <h2>📋 Detalle Orden de Cambio</h2>
              <button className={styles.closeButton} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>N° Orden:</strong>
                  <span>{currentOrden.numero_orden_cambio}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>N° SE:</strong>
                  <span>{currentOrden.numero_solicitud_equipo}</span>
                </div>

                <div className={styles.detailItem}>
                  <strong>Estado:</strong>
                  {getEstadoBadge(currentOrden.estado)}
                </div>

                <div className={styles.detailItem}>
                  <strong>Fecha Creación:</strong>
                  <span>{formatDate(currentOrden.fecha_creacion)}</span>
                </div>

                <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                  <strong>Cliente:</strong>
                  <span>{currentOrden.nombre_cliente}</span>
                </div>

                <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                  <strong>Equipo Actual (a recoger):</strong>
                  <span style={{ color: '#dc3545', fontWeight: '600' }}>
                    {currentOrden.nombre_equipo_actual}
                  </span>
                </div>

                <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                  <strong>Equipo Nuevo (a entregar):</strong>
                  <span style={{ color: '#28a745', fontWeight: '600' }}>
                    {currentOrden.nombre_equipo_nuevo}
                  </span>
                </div>

                <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                  <strong>Motivo del Cambio:</strong>
                  <p style={{ margin: '0.5rem 0', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px' }}>
                    {currentOrden.motivo_cambio || '-'}
                  </p>
                </div>

                {currentOrden.observaciones && (
                  <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                    <strong>Observaciones:</strong>
                    <p style={{ margin: '0.5rem 0', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px' }}>
                      {currentOrden.observaciones}
                    </p>
                  </div>
                )}

                <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                  <strong>Dirección:</strong>
                  <p style={{ margin: '0.5rem 0' }}>
                    {currentOrden.provincia}, {currentOrden.canton}, {currentOrden.distrito}
                    {currentOrden.otras_senas && <><br />{currentOrden.otras_senas}</>}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <Footer />
    </div>
  );
};

export default OrdenesCambio;
