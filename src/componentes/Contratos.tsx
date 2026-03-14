import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import { EstadoContrato, EstadoContratoLabels, Contrato } from '../types/contrato';
import styles from '../styles/SolicitudEquipo.module.css';

interface ContratoExtendido extends Contrato {
  numero_solicitud_equipo?: string;
  id_cliente?: number;
  nombre_cliente?: string;
  fecha_vencimiento?: string;
  estadoVencimiento?: 'vencido' | 'porVencer' | 'normal';
}

const Contratos: React.FC = () => {
  const [contratos, setContratos] = useState<ContratoExtendido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | 'todos'>('todos');
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [contratoToAnular, setContratoToAnular] = useState<ContratoExtendido | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchContratos();
  }, []);

  const fetchContratos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contrato');
      if (response.ok) {
        const result = await response.json();
        const contratosData = Array.isArray(result.data) ? result.data : [];
        
        // Para cada contrato en estado GENERADO, verificar el estado de vencimiento de los detalles
        const contratosConEstado = await Promise.all(
          contratosData.map(async (contrato: ContratoExtendido) => {
            if (contrato.estado === EstadoContrato.GENERADO && contrato.numero_solicitud_equipo) {
              try {
                const detallesResponse = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${contrato.numero_solicitud_equipo}`);
                const detallesResult = await detallesResponse.json();
                
                if (Array.isArray(detallesResult.data) && detallesResult.data.length > 0) {
                  const fechaActual = new Date();
                  fechaActual.setHours(0, 0, 0, 0);
                  
                  let hayVencido = false;
                  let hayPorVencer = false;
                  
                  for (const detalle of detallesResult.data) {
                    if (detalle.fecha_devolucion) {
                      const fechaDevolucion = new Date(detalle.fecha_devolucion);
                      fechaDevolucion.setHours(0, 0, 0, 0);
                      
                      const diferenciaDias = Math.ceil((fechaDevolucion.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (diferenciaDias <= 1) {
                        hayVencido = true;
                        break;
                      } else if (diferenciaDias <= 3) {
                        hayPorVencer = true;
                      }
                    }
                  }
                  
                  return {
                    ...contrato,
                    estadoVencimiento: hayVencido ? 'vencido' : hayPorVencer ? 'porVencer' : 'normal'
                  };
                }
              } catch (error) {
                console.error('Error al verificar detalles de contrato:', error);
              }
            }
            
            return { ...contrato, estadoVencimiento: 'normal' };
          })
        );
        
        setContratos(contratosConEstado);
      }
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      setContratos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContratos = contratos.filter(contrato => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (contrato.numero_solicitud_equipo?.toLowerCase() || '').includes(search) ||
      (contrato.nombre_cliente?.toLowerCase() || '').includes(search)
    );
    
    const matchesEstado = 
      estadoFiltro === 'todos' ? true :
      contrato.estado === estadoFiltro;
    
    return matchesSearch && matchesEstado;
  });

  const columns: Column<ContratoExtendido>[] = [
    { 
      key: 'id_contrato', 
      header: '# Contrato', 
      width: '140px' 
    },
    { 
      key: 'numero_solicitud_equipo', 
      header: 'Solicitud', 
      width: '160px',
      render: (c) => (
        <a 
          href={`/solicitudes-equipos?numero=${c.numero_solicitud_equipo}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkSolicitud}
        >
          {c.numero_solicitud_equipo}
        </a>
      )
    },
    { 
      key: 'nombre_cliente', 
      header: 'Cliente', 
      width: '250px' 
    },
    { 
      key: 'estado', 
      header: 'Estado',
      width: '180px',
      render: (c) => {
        const estado = c.estado !== undefined && c.estado !== null ? c.estado : EstadoContrato.GENERADO;
        const label = EstadoContratoLabels[estado as EstadoContrato] || 'Desconocido';
        
        let className = styles.statusActive;
        if (estado === EstadoContrato.ANULADO) {
          className = styles.statusInactive;
        } else if (estado === EstadoContrato.FINALIZADO) {
          className = styles.statusFinalizado;
        } else if (estado === EstadoContrato.PENDIENTE_PAGO) {
          className = styles.statusSuccess;
        }
        
        return <span className={className}>{label}</span>;
      }
    },
    { 
      key: 'fecha_vencimiento', 
      header: 'Vencimiento',
      width: '180px',
      render: (c) => {
        if (!c.fecha_vencimiento) return '-';
        
        const fechaVencimiento = new Date(c.fecha_vencimiento);
        
        let className = '';
        if (c.estadoVencimiento === 'vencido') {
          className = styles.fechaVencida;
        } else if (c.estadoVencimiento === 'porVencer') {
          className = styles.fechaPorVencer;
        }
        
        return (
          <span className={className}>
            {fechaVencimiento.toLocaleDateString('es-CR')}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      header: 'Creación',
      width: '180px',
      render: (c) => c.created_at ? new Date(c.created_at).toLocaleDateString('es-CR') : '-'
    }
  ];

  const handleDescargarPDF = async (contrato: ContratoExtendido) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/contrato/pdf?id=${contrato.id_contrato}`);
      
      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${contrato.numero_solicitud_equipo || contrato.id_contrato}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setConfirmDialog({
        isOpen: true,
        title: 'Éxito',
        message: 'El PDF del contrato se descargó correctamente',
        type: 'info',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo descargar el PDF del contrato',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVistaPreviaPDF = async (contrato: ContratoExtendido) => {
    try {
      setIsLoading(true);
      const url = `/api/contrato/pdf?id_solicitud_equipo=${contrato.id_solicitud_equipo}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al abrir vista previa:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo abrir la vista previa del PDF',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnular = async (contrato: ContratoExtendido) => {
    if (contrato.estado === EstadoContrato.ANULADO) {
      setConfirmDialog({
        isOpen: true,
        title: 'Contrato ya anulado',
        message: 'Este contrato ya se encuentra en estado anulado.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    setContratoToAnular(contrato);
    setMotivoAnulacion('');
    setShowAnularModal(true);
  };

  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      alert('Debe ingresar un motivo de anulación');
      return;
    }

    if (!contratoToAnular) return;

    setShowAnularModal(false);
    setConfirmDialog({
      isOpen: true,
      title: '¿Anular contrato?',
      message: '¿Estás seguro de que deseas anular este contrato? Esta acción regresará la solicitud a estado SOLICITUD y los equipos a estado RESERVADO.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/contrato/anular/${contratoToAnular.id_contrato}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              motivo_anulacion: motivoAnulacion,
              usuario_anulacion: 'Usuario'
            }),
          });

          if (response.ok) {
            // Recargar contratos inmediatamente
            await fetchContratos();
            
            setConfirmDialog({
              isOpen: true,
              title: 'Éxito',
              message: 'Contrato anulado exitosamente. La solicitud ha sido revertida a estado SOLICITUD.',
              type: 'info',
              onConfirm: () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
              }
            });
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al anular contrato');
          }
        } catch (error: any) {
          console.error('Error al anular contrato:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: error.message || 'No se pudo anular el contrato',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const actions: TableAction<ContratoExtendido>[] = [
    {
      label: 'Vista Previa PDF',
      onClick: handleVistaPreviaPDF,
      className: styles.btnEdit
    },
    {
      label: 'Anular',
      onClick: handleAnular,
      className: styles.btnAnular,
      tooltip: 'Anular contrato'
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Contratos</h1>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar contratos..."
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
            {Object.entries(EstadoContratoLabels).map(([value, label]: [string, string]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredContratos}
          actions={actions}
          keyExtractor={(c) => c.id_contrato!}
          noDataMessage="No se encontraron contratos"
        />
      </main>

      <Footer />
      
      {/* Modal de Anulación */}
      {showAnularModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAnularModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Anular Contrato</h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAnularModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Contrato: <strong>#{contratoToAnular?.id_contrato}</strong><br />
                Cliente: <strong>{contratoToAnular?.nombre_cliente}</strong>
              </p>
              <label className={styles.modalLabel}>
                Motivo de anulación <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                className={styles.modalTextarea}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ingrese el motivo por el cual se anula este contrato..."
                rows={4}
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowAnularModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnAnularConfirm}
                onClick={confirmarAnulacion}
                disabled={!motivoAnulacion.trim()}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Aceptar"
        cancelText="Cancelar"
        type={confirmDialog.type}
        showCancel={false}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default Contratos;
