import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/SolicitudEquipo.module.css';

interface SolicitudVacaciones {
  id_solicitud_vacaciones?: number;
  id_empleado: number;
  fecha_solicitud: string;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_dias: number;
  dias_disponibles: number;
  estado?: string;
  observaciones?: string;
  nombre_empleado?: string;
  apellidos_empleado?: string;
}

interface Empleado {
  id_empleado: number;
  nombre: string;
  apellidos: string;
}

interface DiasDisponibles {
  dias_acumulados: number;
  dias_usados: number;
  dias_disponibles: number;
}

const SolicitudesVacaciones: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudVacaciones[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diasInfo, setDiasInfo] = useState<DiasDisponibles | null>(null);
  const [currentSolicitud, setCurrentSolicitud] = useState<SolicitudVacaciones>({
    id_empleado: 0,
    fecha_solicitud: new Date().toISOString().split('T')[0],
    fecha_inicio: '',
    fecha_fin: '',
    cantidad_dias: 0,
    dias_disponibles: 0,
    estado: 'pendiente',
    observaciones: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  // Función para formatear fecha sin ajuste de zona horaria
  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '-';
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return fecha.toLocaleDateString('es-CR');
  };

  useEffect(() => {
    if (usuario && usuario.usuario_rol !== 1) {
      router.push('/');
      return;
    }
  }, [usuario, router]);

  useEffect(() => {
    fetchSolicitudes();
    fetchEmpleados();
  }, []);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/solicitud-vacaciones');
      const result = await response.json();
      setSolicitudes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setSolicitudes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await fetch('/api/empleado');
      const result = await response.json();
      setEmpleados(Array.isArray(result.data) ? result.data.filter((e: any) => e.estado === 1) : []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setEmpleados([]);
    }
  };

  const fetchDiasDisponibles = async (id_empleado: number) => {
    try {
      const response = await fetch(`/api/solicitud-vacaciones/empleado/${id_empleado}`);
      const result = await response.json();
      if (result.success) {
        setDiasInfo(result.data);
        setCurrentSolicitud(prev => ({ ...prev, dias_disponibles: result.data.dias_disponibles }));
      }
    } catch (error) {
      console.error('Error al calcular días disponibles:', error);
    }
  };

  const calcularDias = () => {
    if (currentSolicitud.fecha_inicio && currentSolicitud.fecha_fin) {
      const inicio = new Date(currentSolicitud.fecha_inicio);
      const fin = new Date(currentSolicitud.fecha_fin);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
      setCurrentSolicitud(prev => ({ ...prev, cantidad_dias: diffDays }));
    }
  };

  useEffect(() => {
    calcularDias();
  }, [currentSolicitud.fecha_inicio, currentSolicitud.fecha_fin]);

  useEffect(() => {
    if (currentSolicitud.id_empleado > 0) {
      fetchDiasDisponibles(currentSolicitud.id_empleado);
    }
  }, [currentSolicitud.id_empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar si excede los días disponibles
    if (currentSolicitud.cantidad_dias > diasInfo!.dias_disponibles && !isEditing) {
      const diasFaltantes = currentSolicitud.cantidad_dias - diasInfo!.dias_disponibles;
      const saldoFinal = diasInfo!.dias_disponibles - currentSolicitud.cantidad_dias;
      
      setConfirmDialog({
        isOpen: true,
        title: '⚠️ Advertencia: Días insuficientes',
        message: `El empleado tiene ${diasInfo!.dias_disponibles} días disponibles.\n\nEstás solicitando ${currentSolicitud.cantidad_dias} días, lo cual excede por ${diasFaltantes} día${diasFaltantes > 1 ? 's' : ''}.\n\nEl saldo quedará en: ${saldoFinal} día${Math.abs(saldoFinal) > 1 ? 's' : ''} (negativo).\n\n¿Deseas continuar con esta solicitud?`,
        type: 'warning',
        onConfirm: async () => {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          await guardarSolicitud();
        }
      });
      return;
    }

    // Si no excede o está editando, guardar directamente
    await guardarSolicitud();
  };

  const guardarSolicitud = async () => {
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/solicitud-vacaciones/${currentSolicitud.id_solicitud_vacaciones}` : '/api/solicitud-vacaciones';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSolicitud),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchSolicitudes();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar la solicitud: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar solicitud:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar la solicitud. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (solicitud: SolicitudVacaciones) => {
    setCurrentSolicitud({
      ...solicitud,
      fecha_solicitud: solicitud.fecha_solicitud ? solicitud.fecha_solicitud.split('T')[0] : '',
      fecha_inicio: solicitud.fecha_inicio ? solicitud.fecha_inicio.split('T')[0] : '',
      fecha_fin: solicitud.fecha_fin ? solicitud.fecha_fin.split('T')[0] : ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar solicitud?',
      message: '¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/solicitud-vacaciones/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchSolicitudes();
          }
        } catch (error) {
          console.error('Error al eliminar solicitud:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentSolicitud({
      id_empleado: 0,
      fecha_solicitud: new Date().toISOString().split('T')[0],
      fecha_inicio: '',
      fecha_fin: '',
      cantidad_dias: 0,
      dias_disponibles: 0,
      estado: 'pendiente',
      observaciones: '',
    });
    setDiasInfo(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSolicitud({
      id_empleado: 0,
      fecha_solicitud: new Date().toISOString().split('T')[0],
      fecha_inicio: '',
      fecha_fin: '',
      cantidad_dias: 0,
      dias_disponibles: 0,
      estado: 'pendiente',
      observaciones: '',
    });
    setDiasInfo(null);
    setIsEditing(false);
  };

  const filteredSolicitudes = solicitudes.filter(solicitud =>
    solicitud.nombre_empleado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.apellidos_empleado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitud.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        fontWeight: 500,
        background: badge.bg,
        color: badge.text
      }}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const columns: Column<SolicitudVacaciones>[] = [
    { 
      key: 'nombre_empleado', 
      header: 'Empleado', 
      width: '200px',
      render: (s) => `${s.nombre_empleado} ${s.apellidos_empleado}`
    },
    { 
      key: 'fecha_solicitud', 
      header: 'Fecha Solicitud',
      width: '130px',
      render: (s) => formatearFecha(s.fecha_solicitud)
    },
    { 
      key: 'fecha_inicio', 
      header: 'Fecha Inicio',
      width: '130px',
      render: (s) => formatearFecha(s.fecha_inicio)
    },
    { 
      key: 'fecha_fin', 
      header: 'Fecha Fin',
      width: '130px',
      render: (s) => formatearFecha(s.fecha_fin)
    },
    { 
      key: 'cantidad_dias', 
      header: 'Días',
      width: '80px',
      render: (s) => s.cantidad_dias
    },
    { 
      key: 'estado', 
      header: 'Estado',
      width: '120px',
      render: (s) => getEstadoBadge(s.estado || 'pendiente')
    }
  ];

  const actions: TableAction<SolicitudVacaciones>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Solicitudes de Vacaciones</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nueva Solicitud
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredSolicitudes}
          actions={actions}
          keyExtractor={(solicitud) => solicitud.id_solicitud_vacaciones!}
          noDataMessage="No se encontraron solicitudes"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>🏖️</span>
                  <h2 style={{ margin: 0 }}>{isEditing ? 'Editar Solicitud' : 'Nueva Solicitud de Vacaciones'}</h2>
                </div>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.formContainer}>
                <div className={styles.formGrid}>
                  {/* Sección: Selección de Empleado */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '1rem 1.2rem',
                      borderRadius: '8px 8px 0 0',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>👤</span>
                      <span>Selección de Empleado</span>
                    </div>
                    <div style={{ 
                      padding: '1.2rem',
                      border: '2px solid #667eea',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      background: 'white'
                    }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                        Empleado *
                      </label>
                      <select
                        value={currentSolicitud.id_empleado}
                        onChange={(e) =>
                          setCurrentSolicitud({ ...currentSolicitud, id_empleado: parseInt(e.target.value) })
                        }
                        required
                        disabled={isEditing}
                        style={{
                          width: '100%',
                          padding: '0.9rem',
                          border: '2px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          cursor: isEditing ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value={0}>Seleccione un empleado</option>
                        {empleados.map(emp => (
                          <option key={emp.id_empleado} value={emp.id_empleado}>
                            {emp.nombre} {emp.apellidos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!diasInfo && currentSolicitud.id_empleado > 0 && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)', 
                        padding: '1.2rem', 
                        borderRadius: '10px', 
                        border: '2px solid #ffc107',
                        textAlign: 'center',
                        color: '#856404',
                        fontSize: '1rem',
                        fontWeight: '500',
                        boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                        Calculando días disponibles...
                      </div>
                    </div>
                  )}

                  {diasInfo && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginBottom: '1.5rem' }}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                        padding: '1rem 1.2rem',
                        borderRadius: '8px 8px 0 0',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>📊</span>
                        <span>Resumen de Vacaciones</span>
                      </div>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #e7f3ff 0%, #d4e7f7 100%)', 
                        padding: '1.5rem', 
                        borderRadius: '0 0 8px 8px', 
                        border: '2px solid #4a90e2',
                        borderTop: 'none',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1.5rem'
                      }}>
                        <div style={{ 
                          textAlign: 'center',
                          background: 'white',
                          padding: '1rem',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Días Acumulados
                          </div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#4a90e2' }}>
                            {diasInfo.dias_acumulados}
                          </div>
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          background: 'white',
                          padding: '1rem',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✈️</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Días Usados
                          </div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#e74c3c' }}>
                            {diasInfo.dias_usados}
                          </div>
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                          padding: '1rem',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
                          border: '2px solid #28a745'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                          <div style={{ fontSize: '0.85rem', color: '#155724', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Días Disponibles
                          </div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#155724' }}>
                            {diasInfo.dias_disponibles}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSolicitud.id_empleado === 0 && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                        padding: '1.5rem', 
                        borderRadius: '10px', 
                        border: '2px dashed #dee2e6',
                        textAlign: 'center',
                        color: '#6c757d'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👆</div>
                        <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                          Seleccione un empleado para ver sus días de vacaciones disponibles
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sección: Fechas */}
                  {currentSolicitud.id_empleado > 0 && (
                    <>
                      <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.8rem',
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          borderRadius: '6px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          <span>📆</span>
                          <span>Fechas de Vacaciones</span>
                        </div>
                      </div>

                      <div className={`${styles.formGroup} ${styles.dateInputGroup}`}>
                        <label className={styles.dateLabel}>Fecha Solicitud *</label>
                        <input
                          type="date"
                          value={currentSolicitud.fecha_solicitud}
                          onChange={(e) =>
                            setCurrentSolicitud({ ...currentSolicitud, fecha_solicitud: e.target.value })
                          }
                          required
                          disabled={isEditing}
                        />
                      </div>

                      <div className={styles.formGroup}></div>

                      <div className={`${styles.formGroup} ${styles.dateInputGroup}`}>
                        <label className={styles.dateLabel}>Fecha Inicio *</label>
                        <input
                          type="date"
                          value={currentSolicitud.fecha_inicio}
                          onChange={(e) =>
                            setCurrentSolicitud({ ...currentSolicitud, fecha_inicio: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className={`${styles.formGroup} ${styles.dateInputGroup}`}>
                        <label className={styles.dateLabel}>Fecha Fin *</label>
                        <input
                          type="date"
                          value={currentSolicitud.fecha_fin}
                          onChange={(e) =>
                            setCurrentSolicitud({ ...currentSolicitud, fecha_fin: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>⏱️</span>
                          <span>Cantidad de Días</span>
                        </label>
                        <input
                          type="number"
                          value={currentSolicitud.cantidad_dias}
                          readOnly
                          disabled
                          style={{ 
                            background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)', 
                            cursor: 'not-allowed',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: '#4a90e2'
                          }}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📋</span>
                          <span>Estado</span>
                        </label>
                        <select
                          value={currentSolicitud.estado}
                          onChange={(e) =>
                            setCurrentSolicitud({ ...currentSolicitud, estado: e.target.value })
                          }
                          style={{
                            padding: '0.9rem',
                            border: '2px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '1rem'
                          }}
                        >
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="aprobada">✅ Aprobada</option>
                          <option value="rechazada">❌ Rechazada</option>
                        </select>
                      </div>

                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span>💬</span>
                          <span>Observaciones</span>
                        </label>
                        <textarea
                          value={currentSolicitud.observaciones || ''}
                          onChange={(e) =>
                            setCurrentSolicitud({ ...currentSolicitud, observaciones: e.target.value })
                          }
                          rows={4}
                          placeholder="Agregue cualquier observación o comentario adicional..."
                          style={{
                            padding: '0.9rem',
                            border: '2px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.modalActions} style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e0e0e0' }}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>
                    ❌ Cancelar
                  </button>
                  <button type="submit" className={styles.btnSubmit}>
                    {isEditing ? '✅ Actualizar Solicitud' : '✅ Guardar Solicitud'}
                  </button>
                </div>
              </form>
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
        showCancel={confirmDialog.type === 'danger' || confirmDialog.type === 'warning'}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default SolicitudesVacaciones;
