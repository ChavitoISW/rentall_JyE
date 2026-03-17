import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useEquiposCache } from '../contexts/EquiposContext';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import { EstadoEquipo, EstadoEquipoLabels } from '../types/estadoEquipo';
import styles from '../styles/Equipo.module.css';

interface Equipo {
  id_equipo?: number;
  cantidad_equipo: number;
  nombre_equipo: string;
  id_equipo_categoria: number;
  id_estado_equipo?: number;
  id_equipo_especifico?: number;
  nombre_estado?: string;
  nombre_categoria?: string;
  nombre_equipo_especifico?: string;
}

interface CategoriaEquipo {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
}

// Interfaz genérica para equipos de cualquier categoría
interface EquipoCategoria {
  id?: number;
  nombre?: string;
  [key: string]: any;
}

const Equipos: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const { fetchEquiposPorCategoria: fetchFromCache, invalidateCache } = useEquiposCache();
  
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEquipo[]>([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState<EquipoCategoria[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEquipo, setCurrentEquipo] = useState<Equipo>({
    cantidad_equipo: 1,
    nombre_equipo: '',
    id_equipo_categoria: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoriaNombre, setSelectedCategoriaNombre] = useState<string>('');
  const [selectedEquipoEspecifico, setSelectedEquipoEspecifico] = useState<string>('');
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
    fetchEquipos();
    fetchCategorias();
  }, []);

  const fetchEquipos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/equipo');
      const result = await response.json();
      setEquipos(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setEquipos([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const fetchEstados = async () => {
    // Estados ahora son un enum, no se necesita fetch
  };

  // Función para obtener equipos de una categoría específica usando el contexto de caché
  const loadEquiposPorCategoria = useCallback(async (categoriaNombre: string) => {
    if (!categoriaNombre) {
      setEquiposDisponibles([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const equipos = await fetchFromCache(categoriaNombre);
      setEquiposDisponibles(equipos);
    } catch (error) {
      console.error('Error al cargar equipos de categoría:', error);
      setEquiposDisponibles([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromCache]);

  // Función para obtener el ID correcto según la categoría
  const getIdEquipoCategoria = (equipo: EquipoCategoria, categoria: string): number | undefined => {
    const cat = categoria.toLowerCase();
    
    if (cat.includes('mezcladora')) {
      return equipo.id_mezcladora;
    } else if (cat.includes('andamio')) {
      return equipo.id_andamio;
    } else if (cat.includes('compactador')) {
      return equipo.id_compactador;
    } else if (cat.includes('rompedor')) {
      return equipo.id_rompedor;
    } else if (cat.includes('vibrador')) {
      return equipo.id_vibrador;
    } else if (cat.includes('puntal')) {
      return equipo.id_puntal;
    }
    
    return undefined;
  };

  // Función para obtener el nombre del equipo según la categoría
  const getNombreEquipoCategoria = (equipo: EquipoCategoria, categoria: string): string => {
    const cat = categoria.toLowerCase();
    
    if (cat.includes('mezcladora')) {
      return equipo.nombre_equipo || `Mezcladora ${equipo.numero_mezcladora || ''}`;
    } else if (cat.includes('andamio')) {
      return equipo.nombre_equipo || `Andamio ${equipo.ancho_andamio || ''}x${equipo.largo_andamio || ''}`;
    } else if (cat.includes('compactador')) {
      return equipo.nombre_equipo || `Compactador ${equipo.numero_equipo || ''}`;
    } else if (cat.includes('rompedor')) {
      return equipo.nombre_equipo || `Rompedor ${equipo.numero_rompedor || ''}`;
    } else if (cat.includes('vibrador')) {
      return equipo.nombre_equipo || 'Vibrador';
    } else if (cat.includes('puntal')) {
      return equipo.nombre_equipo || 'Puntal';
    }
    
    return 'Equipo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el estado esté seleccionado
    if (!currentEquipo.id_estado_equipo || currentEquipo.id_estado_equipo === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Campo requerido',
        message: 'Por favor, selecciona un estado para el equipo.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }
    
    // Validar que se haya seleccionado un equipo específico si hay equipos disponibles
    if (selectedCategoriaNombre && equiposDisponibles.length > 0 && !currentEquipo.id_equipo_especifico) {
      setConfirmDialog({
        isOpen: true,
        title: 'Campo requerido',
        message: 'Por favor, selecciona un equipo específico de la categoría.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/equipo/${currentEquipo.id_equipo}` : '/api/equipo';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentEquipo),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchEquipos();
        closeModal();
      } else {
        console.error('Error al guardar:', result.error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error al guardar',
          message: 'Error al guardar el equipo: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar equipo:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar el equipo. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (equipo: Equipo) => {
    setCurrentEquipo(equipo);
    setIsEditing(true);
    
    // Cargar la categoría seleccionada
    const categoria = categorias.find(c => c.id === equipo.id_equipo_categoria);
    if (categoria) {
      setSelectedCategoriaNombre(categoria.nombre);
      loadEquiposPorCategoria(categoria.nombre);
    }
    
    // Cargar el equipo específico si existe
    if (equipo.id_equipo_especifico) {
      setSelectedEquipoEspecifico(String(equipo.id_equipo_especifico));
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar equipo?',
      message: '¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/equipo/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchEquipos();
          }
        } catch (error) {
          console.error('Error al eliminar equipo:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openModal = () => {
    setCurrentEquipo({
      cantidad_equipo: 1,
      nombre_equipo: '',
      id_equipo_categoria: 0,
    });
    setSelectedCategoriaNombre('');
    setSelectedEquipoEspecifico('');
    setEquiposDisponibles([]);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEquipo({
      cantidad_equipo: 1,
      nombre_equipo: '',
      id_equipo_categoria: 0,
    });
    setSelectedCategoriaNombre('');
    setSelectedEquipoEspecifico('');
    setEquiposDisponibles([]);
    setIsEditing(false);
  };

  const handleCategoriaChange = useCallback((categoriaId: number) => {
    setCurrentEquipo(prev => ({ ...prev, id_equipo_categoria: categoriaId }));
    const categoria = categorias.find(c => c.id === categoriaId);
    
    if (categoria) {
      setSelectedCategoriaNombre(categoria.nombre);
      loadEquiposPorCategoria(categoria.nombre);
    } else {
      setSelectedCategoriaNombre('');
      setEquiposDisponibles([]);
    }
    
    setSelectedEquipoEspecifico('');
  }, [categorias, loadEquiposPorCategoria]);

  const handleEquipoEspecificoChange = useCallback((equipoId: string) => {
    setSelectedEquipoEspecifico(equipoId);
    setCurrentEquipo(prev => ({ ...prev, id_equipo_especifico: Number(equipoId) }));
  }, []);

  // Optimizar el filtrado con useMemo
  const filteredEquipos = useMemo(() => 
    equipos.filter(equipo =>
      String(equipo.cantidad_equipo).includes(searchTerm) ||
      equipo.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [equipos, searchTerm]
  );

  const columns: Column<Equipo>[] = [
    { key: 'cantidad_equipo', header: 'Cantidad', width: '100px' },
    { key: 'nombre_equipo', header: 'Nombre del Equipo' },
    { 
      key: 'nombre_categoria', 
      header: 'Categoría',
      width: '150px',
      render: (equipo) => equipo.nombre_categoria || '-'
    },
    { 
      key: 'nombre_equipo_especifico', 
      header: 'Equipo Específico',
      width: '220px',
      render: (equipo) => equipo.nombre_equipo_especifico || '-'
    },
    { 
      key: 'nombre_estado', 
      header: 'Estado',
      width: '150px',
      render: (equipo) => equipo.id_estado_equipo ? EstadoEquipoLabels[equipo.id_estado_equipo as EstadoEquipo] : '-'
    }
  ];

  const actions: TableAction<Equipo>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
      className: styles.btnEdit
    }
    // Botón de eliminar ocultado - usar estado inactivo en su lugar
    // {
    //   label: 'Eliminar',
    //   onClick: (equipo) => handleDelete(equipo.id_equipo!),
    //   className: styles.btnDelete
    // }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Inventario de Equipos</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nuevo Equipo
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredEquipos}
          actions={actions}
          keyExtractor={(equipo) => equipo.id_equipo!}
          noDataMessage="No se encontraron equipos"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Nombre del Equipo *</label>
                  <input
                    type="text"
                    value={currentEquipo.nombre_equipo}
                    onChange={(e) =>
                      setCurrentEquipo({ ...currentEquipo, nombre_equipo: e.target.value })
                    }
                    required
                    placeholder="Ej: Mezcladora 85"
                  />
                </div>
                <div className={styles.formRow}>
                  
                  <div className={styles.formGroup}>
                    <label>Cantidad de Equipos *</label>
                    <input
                      type="number"
                      min="1"
                      value={currentEquipo.cantidad_equipo}
                      onChange={(e) =>
                        setCurrentEquipo({ ...currentEquipo, cantidad_equipo: parseInt(e.target.value) || 1 })
                      }
                      required
                      placeholder="Ej: 5"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Categoría *</label>
                    <select
                      value={currentEquipo.id_equipo_categoria || 0}
                      onChange={(e) => handleCategoriaChange(Number(e.target.value))}
                      required
                    >
                      <option value={0} disabled>Seleccione una categoría</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Estado *</label>
                    <select
                      value={currentEquipo.id_estado_equipo || 0}
                      onChange={(e) =>
                        setCurrentEquipo({ ...currentEquipo, id_estado_equipo: Number(e.target.value) || undefined })
                      }
                      required
                    >
                      <option value={0} disabled>Seleccione un estado</option>
                      {Object.entries(EstadoEquipo).filter(([key, value]) => typeof value === 'number').map(([key, value]) => (
                        <option key={value} value={value}>
                          {EstadoEquipoLabels[value as EstadoEquipo]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Combobox dinámico de equipos según categoría */}
                {selectedCategoriaNombre && equiposDisponibles.length > 0 && (
                  <div className={styles.formGroup}>
                    <label>Seleccionar Equipo *</label>
                    <select
                      value={selectedEquipoEspecifico}
                      onChange={(e) => handleEquipoEspecificoChange(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleccione un equipo de la categoría</option>
                      {equiposDisponibles.map((equipo) => {
                        const equipoId = getIdEquipoCategoria(equipo, selectedCategoriaNombre);
                        return (
                          <option key={equipoId} value={equipoId}>
                            {getNombreEquipoCategoria(equipo, selectedCategoriaNombre)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {selectedCategoriaNombre && equiposDisponibles.length === 0 && (
                  <div className={styles.formGroup}>
                    <p style={{ color: '#999', fontStyle: 'italic' }}>
                      No hay equipos disponibles en la categoría "{selectedCategoriaNombre}"
                    </p>
                  </div>
                )}                

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

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.type === 'danger' && confirmDialog.title === '¿Eliminar equipo?' ? 'Eliminar' : 'Aceptar'}
          cancelText="Cancelar"
          type={confirmDialog.type}
          showCancel={confirmDialog.title === '¿Eliminar equipo?'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Equipos;
