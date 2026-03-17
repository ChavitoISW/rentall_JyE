import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import styles from '../styles/SolicitudEquipo.module.css';

interface EquipoMantenimiento {
  id_equipo: number;
  id_equipo_especifico: number;
  nombre_equipo: string;
  id_estado_equipo: number;
  nombre_estado: string;
  cantidad_equipo: number;
  cantidad_disponible?: number;
  cantidad_en_mantenimiento?: number;
  cantidad_alquilado?: number;
  cantidad_en_transito?: number;
  cantidad_en_recoleccion?: number;
  cantidad_reservado?: number;
}

interface EquipoSeleccionado {
  nombre_equipo: string;
  cantidad_total: number;
  cantidad_seleccionada: number;
  equipos_especificos: Array<{ id_equipo: number; id_equipo_especifico: number }>;
}

const EquiposMantenimiento: React.FC = () => {
  const [equipos, setEquipos] = useState<EquipoMantenimiento[]>([]);
  const [equiposAgrupados, setEquiposAgrupados] = useState<Map<string, EquipoSeleccionado>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchEquiposMantenimiento();
  }, []);

  const fetchEquiposMantenimiento = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los equipos y filtrar los que tienen cantidad_en_mantenimiento > 0
      const response = await fetch('/api/equipo');
      const result = await response.json();
      
      console.log('Datos recibidos de la API:', result);
      
      if (result.success && Array.isArray(result.data)) {
        // Filtrar solo los equipos que tienen cantidad en mantenimiento
        const equiposEnMantenimiento = result.data.filter((equipo: any) => 
          (equipo.cantidad_en_mantenimiento || 0) > 0
        );
        
        console.log('Equipos con cantidad en mantenimiento:', equiposEnMantenimiento.length);
        
        setEquipos(equiposEnMantenimiento);
        agruparEquipos(equiposEnMantenimiento);
      } else {
        setEquipos([]);
      }
    } catch (error) {
      console.error('Error al cargar equipos en mantenimiento:', error);
      setEquipos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const agruparEquipos = (equiposData: EquipoMantenimiento[]) => {
    const agrupados = new Map<string, EquipoSeleccionado>();

    console.log('Agrupando equipos. Total recibido:', equiposData.length);

    equiposData.forEach(equipo => {
      const nombreEquipo = equipo.nombre_equipo;
      // Usar cantidad_en_mantenimiento en lugar de cantidad_equipo
      const cantidadEquipo = equipo.cantidad_en_mantenimiento || 0;
      
      if (!agrupados.has(nombreEquipo)) {
        agrupados.set(nombreEquipo, {
          nombre_equipo: nombreEquipo,
          cantidad_total: 0,
          cantidad_seleccionada: 0,
          equipos_especificos: []
        });
      }

      const grupo = agrupados.get(nombreEquipo)!;
      
      // Sumar la cantidad en mantenimiento de este registro
      grupo.cantidad_total += cantidadEquipo;
      
      // Solo agregar si hay equipos en mantenimiento
      if (cantidadEquipo > 0) {
        grupo.equipos_especificos.push({
          id_equipo: equipo.id_equipo,
          id_equipo_especifico: equipo.id_equipo_especifico
        });
      }
    });

    console.log('Equipos agrupados:', Array.from(agrupados.entries()).map(([nombre, grupo]) => ({
      nombre,
      cantidad: grupo.cantidad_total,
      especificos: grupo.equipos_especificos.length
    })));

    setEquiposAgrupados(agrupados);
  };

  const handleCantidadChange = (nombreEquipo: string, cantidad: number) => {
    setEquiposAgrupados(prev => {
      const nuevo = new Map(prev);
      const equipo = nuevo.get(nombreEquipo);
      if (equipo) {
        equipo.cantidad_seleccionada = Math.min(Math.max(0, cantidad), equipo.cantidad_total);
        nuevo.set(nombreEquipo, equipo);
      }
      return nuevo;
    });
  };

  const handleMarcarDisponible = async () => {
    const equiposSeleccionados = Array.from(equiposAgrupados.values()).filter(
      e => e.cantidad_seleccionada > 0
    );

    if (equiposSeleccionados.length === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Advertencia',
        message: 'Debe seleccionar al menos un equipo con cantidad mayor a 0.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    const totalEquipos = equiposSeleccionados.reduce((sum, e) => sum + e.cantidad_seleccionada, 0);
    const detalleEquipos = equiposSeleccionados.map(e => 
      `${e.nombre_equipo}: ${e.cantidad_seleccionada} de ${e.cantidad_total}`
    ).join('\n');

    setConfirmDialog({
      isOpen: true,
      title: '¿Marcar equipos como disponibles?',
      message: `Se marcarán ${totalEquipos} equipo(s) como disponibles:\n\n${detalleEquipos}\n\nLos equipos restantes permanecerán en mantenimiento.\n¿Desea continuar?`,
      type: 'info',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          let errores = 0;
          let exitosos = 0;

          for (const equipoSel of equiposSeleccionados) {
            console.log(`Procesando ${equipoSel.nombre_equipo}: ${equipoSel.cantidad_seleccionada} de ${equipoSel.cantidad_total}`);
            
            // Obtener el primer equipo para obtener la información completa
            if (equipoSel.equipos_especificos.length > 0) {
              const idEquipo = equipoSel.equipos_especificos[0].id_equipo;
              
              try {
                // Obtener el equipo actual
                const equipoResponse = await fetch(`/api/equipo/${idEquipo}`);
                if (!equipoResponse.ok) {
                  throw new Error('Error obteniendo equipo');
                }
                const equipoResult = await equipoResponse.json();
                
                if (equipoResult.success && equipoResult.data) {
                  const equipoActual = equipoResult.data;
                  const cantidadMarcar = equipoSel.cantidad_seleccionada;
                  
                  console.log(`🔧 Marcar disponible: ${cantidadMarcar} unidades de ${equipoActual.nombre_equipo}`);
                  
                  // Actualizar usando el nuevo sistema de columnas por estado
                  // en_mantenimiento → disponible
                  const response = await fetch(`/api/equipo/${idEquipo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      cantidad_en_mantenimiento: (equipoActual.cantidad_en_mantenimiento || 0) - cantidadMarcar,
                      cantidad_disponible: (equipoActual.cantidad_disponible || 0) + cantidadMarcar
                    })
                  });
                  
                  if (response.ok) {
                    exitosos++;
                    console.log(`✅ ${cantidadMarcar} unidades marcadas como disponibles`);
                  } else {
                    errores++;
                    console.error(`✗ Error al actualizar equipo ${idEquipo}`);
                  }
                }
              } catch (error) {
                console.error('Error al procesar equipo:', error);
                errores++;
              }
            }
          }

          let mensaje = '';
          if (exitosos > 0 && errores === 0) {
            mensaje = `Se marcaron ${exitosos} equipo(s) como disponibles exitosamente.`;
          } else if (exitosos > 0 && errores > 0) {
            mensaje = `Se marcaron ${exitosos} equipo(s) como disponibles. ${errores} fallaron.`;
          } else {
            mensaje = 'No se pudieron actualizar los equipos.';
          }

          setConfirmDialog({
            isOpen: true,
            title: exitosos > 0 ? 'Éxito' : 'Error',
            message: mensaje,
            type: exitosos > 0 ? 'info' : 'danger',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
              fetchEquiposMantenimiento();
            }
          });
        } catch (error) {
          console.error('Error al actualizar equipos:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al actualizar los equipos. Por favor, intenta de nuevo.',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const filteredEquipos = Array.from(equiposAgrupados.values()).filter(equipo => {
    const search = searchTerm.toLowerCase();
    return equipo.nombre_equipo.toLowerCase().includes(search);
  });

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Equipos en Mantenimiento</h1>
          <button 
            className={styles.btnAdd} 
            onClick={handleMarcarDisponible}
            disabled={Array.from(equiposAgrupados.values()).every(e => e.cantidad_seleccionada === 0)}
          >
            ✓ Marcar como Disponibles
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
          <div style={{ marginLeft: 'auto', color: 'white' }}>
            Total equipos en mantenimiento: {equipos.length}
          </div>
        </div>

        {filteredEquipos.length > 0 ? (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '1.5rem',
              marginTop: '1rem'
            }}>
              {filteredEquipos.map((equipo) => (
                <div 
                  key={equipo.nombre_equipo}
                  style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'}
                >
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 600, 
                    color: '#333',
                    marginBottom: '1rem',
                    borderBottom: '2px solid #f0f0f0',
                    paddingBottom: '0.5rem'
                  }}>
                    {equipo.nombre_equipo}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                        Cantidad Total
                      </div>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 700, 
                        color: '#ff9800',
                        lineHeight: 1
                      }}>
                        {equipo.cantidad_total}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                        en mantenimiento
                      </div>
                    </div>

                    <div style={{ 
                      width: '1px', 
                      background: '#e0e0e0',
                      margin: '0 1rem'
                    }} />

                    <div style={{ flex: 1 }}>
                      <label style={{ 
                        fontSize: '0.85rem', 
                        color: '#666', 
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}>
                        Marcar como disponibles
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={equipo.cantidad_total}
                        value={equipo.cantidad_seleccionada}
                        onChange={(e) => handleCantidadChange(equipo.nombre_equipo, Number(e.target.value))}
                        style={{ 
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          textAlign: 'center',
                          border: '2px solid #e0e0e0',
                          borderRadius: '6px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      />
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: equipo.cantidad_seleccionada > 0 ? '#4CAF50' : '#999',
                        marginTop: '0.5rem',
                        fontWeight: equipo.cantidad_seleccionada > 0 ? 600 : 400
                      }}>
                        {equipo.cantidad_seleccionada > 0 
                          ? `✓ ${equipo.cantidad_seleccionada} seleccionado${equipo.cantidad_seleccionada > 1 ? 's' : ''}`
                          : 'Ninguno seleccionado'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Resumen de Selección
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '1rem',
                  borderRadius: '6px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    Tipos de Equipos Seleccionados
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                    {Array.from(equiposAgrupados.values()).filter(e => e.cantidad_seleccionada > 0).length}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '1rem',
                  borderRadius: '6px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    Total Unidades a Marcar
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                    {Array.from(equiposAgrupados.values()).reduce((sum, e) => sum + e.cantidad_seleccionada, 0)}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '1rem',
                  borderRadius: '6px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    Total en Mantenimiento
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                    {equipos.length}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'white', fontSize: '1.1rem' }}>
            {searchTerm ? '🔍 No se encontraron equipos' : '✓ No hay equipos en mantenimiento'}
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
        showCancel={true}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default EquiposMantenimiento;
