import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Vibrador.module.css';

interface Vibrador {
  id_vibrador?: number;
  nombre_equipo: string;
  descripcion_vibrador?: string;
  voltaje_vibrador?: string;
  estado_vibrador?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
}

const Vibradores: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [vibradores, setVibradores] = useState<Vibrador[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVibrador, setCurrentVibrador] = useState<Vibrador>({
    nombre_equipo: '',
    descripcion_vibrador: '',
    voltaje_vibrador: '',
    estado_vibrador: true,
    precio_equipo: undefined,
    precio_mes: undefined,
    precio_quincena: undefined,
    precio_semana: undefined,
    precio_dia: undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (usuario && usuario.usuario_rol !== 1) {
      router.push('/');
      return;
    }
  }, [usuario, router]);

  useEffect(() => {
    fetchVibradores();
  }, []);

  const fetchVibradores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vibrador');
      const result = await response.json();
      setVibradores(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar vibradores:', error);
      setVibradores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/vibrador/${currentVibrador.id_vibrador}` : '/api/vibrador';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentVibrador),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchVibradores();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el vibrador: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar vibrador:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el vibrador. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vibrador: Vibrador) => {
    setCurrentVibrador(vibrador);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar vibrador?',
      message: '¿Estás seguro de que deseas eliminar este vibrador? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/vibrador/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchVibradores();
          }
        } catch (error) {
          console.error('Error al eliminar vibrador:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentVibrador({
      nombre_equipo: '',
      descripcion_vibrador: '',
      voltaje_vibrador: '',
      estado_vibrador: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentVibrador({
      nombre_equipo: '',
      descripcion_vibrador: '',
      voltaje_vibrador: '',
      estado_vibrador: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
  };

  const filteredVibradores = vibradores.filter(vibrador =>
    vibrador.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vibrador.descripcion_vibrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vibrador.voltaje_vibrador?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Vibrador>[] = [
    { key: 'nombre_equipo', header: 'Nombre', width: '120px' },
    { 
      key: 'descripcion_vibrador', 
      header: 'Descripción',
      render: (vibrador) => vibrador.descripcion_vibrador || '-'
    },
    { 
      key: 'voltaje_vibrador', 
      header: 'Voltaje',
      width: '120px',
      render: (vibrador) => vibrador.voltaje_vibrador || '-'
    },
    { 
      key: 'estado_vibrador', 
      header: 'Estado',
      width: '100px',
      render: (vibrador) => (
        <span className={vibrador.estado_vibrador ? styles.statusActive : styles.statusInactive}>
          {vibrador.estado_vibrador ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Vibrador>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    }
    // Botón de eliminar ocultado - usar estado inactivo en su lugar
    // {
    //   label: 'Eliminar',
    //   onClick: (vibrador) => handleDelete(vibrador.id_vibrador!),
    //   className: styles.btnDelete
    // }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Vibradores</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Vibrador
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar vibradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredVibradores}
          actions={actions}
          keyExtractor={(vibrador) => vibrador.id_vibrador!}
          noDataMessage="No se encontraron vibradores"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Vibrador' : 'Nuevo Vibrador'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={currentVibrador.nombre_equipo}
                      onChange={(e) =>
                        setCurrentVibrador({ ...currentVibrador, nombre_equipo: e.target.value })
                      }
                      required
                      placeholder="Ej: VIB-001"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Voltaje</label>
                    <input
                      type="text"
                      value={currentVibrador.voltaje_vibrador || ''}
                      onChange={(e) =>
                        setCurrentVibrador({ ...currentVibrador, voltaje_vibrador: e.target.value })
                      }
                      placeholder="Ej: 220V"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Descripción</label>
                    <textarea
                      value={currentVibrador.descripcion_vibrador || ''}
                      onChange={(e) =>
                        setCurrentVibrador({ ...currentVibrador, descripcion_vibrador: e.target.value })
                      }
                      placeholder="Descripción del vibrador"
                      rows={3}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Precio Equipo</label>
                    <input
                      type="number"
                      value={currentVibrador.precio_equipo ?? ''}
                      onChange={(e) =>
                        setCurrentVibrador({ ...currentVibrador, precio_equipo: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                      placeholder="₡0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.toggleContainer}>
                      <label className={styles.toggleLabel}>Estado</label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={currentVibrador.estado_vibrador}
                          onChange={(e) =>
                            setCurrentVibrador({ ...currentVibrador, estado_vibrador: e.target.checked })
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.priceSection}>
                    <h3 className={styles.sectionTitle}>Precios de Alquiler</h3>
                    <div className={styles.priceGrid}>
                      <div className={styles.formGroup}>
                        <label>Precio por Día</label>
                        <input
                          type="number"
                          value={currentVibrador.precio_dia ?? ''}
                          onChange={(e) =>
                            setCurrentVibrador({ ...currentVibrador, precio_dia: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio por Semana</label>
                        <input
                          type="number"
                          value={currentVibrador.precio_semana ?? ''}
                          onChange={(e) =>
                            setCurrentVibrador({ ...currentVibrador, precio_semana: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio por Quincena</label>
                        <input
                          type="number"
                          value={currentVibrador.precio_quincena ?? ''}
                          onChange={(e) =>
                            setCurrentVibrador({ ...currentVibrador, precio_quincena: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio por Mes</label>
                        <input
                          type="number"
                          value={currentVibrador.precio_mes ?? ''}
                          onChange={(e) =>
                            setCurrentVibrador({ ...currentVibrador, precio_mes: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSubmit}>
                    {isEditing ? 'Actualizar' : 'Guardar'}
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
        confirmText={confirmDialog.title.includes('Eliminar') || confirmDialog.title.includes('eliminar') ? 'Eliminar' : 'Aceptar'}
        cancelText="Cancelar"
        type={confirmDialog.type}
        showCancel={confirmDialog.title.includes('Eliminar') || confirmDialog.title.includes('eliminar')}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default Vibradores;
