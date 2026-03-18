import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Compactador.module.css';

interface Compactador {
  id_compactador?: number;
  nombre_equipo: string;
  descripcion_equipo?: string;
  estado_equipo?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
}

const Compactadores: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [compactadores, setCompactadores] = useState<Compactador[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCompactador, setCurrentCompactador] = useState<Compactador>({
    nombre_equipo: '',
    descripcion_equipo: '',
    estado_equipo: true,
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
    fetchCompactadores();
  }, []);

  const fetchCompactadores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/compactador');
      const result = await response.json();
      setCompactadores(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar compactadores:', error);
      setCompactadores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/compactador/${currentCompactador.id_compactador}` : '/api/compactador';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentCompactador),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchCompactadores();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el compactador: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar compactador:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el compactador. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (compactador: Compactador) => {
    setCurrentCompactador(compactador);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar compactador?',
      message: '¿Estás seguro de que deseas eliminar este compactador? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/compactador/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchCompactadores();
          }
        } catch (error) {
          console.error('Error al eliminar compactador:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentCompactador({
      nombre_equipo: '',
      descripcion_equipo: '',
      estado_equipo: true,
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
    setCurrentCompactador({
      nombre_equipo: '',
      descripcion_equipo: '',
      estado_equipo: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
  };

  const filteredCompactadores = compactadores.filter(compactador =>
    compactador.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compactador.descripcion_equipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Compactador>[] = [
    { key: 'nombre_equipo', header: 'Nombre' },
    { 
      key: 'descripcion_equipo', 
      header: 'Descripción',
      render: (compactador) => compactador.descripcion_equipo || '-'
    },
    { 
      key: 'estado_equipo', 
      header: 'Estado',
      width: '100px',
      render: (compactador) => (
        <span className={compactador.estado_equipo ? styles.statusActive : styles.statusInactive}>
          {compactador.estado_equipo ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Compactador>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    }
    // Botón de eliminar ocultado - usar estado inactivo en su lugar
    // {
    //   label: 'Eliminar',
    //   onClick: (compactador) => handleDelete(compactador.id_compactador!),
    //   className: styles.btnDelete
    // }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Compactadores</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Compactador
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar compactadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredCompactadores}
          actions={actions}
          keyExtractor={(compactador) => compactador.id_compactador!}
          noDataMessage="No se encontraron compactadores"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Compactador' : 'Nuevo Compactador'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Nombre del Equipo *</label>
                    <input
                      type="text"
                      value={currentCompactador.nombre_equipo}
                      onChange={(e) =>
                        setCurrentCompactador({ ...currentCompactador, nombre_equipo: e.target.value })
                      }
                      required
                      placeholder="Ej: Compactador de Rodillo"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Descripción</label>
                    <textarea
                      value={currentCompactador.descripcion_equipo || ''}
                      onChange={(e) =>
                        setCurrentCompactador({ ...currentCompactador, descripcion_equipo: e.target.value })
                      }
                      placeholder="Descripción del compactador"
                      rows={3}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Precio Equipo</label>
                    <input
                      type="number"
                      min="0"
                      value={currentCompactador.precio_equipo ?? ''}
                      onChange={(e) =>
                        setCurrentCompactador({ ...currentCompactador, precio_equipo: e.target.value ? parseInt(e.target.value) : undefined })
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
                          checked={currentCompactador.estado_equipo}
                          onChange={(e) =>
                            setCurrentCompactador({ ...currentCompactador, estado_equipo: e.target.checked })
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
                          min="0"
                          value={currentCompactador.precio_dia ?? ''}
                          onChange={(e) =>
                            setCurrentCompactador({ ...currentCompactador, precio_dia: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Semana</label>
                        <input
                          type="number"
                          min="0"
                          value={currentCompactador.precio_semana ?? ''}
                          onChange={(e) =>
                            setCurrentCompactador({ ...currentCompactador, precio_semana: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Quincena</label>
                        <input
                          type="number"
                          min="0"
                          value={currentCompactador.precio_quincena ?? ''}
                          onChange={(e) =>
                            setCurrentCompactador({ ...currentCompactador, precio_quincena: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Mes</label>
                        <input
                          type="number"
                          min="0"
                          value={currentCompactador.precio_mes ?? ''}
                          onChange={(e) =>
                            setCurrentCompactador({ ...currentCompactador, precio_mes: e.target.value ? parseInt(e.target.value) : undefined })
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

export default Compactadores;
