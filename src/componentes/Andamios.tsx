import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Andamio.module.css';

interface Andamio {
  id_andamio?: number;
  ancho_andamio: string;
  largo_andamio: string;
  nombre_equipo?: string;
  estado_andamio?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
}

const Andamios: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [andamios, setAndamios] = useState<Andamio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAndamio, setCurrentAndamio] = useState<Andamio>({
    ancho_andamio: '',
    largo_andamio: '',
    nombre_equipo: '',
    estado_andamio: true,
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
    fetchAndamios();
  }, []);

  const fetchAndamios = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/andamio');
      const result = await response.json();
      setAndamios(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar andamios:', error);
      setAndamios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/andamio/${currentAndamio.id_andamio}` : '/api/andamio';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentAndamio),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchAndamios();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el andamio: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar andamio:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el andamio. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (andamio: Andamio) => {
    setCurrentAndamio(andamio);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar andamio?',
      message: '¿Estás seguro de que deseas eliminar este andamio? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/andamio/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchAndamios();
          }
        } catch (error) {
          console.error('Error al eliminar andamio:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentAndamio({
      ancho_andamio: '',
      largo_andamio: '',
      nombre_equipo: '',
      estado_andamio: true,
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
    setCurrentAndamio({
      ancho_andamio: '',
      largo_andamio: '',
      nombre_equipo: '',
      estado_andamio: true,
      precio_equipo: undefined,
      precio_mes: undefined,
      precio_quincena: undefined,
      precio_semana: undefined,
      precio_dia: undefined,
    });
    setIsEditing(false);
  };

  const filteredAndamios = andamios.filter(andamio =>
    andamio.ancho_andamio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    andamio.largo_andamio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Andamio>[] = [
    { 
      key: 'nombre_equipo', 
      header: 'Nombre',
      render: (andamio) => andamio.nombre_equipo || '-'
    },
    { key: 'ancho_andamio', header: 'Ancho' },
    { key: 'largo_andamio', header: 'Largo' },
    { 
      key: 'estado_andamio', 
      header: 'Estado',
      width: '100px',
      render: (andamio) => (
        <span className={andamio.estado_andamio ? styles.statusActive : styles.statusInactive}>
          {andamio.estado_andamio ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Andamio>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    }
    // Botón de eliminar ocultado - usar estado inactivo en su lugar
    // {
    //   label: 'Eliminar',
    //   onClick: (andamio) => handleDelete(andamio.id_andamio!),
    //   className: styles.btnDelete
    // }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Andamios</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Andamio
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar andamios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredAndamios}
          actions={actions}
          keyExtractor={(andamio) => andamio.id_andamio!}
          noDataMessage="No se encontraron andamios"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Andamio' : 'Nuevo Andamio'}</h2>
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
                      value={currentAndamio.nombre_equipo || ''}
                      onChange={(e) =>
                        setCurrentAndamio({ ...currentAndamio, nombre_equipo: e.target.value })
                      }
                      placeholder="Nombre del equipo"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Precio Equipo</label>
                    <input
                      type="number"
                      value={currentAndamio.precio_equipo ?? ''}
                      onChange={(e) =>
                        setCurrentAndamio({ ...currentAndamio, precio_equipo: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                      placeholder="₡0"
                    />
                  </div>



                  <div className={styles.formGroup}>
                    <label>Ancho *</label>
                    <input
                      type="text"
                      value={currentAndamio.ancho_andamio}
                      onChange={(e) =>
                        setCurrentAndamio({ ...currentAndamio, ancho_andamio: e.target.value })
                      }
                      required
                      placeholder="Ej: 1.5m"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Largo *</label>
                    <input
                      type="text"
                      value={currentAndamio.largo_andamio}
                      onChange={(e) =>
                        setCurrentAndamio({ ...currentAndamio, largo_andamio: e.target.value })
                      }
                      required
                      placeholder="Ej: 3m"
                    />
                  </div>

                 

                  <div className={styles.formGroup}>
                    <div className={styles.toggleContainer}>
                      <label className={styles.toggleLabel}>Estado</label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={currentAndamio.estado_andamio}
                          onChange={(e) =>
                            setCurrentAndamio({ ...currentAndamio, estado_andamio: e.target.checked })
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
                          value={currentAndamio.precio_dia ?? ''}
                          onChange={(e) =>
                            setCurrentAndamio({ ...currentAndamio, precio_dia: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Semana</label>
                        <input
                          type="number"
                          value={currentAndamio.precio_semana ?? ''}
                          onChange={(e) =>
                            setCurrentAndamio({ ...currentAndamio, precio_semana: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Quincena</label>
                        <input
                          type="number"
                          value={currentAndamio.precio_quincena ?? ''}
                          onChange={(e) =>
                            setCurrentAndamio({ ...currentAndamio, precio_quincena: e.target.value ? parseInt(e.target.value) : undefined })
                          }
                          placeholder="₡0"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Precio Mes</label>
                        <input
                          type="number"
                          value={currentAndamio.precio_mes ?? ''}
                          onChange={(e) =>
                            setCurrentAndamio({ ...currentAndamio, precio_mes: e.target.value ? parseInt(e.target.value) : undefined })
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

export default Andamios;
