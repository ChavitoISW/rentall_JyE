import React, { useState, useEffect, useCallback } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import SelectorDireccion, { DireccionSeleccionada } from './SelectorDireccion';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Cliente.module.css';

interface Cliente {
  id_cliente?: number;
  documento_identidad_cliente: string;
  nombre_cliente: string;
  apellidos_cliente: string;
  telefono_cliente: string;
  email_cliente: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  estado_cliente?: boolean;
}

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCliente, setCurrentCliente] = useState<Cliente>({
    documento_identidad_cliente: '',
    nombre_cliente: '',
    apellidos_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
    provincia: '',
    canton: '',
    distrito: '',
    otras_senas: '',
    estado_cliente: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });
  const [direccion, setDireccion] = useState<DireccionSeleccionada>({
    provincia: '',
    canton: '',
    distrito: '',
    otrasSenas: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cliente');
      const result = await response.json();
      setClientes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/cliente/${currentCliente.id_cliente}` : '/api/cliente';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Combinar datos del cliente con dirección
      const clienteConDireccion = {
        ...currentCliente,
        provincia: direccion.provincia,
        canton: direccion.canton,
        distrito: direccion.distrito,
        otras_senas: direccion.otrasSenas
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteConDireccion),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchClientes();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el cliente: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el cliente. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setCurrentCliente(cliente);
    // Configurar la dirección con los datos del cliente para que los combos se carguen
    setDireccion({
      provincia: cliente.provincia || '',
      canton: cliente.canton || '',
      distrito: cliente.distrito || '',
      otrasSenas: cliente.otras_senas || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar cliente?',
      message: '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/cliente/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchClientes();
          }
        } catch (error) {
          console.error('Error al eliminar cliente:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentCliente({
      documento_identidad_cliente: '',
      nombre_cliente: '',
      apellidos_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
      provincia: '',
      canton: '',
      distrito: '',
      otras_senas: '',
      estado_cliente: true,
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
    setCurrentCliente({
      documento_identidad_cliente: '',
      nombre_cliente: '',
      apellidos_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
      provincia: '',
      canton: '',
      distrito: '',
      otras_senas: '',
      estado_cliente: true,
    });
    setDireccion({
      provincia: '',
      canton: '',
      distrito: '',
      otrasSenas: ''
    });
    setIsEditing(false);
  };

  const handleDireccionChange = useCallback((nuevaDireccion: DireccionSeleccionada) => {
    setDireccion(nuevaDireccion);
  }, []);

  const filteredClientes = clientes.filter(cliente =>
    cliente.documento_identidad_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellidos_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.telefono_cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (cliente.email_cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const columns: Column<Cliente>[] = [
    { key: 'documento_identidad_cliente', header: 'Documento', width: '120px' },
    { key: 'nombre_cliente', header: 'Nombre' },
    { key: 'apellidos_cliente', header: 'Apellidos' },
    { key: 'telefono_cliente', header: 'Teléfono', width: '120px' },
    { key: 'email_cliente', header: 'Email' },
    { 
      key: 'provincia', 
      header: 'Dirección',
      render: (cliente) => {
        const partes = [cliente.provincia, cliente.canton, cliente.distrito].filter(Boolean);
        const direccion = partes.length > 0 ? partes.join(', ') : '';
        const otrasSenas = cliente.otras_senas ? `, ${cliente.otras_senas}` : '';
        return direccion || otrasSenas ? `${direccion}${otrasSenas}` : '-';
      }
    },
    { 
      key: 'estado_cliente', 
      header: 'Estado',
      width: '100px',
      render: (cliente) => (
        <span className={cliente.estado_cliente ? styles.statusActive : styles.statusInactive}>
          {cliente.estado_cliente ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Cliente>[] = [
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
          <h1>Gestión de Clientes</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Cliente
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredClientes}
          actions={actions}
          keyExtractor={(cliente) => cliente.id_cliente!}
          noDataMessage="No se encontraron clientes"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Documento de Identidad *</label>
                  <input
                    type="text"
                    value={currentCliente.documento_identidad_cliente}
                    onChange={(e) =>
                      setCurrentCliente({ ...currentCliente, documento_identidad_cliente: e.target.value })
                    }
                    required
                    placeholder="Ej: 12345678"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={currentCliente.nombre_cliente}
                    onChange={(e) =>
                      setCurrentCliente({ ...currentCliente, nombre_cliente: e.target.value })
                    }
                    required
                    placeholder="Ej: Juan"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    value={currentCliente.apellidos_cliente}
                    onChange={(e) =>
                      setCurrentCliente({ ...currentCliente, apellidos_cliente: e.target.value })
                    }
                    required
                    placeholder="Ej: Pérez García"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    value={currentCliente.telefono_cliente}
                    onChange={(e) =>
                      setCurrentCliente({ ...currentCliente, telefono_cliente: e.target.value })
                    }
                    required
                    placeholder="Ej: 123456789"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={currentCliente.email_cliente}
                    onChange={(e) =>
                      setCurrentCliente({ ...currentCliente, email_cliente: e.target.value })
                    }
                    placeholder="Ej: cliente@ejemplo.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.toggleContainer}>
                    <label className={styles.toggleLabel}>Estado</label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={currentCliente.estado_cliente}
                        onChange={(e) =>
                          setCurrentCliente({ ...currentCliente, estado_cliente: e.target.checked })
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

                <div className={styles.direccionColumn}>
                  <SelectorDireccion
                    value={direccion}
                    onChange={handleDireccionChange}
                    required={false}
                    incluirOtrasSenas={true}
                  />
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

export default Clientes;
