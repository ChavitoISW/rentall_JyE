import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import SelectorDireccion, { DireccionSeleccionada } from './SelectorDireccion';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Usuario.module.css';

interface Usuario {
  id_usuario?: number;
  identificacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  telefono_usuario: string;
  email_usuario: string;
  contrasena_usuario?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  direccion_usuario: string;
  estado_usuario?: boolean;
  usuario_rol: number;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

const Usuarios: React.FC = () => {
  const router = useRouter();
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [direccion, setDireccion] = useState<DireccionSeleccionada>({
    provincia: '',
    canton: '',
    distrito: '',
    otrasSenas: ''
  });
  const [currentUsuario, setCurrentUsuario] = useState<Usuario>({
    identificacion_usuario: '',
    nombre_usuario: '',
    apellido_usuario: '',
    telefono_usuario: '',
    email_usuario: '',
    contrasena_usuario: '',
    direccion_usuario: '',
    estado_usuario: true,
    usuario_rol: 0,
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
    if (usuarioActual && usuarioActual.usuario_rol !== 1) {
      router.push('/');
      return;
    }
  }, [usuarioActual, router]);

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const handleDireccionChange = useCallback((nuevaDireccion: DireccionSeleccionada) => {
    setDireccion(nuevaDireccion);
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/usuario');
      const result = await response.json();
      setUsuarios(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      const url = isEditing ? `/api/usuario/${currentUsuario.id_usuario}` : '/api/usuario';
      const method = isEditing ? 'PUT' : 'POST';
      
      const usuarioConDireccion = {
        ...currentUsuario,
        provincia: direccion.provincia || null,
        canton: direccion.canton || null,
        distrito: direccion.distrito || null,
        otras_senas: direccion.otrasSenas || null
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuarioConDireccion),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchUsuarios();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el usuario: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el usuario. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setCurrentUsuario(usuario);
    setDireccion({
      provincia: usuario.provincia || '',
      canton: usuario.canton || '',
      distrito: usuario.distrito || '',
      otrasSenas: usuario.otras_senas || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar usuario?',
      message: '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/usuario/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchUsuarios();
          }
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentUsuario({
      identificacion_usuario: '',
      nombre_usuario: '',
      apellido_usuario: '',
      telefono_usuario: '',
      email_usuario: '',
      contrasena_usuario: '',
      direccion_usuario: '',
      estado_usuario: true,
      usuario_rol: roles.length > 0 ? roles[0].id_rol : 0,
    });
    setDireccion({
      provincia: '',
      canton: '',
      distrito: '',
      otrasSenas: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUsuario({
      identificacion_usuario: '',
      nombre_usuario: '',
      apellido_usuario: '',
      telefono_usuario: '',
      email_usuario: '',
      direccion_usuario: '',
      estado_usuario: true,
      usuario_rol: 0,
    });
    setDireccion({
      provincia: '',
      canton: '',
      distrito: '',
      otrasSenas: ''
    });
    setIsEditing(false);
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    (usuario.identificacion_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (usuario.nombre_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (usuario.apellido_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (usuario.telefono_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (usuario.email_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (usuario.direccion_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const columns: Column<Usuario>[] = [
    { key: 'identificacion_usuario', header: 'Identificación', width: '120px' },
    { key: 'nombre_usuario', header: 'Nombre' },
    { key: 'apellido_usuario', header: 'Apellido' },
    { key: 'telefono_usuario', header: 'Teléfono', width: '120px' },
    { key: 'email_usuario', header: 'Email' },
    { 
      key: 'direccion_usuario', 
      header: 'Dirección',
      render: (usuario) => {
        if (usuario.provincia && usuario.canton && usuario.distrito) {
          return `${usuario.provincia}, ${usuario.canton}, ${usuario.distrito}`;
        }
        return usuario.direccion_usuario || '-';
      }
    },
    { 
      key: 'estado_usuario', 
      header: 'Estado',
      width: '100px',
      render: (usuario) => (
        <span className={usuario.estado_usuario ? styles.statusActive : styles.statusInactive}>
          {usuario.estado_usuario ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Usuario>[] = [
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
          <h1>Gestión de Usuarios</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Usuario
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredUsuarios}
          actions={actions}
          keyExtractor={(usuario) => usuario.id_usuario!}
          noDataMessage="No se encontraron usuarios"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Identificación *</label>
                  <input
                    type="text"
                    value={currentUsuario.identificacion_usuario}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, identificacion_usuario: e.target.value })
                    }
                    required
                    placeholder="Ej: 12345678"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={currentUsuario.nombre_usuario}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, nombre_usuario: e.target.value })
                    }
                    required
                    placeholder="Ej: María"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Apellido *</label>
                  <input
                    type="text"
                    value={currentUsuario.apellido_usuario}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, apellido_usuario: e.target.value })
                    }
                    required
                    placeholder="Ej: López Martínez"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    value={currentUsuario.telefono_usuario}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, telefono_usuario: e.target.value })
                    }
                    required
                    placeholder="Ej: 123456789"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={currentUsuario.email_usuario}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, email_usuario: e.target.value })
                    }
                    required
                    placeholder="Ej: usuario@ejemplo.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Contraseña {!isEditing && '*'}</label>
                  <input
                    type="password"
                    value={currentUsuario.contrasena_usuario || ''}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, contrasena_usuario: e.target.value })
                    }
                    required={!isEditing}
                    placeholder={isEditing ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
                    minLength={6}
                    className={styles.input}
                  />
                  <small className={styles.helpText}>
                    {isEditing 
                      ? "Solo completa si deseas cambiar la contraseña" 
                      : "Debe contener al menos 6 caracteres"}
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Rol *</label>
                  <select
                    value={currentUsuario.usuario_rol}
                    onChange={(e) =>
                      setCurrentUsuario({ ...currentUsuario, usuario_rol: Number(e.target.value) })
                    }
                    required
                  >
                    <option value={0} disabled>Seleccione un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre_rol}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.direccionColumn}>
                  <SelectorDireccion
                    value={direccion}
                    onChange={handleDireccionChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.toggleContainer}>
                    <label className={styles.toggleLabel}>Estado</label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={currentUsuario.estado_usuario}
                        onChange={(e) =>
                          setCurrentUsuario({ ...currentUsuario, estado_usuario: e.target.checked })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.btnCancel} onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className={styles.btnSubmit}>
                      {isEditing ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
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

export default Usuarios;
