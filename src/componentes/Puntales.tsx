import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Puntal.module.css';

interface Puntal {
  id_puntal?: number;
  nombre_puntal?: string;
  largo_puntal?: string;
  estado_puntal?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
}

const Puntales: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [puntales, setPuntales] = useState<Puntal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPuntal, setCurrentPuntal] = useState<Puntal>({
    nombre_puntal: '',
    largo_puntal: '',
    estado_puntal: true,
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
    fetchPuntales();
  }, []);

  const fetchPuntales = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/puntal');
      const result = await response.json();
      setPuntales(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar puntales:', error);
      setPuntales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/puntal/${currentPuntal.id_puntal}` : '/api/puntal';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentPuntal),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchPuntales();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el puntal: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar puntal:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el puntal. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (puntal: Puntal) => {
    setCurrentPuntal(puntal);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar puntal?',
      message: '¿Estás seguro de que deseas eliminar este puntal? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/puntal/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchPuntales();
          }
        } catch (error) {
          console.error('Error al eliminar puntal:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentPuntal({
      nombre_puntal: '',
      largo_puntal: '',
      estado_puntal: true,
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
    setCurrentPuntal({
      nombre_puntal: '',
      largo_puntal: '',
      estado_puntal: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
  };

  const filteredPuntales = puntales.filter(puntal =>
    puntal.nombre_puntal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    puntal.largo_puntal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Puntal>[] = [
    { 
      key: 'nombre_puntal', 
      header: 'Nombre',
      render: (puntal) => puntal.nombre_puntal || '-'
    },
    { 
      key: 'largo_puntal', 
      header: 'Largo',
      render: (puntal) => puntal.largo_puntal || '-'
    },
    { 
      key: 'estado_puntal', 
      header: 'Estado',
      width: '100px',
      render: (puntal) => (
        <span className={puntal.estado_puntal ? styles.statusActive : styles.statusInactive}>
          {puntal.estado_puntal ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Puntal>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    },
    {
      label: 'Eliminar',
      onClick: (puntal) => handleDelete(puntal.id_puntal!),
      className: styles.btnDelete
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Puntales</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Puntal
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar puntales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredPuntales}
          actions={actions}
          keyExtractor={(puntal) => puntal.id_puntal!}
          noDataMessage="No se encontraron puntales"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Puntal' : 'Nuevo Puntal'}</h2>
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
                      value={currentPuntal.nombre_puntal || ''}
                      onChange={(e) =>
                        setCurrentPuntal({ ...currentPuntal, nombre_puntal: e.target.value })
                      }
                      placeholder="Nombre del puntal"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Largo</label>
                    <input
                      type="text"
                      value={currentPuntal.largo_puntal || ''}
                      onChange={(e) =>
                        setCurrentPuntal({ ...currentPuntal, largo_puntal: e.target.value })
                      }
                      placeholder="Ej: 3.5 m"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Precio Equipo</label>
                    <input
                      type="number"
                      value={currentPuntal.precio_equipo ?? ''}
                      onChange={(e) =>
                        setCurrentPuntal({ ...currentPuntal, precio_equipo: e.target.value ? parseInt(e.target.value) : undefined })
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
                          checked={currentPuntal.estado_puntal}
                          onChange={(e) =>
                            setCurrentPuntal({ ...currentPuntal, estado_puntal: e.target.checked })
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
                          value={currentPuntal.precio_dia ?? ''}
                          onChange={(e) =>
                            setCurrentPuntal({ ...currentPuntal, precio_dia: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Semana</label>
                        <input
                          type="number"
                          value={currentPuntal.precio_semana ?? ''}
                          onChange={(e) =>
                            setCurrentPuntal({ ...currentPuntal, precio_semana: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Quincena</label>
                        <input
                          type="number"
                          value={currentPuntal.precio_quincena ?? ''}
                          onChange={(e) =>
                            setCurrentPuntal({ ...currentPuntal, precio_quincena: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Mes</label>
                        <input
                          type="number"
                          value={currentPuntal.precio_mes ?? ''}
                          onChange={(e) =>
                            setCurrentPuntal({ ...currentPuntal, precio_mes: e.target.value ? parseInt(e.target.value) : undefined })
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

export default Puntales;
