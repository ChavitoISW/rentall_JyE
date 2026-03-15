import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';import Table, { Column, TableAction } from './Table';import styles from '../styles/AjusteInventario.module.css';

interface Equipo {
  id_equipo: number;
  nombre_equipo: string;
  cantidad_equipo: number;
  cantidad_disponible: number;
  cantidad_alquilado: number;
  cantidad_en_transito: number;
  cantidad_en_recoleccion: number;
  cantidad_en_mantenimiento: number;
  cantidad_reservado: number;
}

const AjusteInventario: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Equipo>>({});
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (usuario && usuario.usuario_rol !== 1) {
      router.push('/');
      return;
    }
    fetchEquipos();
  }, [usuario, router]);

  const fetchEquipos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/equipo');
      if (response.ok) {
        const result = await response.json();
        // El endpoint devuelve { success: true, data: equipos }
        setEquipos(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('Error al cargar equipos');
        setEquipos([]);
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar equipos');
      setEquipos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calcularSuma = (equipo: Partial<Equipo>): number => {
    return (
      (equipo.cantidad_disponible || 0) +
      (equipo.cantidad_alquilado || 0) +
      (equipo.cantidad_en_transito || 0) +
      (equipo.cantidad_en_recoleccion || 0) +
      (equipo.cantidad_en_mantenimiento || 0) +
      (equipo.cantidad_reservado || 0)
    );
  };

  const handleEdit = (equipo: Equipo) => {
    setEditingEquipo(equipo.id_equipo);
    setEditValues({
      id_equipo: equipo.id_equipo,
      cantidad_disponible: equipo.cantidad_disponible,
      cantidad_alquilado: equipo.cantidad_alquilado,
      cantidad_en_transito: equipo.cantidad_en_transito,
      cantidad_en_recoleccion: equipo.cantidad_en_recoleccion,
      cantidad_en_mantenimiento: equipo.cantidad_en_mantenimiento,
      cantidad_reservado: equipo.cantidad_reservado,
    });
    setError('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setEditingEquipo(null);
    setEditValues({});
    setError('');
  };

  const handleChange = (field: keyof Equipo, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;

    const newValues = { ...editValues, [field]: numValue };
    const equipoActual = equipos.find(e => e.id_equipo === editingEquipo);
    
    if (equipoActual) {
      const suma = calcularSuma(newValues);
      if (suma > equipoActual.cantidad_equipo) {
        setError(`La suma (${suma}) no puede exceder el total del equipo (${equipoActual.cantidad_equipo})`);
        return;
      } else {
        setError('');
      }
    }

    setEditValues(newValues);
  };

  const handleSave = async () => {
    const equipoActual = equipos.find(e => e.id_equipo === editingEquipo);
    if (!equipoActual) return;

    const suma = calcularSuma(editValues);
    if (suma > equipoActual.cantidad_equipo) {
      setError(`La suma (${suma}) excede el total permitido (${equipoActual.cantidad_equipo})`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ajuste-inventario', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_equipo: editingEquipo,
          cantidad_disponible: editValues.cantidad_disponible,
          cantidad_alquilado: editValues.cantidad_alquilado,
          cantidad_en_transito: editValues.cantidad_en_transito,
          cantidad_en_recoleccion: editValues.cantidad_en_recoleccion,
          cantidad_en_mantenimiento: editValues.cantidad_en_mantenimiento,
          cantidad_reservado: editValues.cantidad_reservado,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Inventario de ${equipoActual.nombre_equipo} actualizado correctamente`);
        setEditingEquipo(null);
        setEditValues({});
        await fetchEquipos();
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(data.error || 'Error al actualizar inventario');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setError('Error al guardar cambios');
    } finally {
      setIsLoading(false);
    }
  };

  if (!usuario || usuario.usuario_rol !== 1) {
    return null;
  }

  // Filtrar equipos por término de búsqueda
  const equiposFiltrados = equipos.filter(eq => 
    eq.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Definir columnas para la tabla
  const columns: Column<Equipo>[] = [
    {
      key: 'nombre_equipo',
      header: 'Equipo',
      render: (equipo) => (
        <span className={styles.equipoName}>{equipo.nombre_equipo}</span>
      ),
      width: '200px',
      filterable: false,
    },
    {
      key: 'cantidad_equipo',
      header: 'Total',
      render: (equipo) => (
        <span className={styles.totalCell}>{equipo.cantidad_equipo}</span>
      ),
      width: '100px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'cantidad_disponible',
      header: 'Disponible',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        return isEditing ? (
          <input
            type="number"
            min="0"
            value={valores.cantidad_disponible || 0}
            onChange={(e) => handleChange('cantidad_disponible', e.target.value)}
            className={styles.inputNumber}
          />
        ) : (
          <span>{equipo.cantidad_disponible}</span>
        );
      },
      width: '120px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'cantidad_reservado',
      header: 'Reservado',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        return isEditing ? (
          <input
            type="number"
            min="0"
            value={valores.cantidad_reservado || 0}
            onChange={(e) => handleChange('cantidad_reservado', e.target.value)}
            className={styles.inputNumber}
          />
        ) : (
          <span>{equipo.cantidad_reservado}</span>
        );
      },
      width: '120px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'cantidad_alquilado',
      header: 'Asignado',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        return isEditing ? (
          <input
            type="number"
            min="0"
            value={valores.cantidad_alquilado || 0}
            onChange={(e) => handleChange('cantidad_alquilado', e.target.value)}
            className={styles.inputNumber}
          />
        ) : (
          <span>{equipo.cantidad_alquilado}</span>
        );
      },
      width: '120px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'cantidad_en_recoleccion',
      header: 'En Recolección',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        return isEditing ? (
          <input
            type="number"
            min="0"
            value={valores.cantidad_en_recoleccion || 0}
            onChange={(e) => handleChange('cantidad_en_recoleccion', e.target.value)}
            className={styles.inputNumber}
          />
        ) : (
          <span>{equipo.cantidad_en_recoleccion}</span>
        );
      },
      width: '180px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'cantidad_en_mantenimiento',
      header: 'En Mantenimiento',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        return isEditing ? (
          <input
            type="number"
            min="0"
            value={valores.cantidad_en_mantenimiento || 0}
            onChange={(e) => handleChange('cantidad_en_mantenimiento', e.target.value)}
            className={styles.inputNumber}
          />
        ) : (
          <span>{equipo.cantidad_en_mantenimiento}</span>
        );
      },
      width: '190px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'cantidad_en_transito',
      header: 'No Disponible',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        return isEditing ? (
          <input
            type="number"
            min="0"
            value={valores.cantidad_en_transito || 0}
            onChange={(e) => handleChange('cantidad_en_transito', e.target.value)}
            className={styles.inputNumber}
          />
        ) : (
          <span>{equipo.cantidad_en_transito}</span>
        );
      },
      width: '170px',
      filterable: false,
      sortable: true,
    },
    {
      key: 'suma',
      header: 'Suma',
      render: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        const valores = isEditing ? editValues : equipo;
        const suma = calcularSuma(valores);
        const esValido = suma <= equipo.cantidad_equipo;
        
        return (
          <span className={!esValido ? styles.sumaInvalida : styles.sumaValida}>
            {suma}
            {!esValido && ' ⚠️'}
          </span>
        );
      },
      width: '100px',
      filterable: false,
      sortable: false,
    },
  ];

  // Definir acciones para la tabla
  const actions: TableAction<Equipo>[] = [
    {
      label: 'Guardar',
      onClick: handleSave,
      className: styles.btnSave,
      condition: (equipo) => {
        const isEditing = editingEquipo === equipo.id_equipo;
        if (!isEditing) return false;
        const suma = calcularSuma(editValues);
        return suma <= equipo.cantidad_equipo;
      },
      tooltip: 'Guardar cambios',
    },
    {
      label: 'Cancelar',
      onClick: handleCancel,
      className: styles.btnCancel,
      condition: (equipo) => editingEquipo === equipo.id_equipo,
      tooltip: 'Cancelar edición',
    },
    {
      label: 'Editar',
      onClick: (equipo) => handleEdit(equipo),
      className: styles.btnEdit,
      condition: (equipo) => editingEquipo !== equipo.id_equipo,
      tooltip: 'Editar inventario',
    },
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>⚙️ Ajuste Manual de Inventario</h1>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button 
            className={styles.btnRefresh} 
            onClick={fetchEquipos}
          >
            ↻ Actualizar
          </button>
        </div>

        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>⚠️</div>
          <div>
            <strong>Advertencia:</strong> Esta vista permite ajustar manualmente el inventario consolidado. 
            Use con precaución. La bitácora no se modifica.
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.messageIcon}>❌</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div className={styles.successMessage}>
            <span className={styles.messageIcon}>✅</span>
            {successMessage}
          </div>
        )}

        <div className={styles.tableCard}>
          <Table
            columns={columns}
            data={equiposFiltrados}
            actions={actions}
            keyExtractor={(equipo) => equipo.id_equipo}
            noDataMessage={isLoading ? 'Cargando equipos...' : 'No hay equipos disponibles'}
            itemsPerPage={15}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AjusteInventario;