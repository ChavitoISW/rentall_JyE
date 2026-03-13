import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/CategoriaEquipo.module.css';

interface CategoriaEquipo {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
}

const CategoriaEquipo: React.FC = () => {  const router = useRouter();
  const { usuario } = useAuth();  const [categorias, setCategorias] = useState<CategoriaEquipo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState<CategoriaEquipo>({
    nombre: '',
    descripcion: '',
    estado: true,
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
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categoria-equipo');
      const result = await response.json();
      setCategorias(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/categoria-equipo/${currentCategoria.id}` : '/api/categoria-equipo';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentCategoria),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchCategorias();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar la categoría: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar la categoría. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (categoria: CategoriaEquipo) => {
    setCurrentCategoria(categoria);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar categoría?',
      message: '¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/categoria-equipo/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchCategorias();
          }
        } catch (error) {
          console.error('Error al eliminar categoría:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentCategoria({
      nombre: '',
      descripcion: '',
      estado: true,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategoria({
      nombre: '',
      descripcion: '',
      estado: true,
    });
    setIsEditing(false);
  };

  const filteredCategorias = categorias.filter(cat =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<CategoriaEquipo>[] = [
    { key: 'nombre', header: 'Nombre' },
    { 
      key: 'descripcion', 
      header: 'Descripción',
      render: (cat) => cat.descripcion || '-'
    },
    { 
      key: 'estado', 
      header: 'Estado',
      render: (cat) => (
        <span className={cat.estado ? styles.statusActive : styles.statusInactive}>
          {cat.estado ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<CategoriaEquipo>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    },
    {
      label: 'Eliminar',
      onClick: (cat) => handleDelete(cat.id!),
      className: styles.btnDelete
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Categorías de Equipos</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nueva Categoría
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredCategorias}
          actions={actions}
          keyExtractor={(cat) => cat.id!}
          noDataMessage="No se encontraron categorías"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={currentCategoria.nombre}
                      onChange={(e) =>
                        setCurrentCategoria({ ...currentCategoria, nombre: e.target.value })
                      }
                      required
                      placeholder="Ej: Herramientas Eléctricas"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Estado</label>
                    <div className={styles.toggleContainer}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={currentCategoria.estado}
                          onChange={(e) =>
                            setCurrentCategoria({ ...currentCategoria, estado: e.target.checked })
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    value={currentCategoria.descripcion || ''}
                    onChange={(e) =>
                      setCurrentCategoria({ ...currentCategoria, descripcion: e.target.value })
                    }
                    placeholder="Descripción de la categoría"
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

export default CategoriaEquipo;
