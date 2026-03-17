import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Mezcladora.module.css';

interface Mezcladora {
  id_mezcladora?: number;
  nombre_equipo?: string;
  capacidad_mezcladora?: string;
  voltaje_mezcladora?: string;
  chasis_mezcladora?: string;
  estado_mezcladora?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
}

const Mezcladoras: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [mezcladoras, setMezcladoras] = useState<Mezcladora[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMezcladora, setCurrentMezcladora] = useState<Mezcladora>({
    nombre_equipo: '',
    capacidad_mezcladora: '',
    voltaje_mezcladora: '',
    chasis_mezcladora: '',
    estado_mezcladora: true,
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
    fetchMezcladoras();
  }, []);

  const fetchMezcladoras = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mezcladora');
      const result = await response.json();
      setMezcladoras(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar mezcladoras:', error);
      setMezcladoras([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/mezcladora/${currentMezcladora.id_mezcladora}` : '/api/mezcladora';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentMezcladora),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchMezcladoras();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar la mezcladora: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar mezcladora:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar la mezcladora. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (mezcladora: Mezcladora) => {
    setCurrentMezcladora(mezcladora);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar mezcladora?',
      message: '¿Estás seguro de que deseas eliminar esta mezcladora? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/mezcladora/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchMezcladoras();
          }
        } catch (error) {
          console.error('Error al eliminar mezcladora:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentMezcladora({
      nombre_equipo: '',
      capacidad_mezcladora: '',
      voltaje_mezcladora: '',
      chasis_mezcladora: '',
      estado_mezcladora: true,
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
    setCurrentMezcladora({
      nombre_equipo: '',
      capacidad_mezcladora: '',
      voltaje_mezcladora: '',
      chasis_mezcladora: '',
      estado_mezcladora: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
  };

  const filteredMezcladoras = mezcladoras.filter(mezcladora =>
    mezcladora.nombre_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mezcladora.capacidad_mezcladora?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mezcladora.voltaje_mezcladora?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mezcladora.chasis_mezcladora?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Mezcladora>[] = [
    { 
      key: 'nombre_equipo', 
      header: 'Nombre',
      render: (mezcladora) => mezcladora.nombre_equipo || '-'
    },
    { 
      key: 'capacidad_mezcladora', 
      header: 'Capacidad',
      render: (mezcladora) => mezcladora.capacidad_mezcladora || '-'
    },
    { 
      key: 'voltaje_mezcladora', 
      header: 'Voltaje',
      render: (mezcladora) => mezcladora.voltaje_mezcladora || '-'
    },
    { 
      key: 'chasis_mezcladora', 
      header: 'Chasis',
      render: (mezcladora) => mezcladora.chasis_mezcladora || '-'
    },
    { 
      key: 'estado_mezcladora', 
      header: 'Estado',
      width: '100px',
      render: (mezcladora) => (
        <span className={mezcladora.estado_mezcladora ? styles.statusActive : styles.statusInactive}>
          {mezcladora.estado_mezcladora ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Mezcladora>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    }
    // Botón de eliminar ocultado - usar estado inactivo en su lugar
    // {
    //   label: 'Eliminar',
    //   onClick: (mezcladora) => handleDelete(mezcladora.id_mezcladora!),
    //   className: styles.btnDelete
    // }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Mezcladoras</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nueva Mezcladora
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar mezcladoras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredMezcladoras}
          actions={actions}
          keyExtractor={(mezcladora) => mezcladora.id_mezcladora!}
          noDataMessage="No se encontraron mezcladoras"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Mezcladora' : 'Nueva Mezcladora'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={currentMezcladora.nombre_equipo || ''}
                      onChange={(e) =>
                        setCurrentMezcladora({ ...currentMezcladora, nombre_equipo: e.target.value })
                      }
                      placeholder="Nombre del equipo"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Capacidad</label>
                    <input
                      type="text"
                      value={currentMezcladora.capacidad_mezcladora || ''}
                      onChange={(e) =>
                        setCurrentMezcladora({ ...currentMezcladora, capacidad_mezcladora: e.target.value })
                      }
                      placeholder="Ej: 500 litros"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Voltaje</label>
                    <input
                      type="text"
                      value={currentMezcladora.voltaje_mezcladora || ''}
                      onChange={(e) =>
                        setCurrentMezcladora({ ...currentMezcladora, voltaje_mezcladora: e.target.value })
                      }
                      placeholder="Ej: 220V"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Chasis</label>
                    <input
                      type="text"
                      value={currentMezcladora.chasis_mezcladora || ''}
                      onChange={(e) =>
                        setCurrentMezcladora({ ...currentMezcladora, chasis_mezcladora: e.target.value })
                      }
                      placeholder="Ej: CH-001"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Precio Equipo</label>
                    <input
                      type="number"
                      value={currentMezcladora.precio_equipo ?? ''}
                      onChange={(e) =>
                        setCurrentMezcladora({ ...currentMezcladora, precio_equipo: e.target.value ? parseInt(e.target.value) : undefined })
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
                          checked={currentMezcladora.estado_mezcladora}
                          onChange={(e) =>
                            setCurrentMezcladora({ ...currentMezcladora, estado_mezcladora: e.target.checked })
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.priceSection}>
                    <h3 className={styles.sectionTitle}>Precios de Alquiler</h3>
                    <div className={styles.priceGrid}>
                      <div className={styles.formGroup}>
                        <label>Precio Día</label>
                        <input
                          type="number"
                          value={currentMezcladora.precio_dia ?? ''}
                          onChange={(e) =>
                            setCurrentMezcladora({ ...currentMezcladora, precio_dia: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Semana</label>
                        <input
                          type="number"
                          value={currentMezcladora.precio_semana ?? ''}
                          onChange={(e) =>
                            setCurrentMezcladora({ ...currentMezcladora, precio_semana: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Quincena</label>
                        <input
                          type="number"
                          value={currentMezcladora.precio_quincena ?? ''}
                          onChange={(e) =>
                            setCurrentMezcladora({ ...currentMezcladora, precio_quincena: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Mes</label>
                        <input
                          type="number"
                          value={currentMezcladora.precio_mes ?? ''}
                          onChange={(e) =>
                            setCurrentMezcladora({ ...currentMezcladora, precio_mes: e.target.value ? parseInt(e.target.value) : undefined })
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

export default Mezcladoras;
