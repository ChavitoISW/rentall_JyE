import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Rompedor.module.css';

interface Rompedor {
  id_rompedor?: number;
  nombre_equipo?: string;
  capacidad_rompedor?: string;
  voltaje_rompedor?: string;
  estado_rompedor?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
}

const Rompedores: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [rompedores, setRompedores] = useState<Rompedor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRompedor, setCurrentRompedor] = useState<Rompedor>({
    nombre_equipo: '',
    capacidad_rompedor: '',
    voltaje_rompedor: '',
    estado_rompedor: true,
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
    fetchRompedores();
  }, []);

  const fetchRompedores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rompedor');
      const result = await response.json();
      setRompedores(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar rompedores:', error);
      setRompedores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/rompedor/${currentRompedor.id_rompedor}` : '/api/rompedor';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentRompedor),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchRompedores();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el rompedor: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar rompedor:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el rompedor. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rompedor: Rompedor) => {
    setCurrentRompedor(rompedor);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar rompedor?',
      message: '¿Estás seguro de que deseas eliminar este rompedor? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/rompedor/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchRompedores();
          }
        } catch (error) {
          console.error('Error al eliminar rompedor:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentRompedor({
      nombre_equipo: '',
      capacidad_rompedor: '',
      voltaje_rompedor: '',
      estado_rompedor: true,
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
    setCurrentRompedor({
      nombre_equipo: '',
      capacidad_rompedor: '',
      voltaje_rompedor: '',
      estado_rompedor: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
  };

  const filteredRompedores = rompedores.filter(rompedor =>
    rompedor.nombre_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rompedor.capacidad_rompedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rompedor.voltaje_rompedor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Rompedor>[] = [
    { key: 'nombre_equipo', header: 'Nombre' },
    { 
      key: 'capacidad_rompedor', 
      header: 'Capacidad',
      render: (rompedor) => rompedor.capacidad_rompedor || '-'
    },
    { 
      key: 'voltaje_rompedor', 
      header: 'Voltaje',
      render: (rompedor) => rompedor.voltaje_rompedor || '-'
    },
    { 
      key: 'estado_rompedor', 
      header: 'Estado',
      width: '100px',
      render: (rompedor) => (
        <span className={rompedor.estado_rompedor ? styles.statusActive : styles.statusInactive}>
          {rompedor.estado_rompedor ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Rompedor>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    },
    {
      label: 'Eliminar',
      onClick: (rompedor) => handleDelete(rompedor.id_rompedor!),
      className: styles.btnDelete
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Rompedores</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Rompedor
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar rompedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredRompedores}
          actions={actions}
          keyExtractor={(rompedor) => rompedor.id_rompedor!}
          noDataMessage="No se encontraron rompedores"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Rompedor' : 'Nuevo Rompedor'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Nombre del Equipo</label>
                    <input
                      type="text"
                      value={currentRompedor.nombre_equipo || ''}
                      onChange={(e) =>
                        setCurrentRompedor({ ...currentRompedor, nombre_equipo: e.target.value })
                      }
                      placeholder="Nombre adicional del equipo"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Capacidad</label>
                    <input
                      type="text"
                      value={currentRompedor.capacidad_rompedor || ''}
                      onChange={(e) =>
                        setCurrentRompedor({ ...currentRompedor, capacidad_rompedor: e.target.value })
                      }
                      placeholder="Ej: 1000 kg"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Voltaje</label>
                    <input
                      type="text"
                      value={currentRompedor.voltaje_rompedor || ''}
                      onChange={(e) =>
                        setCurrentRompedor({ ...currentRompedor, voltaje_rompedor: e.target.value })
                      }
                      placeholder="Ej: 220V"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Precio Equipo</label>
                    <input
                      type="number"
                      value={currentRompedor.precio_equipo ?? ''}
                      onChange={(e) =>
                        setCurrentRompedor({ ...currentRompedor, precio_equipo: e.target.value ? parseInt(e.target.value) : undefined })
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
                          checked={currentRompedor.estado_rompedor}
                          onChange={(e) =>
                            setCurrentRompedor({ ...currentRompedor, estado_rompedor: e.target.checked })
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
                          value={currentRompedor.precio_dia ?? ''}
                          onChange={(e) =>
                            setCurrentRompedor({ ...currentRompedor, precio_dia: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio por Semana</label>
                        <input
                          type="number"
                          value={currentRompedor.precio_semana ?? ''}
                          onChange={(e) =>
                            setCurrentRompedor({ ...currentRompedor, precio_semana: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio por Quincena</label>
                        <input
                          type="number"
                          value={currentRompedor.precio_quincena ?? ''}
                          onChange={(e) =>
                            setCurrentRompedor({ ...currentRompedor, precio_quincena: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio por Mes</label>
                        <input
                          type="number"
                          value={currentRompedor.precio_mes ?? ''}
                          onChange={(e) =>
                            setCurrentRompedor({ ...currentRompedor, precio_mes: e.target.value ? parseInt(e.target.value) : undefined })
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

export default Rompedores;
