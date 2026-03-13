import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Rol.module.css';

interface Rol {
  id_rol?: number;
  nombre_rol: string;
  descripcion_rol?: string;
  estado_rol?: boolean;
}

const Roles: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRol, setCurrentRol] = useState<Rol>({
    nombre_rol: '',
    descripcion_rol: '',
    estado_rol: true,
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
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rol');
      const result = await response.json();
      setRoles(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/rol/${currentRol.id_rol}` : '/api/rol';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentRol),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchRoles();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el rol: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar rol:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el rol. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rol: Rol) => {
    setCurrentRol(rol);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar rol?',
      message: '¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/rol/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchRoles();
          }
        } catch (error) {
          console.error('Error al eliminar rol:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentRol({
      nombre_rol: '',
      descripcion_rol: '',
      estado_rol: true,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRol({
      nombre_rol: '',
      descripcion_rol: '',
      estado_rol: true,
    });
    setIsEditing(false);
  };

  const filteredRoles = roles.filter(rol =>
    rol.nombre_rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rol.descripcion_rol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Rol>[] = [
    { key: 'nombre_rol', header: 'Nombre del Rol' },
    { 
      key: 'descripcion_rol', 
      header: 'Descripción',
      render: (rol) => rol.descripcion_rol || '-'
    },
    { 
      key: 'estado_rol', 
      header: 'Estado',
      render: (rol) => (
        <span className={rol.estado_rol ? styles.statusActive : styles.statusInactive}>
          {rol.estado_rol ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Rol>[] = [
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
          <h1>Gestión de Roles</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Rol
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredRoles}
          actions={actions}
          keyExtractor={(rol) => rol.id_rol!}
          noDataMessage="No se encontraron roles"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Rol' : 'Nuevo Rol'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Rol *</label>
                    <input
                      type="text"
                      value={currentRol.nombre_rol}
                      onChange={(e) =>
                        setCurrentRol({ ...currentRol, nombre_rol: e.target.value })
                      }
                      required
                      placeholder="Ej: Administrador"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Estado</label>
                    <div className={styles.toggleContainer}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={currentRol.estado_rol}
                          onChange={(e) =>
                            setCurrentRol({ ...currentRol, estado_rol: e.target.checked })
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    value={currentRol.descripcion_rol || ''}
                    onChange={(e) =>
                      setCurrentRol({ ...currentRol, descripcion_rol: e.target.value })
                    }
                    placeholder="Descripción del rol y sus responsabilidades"
                    rows={4}
                  />
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

export default Roles;
