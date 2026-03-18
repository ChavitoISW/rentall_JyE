import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/Vibrador.module.css';

interface Empleado {
  id_empleado?: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  fecha_ingreso: string;
  fecha_salida?: string;
  estado?: number;
}

const Empleados: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [diasDisponibles, setDiasDisponibles] = useState<{ [key: number]: number }>({});
  const [diasAcumulados, setDiasAcumulados] = useState<{ [key: number]: number }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmpleado, setCurrentEmpleado] = useState<Empleado>({
    nombre: '',
    apellidos: '',
    telefono: '',
    fecha_ingreso: '',
    fecha_salida: '',
    estado: 1,
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
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/empleado');
      const result = await response.json();
      const empleadosData = Array.isArray(result.data) ? result.data : [];
      setEmpleados(empleadosData);
      
      // Cargar días disponibles para cada empleado
      const diasPromises = empleadosData.map(async (emp: Empleado) => {
        try {
          const diasRes = await fetch(`/api/solicitud-vacaciones/empleado/${emp.id_empleado}`);
          const diasResult = await diasRes.json();
          if (diasResult.success) {
            return { 
              id: emp.id_empleado!, 
              disponibles: diasResult.data.dias_disponibles,
              usados: diasResult.data.dias_usados
            };
          }
        } catch (error) {
          console.error(`Error al cargar días para empleado ${emp.id_empleado}:`, error);
        }
        return { id: emp.id_empleado!, disponibles: 0, usados: 0 };
      });
      
      const diasResults = await Promise.all(diasPromises);
      const diasDispMap: { [key: number]: number } = {};
      const diasAcumMap: { [key: number]: number } = {};
      diasResults.forEach(item => {
        diasDispMap[item.id] = item.disponibles;
        diasAcumMap[item.id] = item.disponibles + item.usados;
      });
      setDiasDisponibles(diasDispMap);
      setDiasAcumulados(diasAcumMap);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setEmpleados([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/empleado/${currentEmpleado.id_empleado}` : '/api/empleado';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentEmpleado),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchEmpleados();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar el empleado: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el empleado. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (empleado: Empleado) => {
    setCurrentEmpleado({
      ...empleado,
      fecha_ingreso: empleado.fecha_ingreso ? empleado.fecha_ingreso.split('T')[0] : '',
      fecha_salida: empleado.fecha_salida ? empleado.fecha_salida.split('T')[0] : ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openModal = () => {
    setCurrentEmpleado({
      nombre: '',
      apellidos: '',
      telefono: '',
      fecha_ingreso: '',
      fecha_salida: '',
      estado: 1,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEmpleado({
      nombre: '',
      apellidos: '',
      telefono: '',
      fecha_ingreso: '',
      fecha_salida: '',
      estado: 1,
    });
    setIsEditing(false);
  };

  const filteredEmpleados = empleados.filter(empleado =>
    empleado.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularTiempoLaborado = (fechaIngreso: string, fechaSalida?: string) => {
    if (!fechaIngreso) return '-';
    
    const inicio = new Date(fechaIngreso);
    const fin = fechaSalida ? new Date(fechaSalida) : new Date();
    
    let years = fin.getFullYear() - inicio.getFullYear();
    let months = fin.getMonth() - inicio.getMonth();
    let days = fin.getDate() - inicio.getDate();
    
    // Ajustar si los días son negativos
    if (days < 0) {
      months--;
      const lastMonth = new Date(fin.getFullYear(), fin.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Ajustar si los meses son negativos
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const partes = [];
    if (years > 0) partes.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    if (months > 0) partes.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
    if (days > 0 && partes.length < 2) partes.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    
    return partes.length > 0 ? partes.join(', ') : '0 días';
  };

  const calcularDiasVacaciones = (fechaIngreso: string, fechaSalida?: string) => {
    if (!fechaIngreso) return 0;
    
    const inicio = new Date(fechaIngreso);
    const fin = fechaSalida ? new Date(fechaSalida) : new Date();
    
    // Calcular total de meses
    let years = fin.getFullYear() - inicio.getFullYear();
    let months = fin.getMonth() - inicio.getMonth();
    let days = fin.getDate() - inicio.getDate();
    
    // Ajustar si los días son negativos
    if (days < 0) {
      months--;
    }
    
    // Ajustar si los meses son negativos
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Total de meses = (años * 12) + meses
    const totalMeses = (years * 12) + months;
    
    // 1 día de vacaciones por cada mes laborado
    return totalMeses;
  };

  const columns: Column<Empleado>[] = [
    { key: 'nombre', header: 'Nombre', width: '150px' },
    { key: 'apellidos', header: 'Apellidos', width: '150px' },
    { 
      key: 'telefono', 
      header: 'Teléfono',
      width: '120px',
      render: (empleado) => empleado.telefono || '-'
    },
    { 
      key: 'fecha_ingreso', 
      header: 'Fecha de Ingreso',
      width: '140px',
      render: (empleado) => empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-CR') : '-'
    },
    { 
      key: 'fecha_salida', 
      header: 'Fecha de Salida',
      width: '140px',
      render: (empleado) => empleado.fecha_salida ? new Date(empleado.fecha_salida).toLocaleDateString('es-CR') : '-'
    },
    { 
      key: 'tiempo_laborado', 
      header: 'Tiempo Laborado',
      width: '180px',
      render: (empleado) => calcularTiempoLaborado(empleado.fecha_ingreso, empleado.fecha_salida)
    },
    { 
      key: 'dias_acumulados', 
      header: 'Días Acumulados',
      width: '150px',
      render: (empleado) => {
        const dias = diasAcumulados[empleado.id_empleado!];
        if (dias === undefined) {
          return <span style={{ color: '#999', fontSize: '0.9rem' }}>⏳ Calculando...</span>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '1.1rem',
              color: '#9b59b6'
            }}>
              {dias}
            </span>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>
              {dias === 1 ? 'día' : 'días'}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'dias_vacaciones', 
      header: 'Días Disponibles',
      width: '150px',
      render: (empleado) => {
        const dias = diasDisponibles[empleado.id_empleado!];
        if (dias === undefined) {
          return <span style={{ color: '#999', fontSize: '0.9rem' }}>⏳ Calculando...</span>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '1.1rem',
              color: dias >= 0 ? '#27ae60' : '#e74c3c' 
            }}>
              {dias}
            </span>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>
              {dias === 1 ? 'día' : 'días'}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'estado', 
      header: 'Estado',
      width: '100px',
      render: (empleado) => (
        <span className={empleado.estado === 1 ? styles.statusActive : styles.statusInactive}>
          {empleado.estado === 1 ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  const actions: TableAction<Empleado>[] = [
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
          <h1>Gestión de Empleados</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Empleado
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredEmpleados}
          actions={actions}
          keyExtractor={(empleado) => empleado.id_empleado!}
          noDataMessage="No se encontraron empleados"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
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
                      value={currentEmpleado.nombre}
                      onChange={(e) =>
                        setCurrentEmpleado({ ...currentEmpleado, nombre: e.target.value })
                      }
                      required
                      placeholder="Nombre del empleado"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Apellidos *</label>
                    <input
                      type="text"
                      value={currentEmpleado.apellidos}
                      onChange={(e) =>
                        setCurrentEmpleado({ ...currentEmpleado, apellidos: e.target.value })
                      }
                      required
                      placeholder="Apellidos del empleado"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={currentEmpleado.telefono || ''}
                      onChange={(e) =>
                        setCurrentEmpleado({ ...currentEmpleado, telefono: e.target.value })
                      }
                      placeholder="8888-8888"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.dateInputGroup}`}>
                    <label className={styles.dateLabel}>Fecha de Ingreso *</label>
                    <input
                      type="date"
                      value={currentEmpleado.fecha_ingreso}
                      onChange={(e) =>
                        setCurrentEmpleado({ ...currentEmpleado, fecha_ingreso: e.target.value })
                      }
                      required
                      placeholder="dd/mm/aaaa"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.dateInputGroup}`}>
                    <label className={styles.dateLabel}>Fecha de Salida</label>
                    <input
                      type="date"
                      value={currentEmpleado.fecha_salida || ''}
                      onChange={(e) =>
                        setCurrentEmpleado({ ...currentEmpleado, fecha_salida: e.target.value })
                      }
                      placeholder="dd/mm/aaaa"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.toggleContainer}>
                      <label className={styles.toggleLabel}>Estado</label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={currentEmpleado.estado === 1}
                          onChange={(e) =>
                            setCurrentEmpleado({ ...currentEmpleado, estado: e.target.checked ? 1 : 0 })
                          }
                        />
                      </label>
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
        confirmText="Aceptar"
        cancelText="Cancelar"
        type={confirmDialog.type}
        showCancel={false}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default Empleados;
