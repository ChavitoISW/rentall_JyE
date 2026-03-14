import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/SolicitudEquipo.module.css';
import {
  HojaRuta as HojaRutaType,
  DetalleHojaRuta,
  EstadoHojaRuta,
  EstadoHojaRutaLabels,
  TipoOperacionRuta,
  TipoOperacionRutaLabels,
  HojaRutaExtendida,
  EstadoDetalleRuta,
  EstadoDetalleRutaLabels
} from '../types/hojaRuta';

interface OrdenDisponible {
  id: number;
  numero: string;
  tipo: TipoOperacionRuta;
  descripcion: string;
  cliente: string;
  telefono: string;
  direccion: string;
  provincia: string;
  canton: string;
  distrito: string;
  otras_senas: string;
  fecha: string;
}

interface EquipoParada {
  id: number;
  nombre: string;
  cantidad: number;
  completado: boolean;
}

const HojaRuta: React.FC = () => {
  const { usuario } = useAuth();
  const [hojas, setHojas] = useState<HojaRutaExtendida[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | 'todos'>('todos');

  const [ordenesDisponibles, setOrdenesDisponibles] = useState<OrdenDisponible[]>([]);
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<number[]>([]);

  // Estados para gestión de paradas
  const [isParadasModalOpen, setIsParadasModalOpen] = useState(false);
  const [hojaParaGestionar, setHojaParaGestionar] = useState<HojaRutaExtendida | null>(null);
  const [isGestionParadaOpen, setIsGestionParadaOpen] = useState(false);
  const [paradaActual, setParadaActual] = useState<DetalleHojaRuta | null>(null);
  const [equiposParada, setEquiposParada] = useState<EquipoParada[]>([]);
  const [notasParada, setNotasParada] = useState('');

  const [currentHoja, setCurrentHoja] = useState<HojaRutaExtendida>({
    fecha_creacion: new Date().toISOString().split('T')[0],
    conductor: '',
    vehiculo: '',
    estado: EstadoHojaRuta.BORRADOR,
    observaciones: ''
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchHojas();
  }, []);

  useEffect(() => {
    // Si el usuario es chofer (rol 5), filtrar por hojas activas por defecto
    if (usuario?.usuario_rol === 5) {
      setEstadoFiltro(EstadoHojaRuta.ACTIVA);
    }
  }, [usuario]);

  const fetchHojas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hoja-ruta?con_detalles=true');
      const result = await response.json();
      setHojas(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setHojas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrdenesDisponibles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hoja-ruta/pendientes');
      const result = await response.json();

      if (result.success) {
        const ordenes: OrdenDisponible[] = [];

        // Agregar contratos (entregas)
        result.data.contratos.forEach((c: any) => {
          ordenes.push({
            id: c.id_solicitud_equipo,
            numero: c.numero_contrato || c.numero_solicitud_equipo,
            tipo: TipoOperacionRuta.ENTREGA,
            descripcion: `Entrega - Contrato ${c.numero_contrato || c.numero_solicitud_equipo} (SE ${c.numero_solicitud_equipo})`,
            cliente: c.nombre_cliente || c.cliente_completo,
            telefono: c.telefono_cliente,
            direccion: `${c.provincia}, ${c.canton}, ${c.distrito}${c.otras_senas ? ', ' + c.otras_senas : ''}`,
            provincia: c.provincia,
            canton: c.canton,
            distrito: c.distrito,
            otras_senas: c.otras_senas,
            fecha: c.fecha_inicio
          });
        });

        // Agregar recolecciones
        result.data.recolecciones.forEach((r: any) => {
          ordenes.push({
            id: r.id_orden_recoleccion,
            numero: r.numero_orden_recoleccion,
            tipo: TipoOperacionRuta.RECOLECCION,
            descripcion: `Recolección - ${r.nombre_equipo}`,
            cliente: r.nombre_cliente,
            telefono: r.telefono_cliente,
            direccion: `${r.provincia}, ${r.canton}, ${r.distrito}${r.otras_senas ? ', ' + r.otras_senas : ''}`,
            provincia: r.provincia,
            canton: r.canton,
            distrito: r.distrito,
            otras_senas: r.otras_senas,
            fecha: r.fecha_programada_recoleccion
          });
        });

        // Agregar cambios
        result.data.cambios.forEach((cambio: any) => {
          ordenes.push({
            id: cambio.id_orden_cambio,
            numero: cambio.numero_orden_cambio,
            tipo: TipoOperacionRuta.CAMBIO,
            descripcion: `Cambio - ${cambio.nombre_equipo_actual} → ${cambio.nombre_equipo_nuevo}`,
            cliente: cambio.nombre_cliente,
            telefono: cambio.telefono_cliente,
            direccion: `${cambio.provincia}, ${cambio.canton}, ${cambio.distrito}${cambio.otras_senas ? ', ' + cambio.otras_senas : ''}`,
            provincia: cambio.provincia,
            canton: cambio.canton,
            distrito: cambio.distrito,
            otras_senas: cambio.otras_senas,
            fecha: cambio.fecha_programada
          });
        });

        setOrdenesDisponibles(ordenes);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirGestionParadas = async (hoja: HojaRutaExtendida) => {
    setIsLoading(true);
    try {
      // Recargar la hoja de ruta con sus detalles actualizados
      const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}&con_detalles=true`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setHojaParaGestionar(result.data[0]);
          setIsParadasModalOpen(true);
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleGestionarParada = async (parada: DetalleHojaRuta) => {
    setIsLoading(true);
    setParadaActual(parada);
    setNotasParada(parada.notas || '');
    
    try {
      // Cargar equipos según el tipo de operación
      const equipos: EquipoParada[] = [];
      
      if (parada.tipo_operacion === TipoOperacionRuta.ENTREGA) {
        // Para entregas, obtener equipos del contrato usando el id_solicitud_equipo
        const response = await fetch(`/api/detalle-solicitud-equipo?id_solicitud_equipo=${parada.id_referencia}`);
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach((detalle: any) => {
            equipos.push({
              id: detalle.id_detalle_solicitud_equipo,
              nombre: detalle.nombre_equipo || 'Equipo',
              cantidad: detalle.cantidad_equipo || 1,
              completado: false
            });
          });
        }
      } else if (parada.tipo_operacion === TipoOperacionRuta.RECOLECCION) {
        // Para recolecciones, obtener info de la orden
        const response = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${parada.id_referencia}`);
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const orden = result.data[0];
          equipos.push({
            id: orden.id_orden_recoleccion,
            nombre: orden.nombre_equipo || 'Equipo',
            cantidad: orden.cantidad || 1,
            completado: false
          });
        }
      } else if (parada.tipo_operacion === TipoOperacionRuta.CAMBIO) {
        // Para cambios, obtener info de la orden de cambio
        const response = await fetch(`/api/orden-cambio?id_orden_cambio=${parada.id_referencia}`);
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const cambio = result.data[0];
          equipos.push({
            id: cambio.id_orden_cambio,
            nombre: `${cambio.nombre_equipo_actual} → ${cambio.nombre_equipo_nuevo}`,
            cantidad: 1,
            completado: false
          });
        }
      }
      
      setEquiposParada(equipos);
      setIsGestionParadaOpen(true);
    } catch (error) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron cargar los equipos de la parada',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recargarHojaParadas = async () => {
    if (!hojaParaGestionar) return;
    
    try {
      const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hojaParaGestionar.id_hoja_ruta}&con_detalles=true`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setHojaParaGestionar(result.data[0]);
        }
      }
    } catch (error) {
    }
  };

  const handleCompletarParada = async (estadoFinal: EstadoDetalleRuta) => {
    if (!paradaActual) return;
    
    setIsLoading(true);
    try {
      // Lógica según el tipo de operación y estado final
      if (paradaActual.tipo_operacion === TipoOperacionRuta.ENTREGA) {
        if (estadoFinal === EstadoDetalleRuta.COMPLETADO || estadoFinal === EstadoDetalleRuta.COMPLETADO_PARCIAL) {
          // Actualizar estado del detalle
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: estadoFinal,
              hora_real: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
              notas: notasParada
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || 'Error al actualizar la parada');
          }
          
          // Entrega completada: actualizar SE a DONDE_CLIENTE
          await fetch(`/api/solicitud-equipo/${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_solicitud_equipo: 4 }) // DONDE_CLIENTE
          });
        } else if (estadoFinal === EstadoDetalleRuta.NO_EJECUTADA) {
          // Actualizar estado del detalle
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: estadoFinal,
              hora_real: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
              notas: notasParada
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || 'Error al actualizar la parada');
          }
          
          // No ejecutada: revertir SE a CONTRATO_GENERADO y mantener equipos en alquilado
          await fetch(`/api/solicitud-equipo/${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_solicitud_equipo: 2 }) // CONTRATO_GENERADO
          });
          
          // Los equipos permanecen en cantidad_alquilado
          // El contrato sigue activo, solo no se pudo entregar ese día
        } else if (estadoFinal === EstadoDetalleRuta.FALLIDO) {
          // Fallido: eliminar detalle de hoja de ruta, revertir SE y liberar inventario
          // para que pueda ser reasignada a otra ruta
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || 'Error al eliminar la parada');
          }
          
          // Revertir SE a CONTRATO_GENERADO
          await fetch(`/api/solicitud-equipo/${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_solicitud_equipo: 2 }) // CONTRATO_GENERADO
          });
          
          // Los equipos permanecen en cantidad_alquilado
          // El contrato sigue activo y puede ser reasignado a otra ruta
        }
      } else if (paradaActual.tipo_operacion === TipoOperacionRuta.RECOLECCION) {
        if (estadoFinal === EstadoDetalleRuta.FALLIDO) {
          // Si el detalle estaba COMPLETADO, necesitamos revertir el inventario
          // de en_mantenimiento → en_recoleccion antes de eliminar el detalle
          if (paradaActual.estado === EstadoDetalleRuta.COMPLETADO) {
            try {
              // Obtener la orden de recolección para obtener el id_detalle_solicitud_equipo
              const ordenResponse = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`);
              if (ordenResponse.ok) {
                const ordenResult = await ordenResponse.json();
                
                if (ordenResult.success && ordenResult.data) {
                  const orden = Array.isArray(ordenResult.data) ? ordenResult.data[0] : ordenResult.data;
                  
                  if (orden && orden.id_detalle_solicitud_equipo) {
                    const detalleResponse = await fetch(`/api/detalle-solicitud-equipo/${orden.id_detalle_solicitud_equipo}`);
                    if (detalleResponse.ok) {
                      const detalleResult = await detalleResponse.json();
                      
                      if (detalleResult.success && detalleResult.data && detalleResult.data.id_equipo) {
                        const idEquipo = detalleResult.data.id_equipo;
                        const cantidadRecolectar = orden.cantidad || 0;
                        
                        // Obtener el equipo actual
                        const equipoResponse = await fetch(`/api/equipo/${idEquipo}`);
                        if (equipoResponse.ok) {
                          const equipoResult = await equipoResponse.json();
                          
                          if (equipoResult.success && equipoResult.data) {
                            const equipoActual = equipoResult.data;
                            
                            // Revertir el movimiento: en_mantenimiento → en_recoleccion
                            const cantidadEnMantenimiento = equipoActual.cantidad_en_mantenimiento || 0;
                            const cantidadAReverir = Math.min(cantidadRecolectar, cantidadEnMantenimiento);
                            
                            if (cantidadAReverir > 0) {
                              await fetch(`/api/equipo/${idEquipo}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  cantidad_en_mantenimiento: cantidadEnMantenimiento - cantidadAReverir,
                                  cantidad_en_recoleccion: (equipoActual.cantidad_en_recoleccion || 0) + cantidadAReverir
                                })
                              });
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error revirtiendo inventario:', error);
            }
          }
          
          // Fallido: eliminar detalle de hoja de ruta para que pueda ser reasignada
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || 'Error al eliminar la parada');
          }
          
          // Mantener estado de orden de recolección como pendiente
          await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 0 }) // PENDIENTE
          });
          
          // Si la orden estaba completada, revisar si la SE debe revertirse de FINALIZADO a EN_RUTA_RECOLECCION
          if (paradaActual.estado === EstadoDetalleRuta.COMPLETADO) {
            try {
              const ordenResponse = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`);
              if (ordenResponse.ok) {
                const ordenResult = await ordenResponse.json();
                if (ordenResult.success && ordenResult.data) {
                  const orden = Array.isArray(ordenResult.data) ? ordenResult.data[0] : ordenResult.data;
                  if (orden && orden.id_solicitud_equipo) {
                    // Actualizar SE a EN_RUTA_RECOLECCION ya que la orden volvió a PENDIENTE
                    await fetch(`/api/solicitud-equipo/${orden.id_solicitud_equipo}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado_solicitud_equipo: 5 }) // EN_RUTA_RECOLECCION
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error revirtiendo estado de SE:', error);
            }
          }
          
          // Si no estaba completado, el equipo ya está en cantidad_en_recoleccion
          // La orden puede ser reasignada a otra hoja de ruta
        } else if (estadoFinal === EstadoDetalleRuta.NO_EJECUTADA) {
          // Si el detalle estaba COMPLETADO, necesitamos revertir el inventario
          // de en_mantenimiento → en_recoleccion antes de marcarlo como NO_EJECUTADA
          if (paradaActual.estado === EstadoDetalleRuta.COMPLETADO) {
            try {
              // Obtener la orden de recolección para obtener el id_detalle_solicitud_equipo
              const ordenResponse = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`);
              if (ordenResponse.ok) {
                const ordenResult = await ordenResponse.json();
                
                if (ordenResult.success && ordenResult.data) {
                  const orden = Array.isArray(ordenResult.data) ? ordenResult.data[0] : ordenResult.data;
                  
                  if (orden && orden.id_detalle_solicitud_equipo) {
                    const detalleResponse = await fetch(`/api/detalle-solicitud-equipo/${orden.id_detalle_solicitud_equipo}`);
                    if (detalleResponse.ok) {
                      const detalleResult = await detalleResponse.json();
                      
                      if (detalleResult.success && detalleResult.data && detalleResult.data.id_equipo) {
                        const idEquipo = detalleResult.data.id_equipo;
                        const cantidadRecolectar = orden.cantidad || 0;
                        
                        // Obtener el equipo actual
                        const equipoResponse = await fetch(`/api/equipo/${idEquipo}`);
                        if (equipoResponse.ok) {
                          const equipoResult = await equipoResponse.json();
                          
                          if (equipoResult.success && equipoResult.data) {
                            const equipoActual = equipoResult.data;
                            
                            // Revertir el movimiento: en_mantenimiento → en_recoleccion
                            const cantidadEnMantenimiento = equipoActual.cantidad_en_mantenimiento || 0;
                            const cantidadAReverir = Math.min(cantidadRecolectar, cantidadEnMantenimiento);
                            
                            if (cantidadAReverir > 0) {
                              await fetch(`/api/equipo/${idEquipo}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  cantidad_en_mantenimiento: cantidadEnMantenimiento - cantidadAReverir,
                                  cantidad_en_recoleccion: (equipoActual.cantidad_en_recoleccion || 0) + cantidadAReverir
                                })
                              });
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error revirtiendo inventario:', error);
            }
          }
          
          // NO_EJECUTADA: No se mueve el inventario a mantenimiento
          // El equipo permanece en cantidad_en_recoleccion
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: estadoFinal,
              hora_real: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
              notas: notasParada
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || 'Error al actualizar la parada');
          }
          
          // Mantener estado de orden de recolección como pendiente
          await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 0 }) // PENDIENTE
          });
          
          // Si la orden estaba completada, revisar si la SE debe revertirse de FINALIZADO a EN_RUTA_RECOLECCION
          if (paradaActual.estado === EstadoDetalleRuta.COMPLETADO) {
            try {
              const ordenResponse = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`);
              if (ordenResponse.ok) {
                const ordenResult = await ordenResponse.json();
                if (ordenResult.success && ordenResult.data) {
                  const orden = Array.isArray(ordenResult.data) ? ordenResult.data[0] : ordenResult.data;
                  if (orden && orden.id_solicitud_equipo) {
                    // Actualizar SE a EN_RUTA_RECOLECCION ya que la orden volvió a PENDIENTE
                    await fetch(`/api/solicitud-equipo/${orden.id_solicitud_equipo}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado_solicitud_equipo: 5 }) // EN_RUTA_RECOLECCION
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error revirtiendo estado de SE:', error);
            }
          }
          
          // No se modifica el inventario - el equipo permanece en cantidad_en_recoleccion
          // La orden sigue activa y puede ser reprogramada en otra hoja de ruta
        } else if (estadoFinal === EstadoDetalleRuta.COMPLETADO) {
          // Capturar la fecha de gestión de la parada (será usada para la bitácora)
          const fechaGestionParada = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
          
          // Actualizar estado del detalle
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: estadoFinal,
              hora_real: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
              notas: notasParada
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error('Error del servidor:', errorData);
            throw new Error(errorData.error || 'Error al actualizar la parada');
          }
          
          // Completada: actualizar estado de la orden a completado
          await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 2 }) // COMPLETADA
          });
          
          // Obtener la orden de recolección para obtener el id_detalle_solicitud_equipo
          try {
            const ordenResponse = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${paradaActual.id_referencia}`);
            if (!ordenResponse.ok) {
              throw new Error('Error obteniendo orden de recolección');
            }
            const ordenResult = await ordenResponse.json();
            
            if (ordenResult.success && ordenResult.data) {
              // Si es un array, tomar el primer elemento
              const orden = Array.isArray(ordenResult.data) ? ordenResult.data[0] : ordenResult.data;
              
              // Obtener el detalle de solicitud para obtener el id_equipo
              if (orden && orden.id_detalle_solicitud_equipo) {
                const detalleResponse = await fetch(`/api/detalle-solicitud-equipo/${orden.id_detalle_solicitud_equipo}`);
                if (!detalleResponse.ok) {
                  throw new Error('Error obteniendo detalle de solicitud');
                }
                const detalleResult = await detalleResponse.json();
                
                if (detalleResult.success && detalleResult.data && detalleResult.data.id_equipo) {
                  const idEquipo = detalleResult.data.id_equipo;
                  const cantidadRecolectar = orden.cantidad || 0;
                  
                  // Obtener el equipo actual
                  const equipoResponse = await fetch(`/api/equipo/${idEquipo}`);
                  if (!equipoResponse.ok) {
                    throw new Error('Error obteniendo equipo');
                  }
                  const equipoResult = await equipoResponse.json();
                  
                  if (equipoResult.success && equipoResult.data) {
                    const equipoActual = equipoResult.data;
                    
                    // Validar que haya suficiente cantidad en recolección
                    const cantidadEnRecoleccionActual = equipoActual.cantidad_en_recoleccion || 0;
                    const cantidadAMover = Math.min(cantidadRecolectar, cantidadEnRecoleccionActual);
                    
                    if (cantidadAMover > 0) {
                      // Actualizar usando el nuevo sistema de columnas por estado
                      // en_recoleccion → en_mantenimiento
                      await fetch(`/api/equipo/${idEquipo}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          cantidad_en_recoleccion: cantidadEnRecoleccionActual - cantidadAMover,
                          cantidad_en_mantenimiento: (equipoActual.cantidad_en_mantenimiento || 0) + cantidadAMover
                        })
                      });
                      
                      // Actualizar bitácora: registrar devolución del equipo con la fecha de gestión de la parada
                      try {
                        // Usar la fecha de gestión de la parada (capturada al inicio)
                        await fetch(`/api/bitacora-equipo/devolver`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id_equipo: idEquipo,
                            id_solicitud_equipo: orden.id_solicitud_equipo,
                            fecha_devolucion: fechaGestionParada,
                            estado_bitacora: 2 // 2 = DEVUELTO
                          })
                        });
                      } catch (errorBitacora) {
                        console.error('Error al actualizar bitácora:', errorBitacora);
                        // No lanzar error para no interrumpir el flujo principal
                      }
                    }
                  }
                }
              }
              
              // Verificar si todas las órdenes de recolección de esta SE están completadas
              if (orden && orden.numero_solicitud_equipo) {
                const todasOrdenesResponse = await fetch(`/api/orden-recoleccion?numero_solicitud_equipo=${orden.numero_solicitud_equipo}`);
                if (todasOrdenesResponse.ok) {
                  const todasOrdenesResult = await todasOrdenesResponse.json();
                  
                  if (todasOrdenesResult.success && Array.isArray(todasOrdenesResult.data)) {
                    // Ignorar órdenes canceladas (estado 3) en la validación
                    const ordenesActivas = todasOrdenesResult.data.filter((o: any) => o.estado !== 3);
                    const todasCompletadas = ordenesActivas.length > 0 && ordenesActivas.every((o: any) => o.estado === 2); // 2 = COMPLETADA
                    
                    if (todasCompletadas && orden.id_solicitud_equipo) {
                      // Actualizar SE a FINALIZADO (6)
                      await fetch(`/api/solicitud-equipo/${orden.id_solicitud_equipo}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado_solicitud_equipo: 6 }) // FINALIZADO
                      });
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error actualizando estado del equipo:', error);
          }
        }
      } else if (paradaActual.tipo_operacion === TipoOperacionRuta.CAMBIO) {
        if (estadoFinal === EstadoDetalleRuta.FALLIDO) {
          // Fallido: eliminar detalle de hoja de ruta para que pueda ser reasignada
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error('Error del servidor:', errorData);
            throw new Error(errorData.error || 'Error al eliminar la parada');
          }
          
          // Mantener estado de orden de cambio como pendiente
          await fetch(`/api/orden-cambio?id_orden_cambio=${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 0 }) // PENDIENTE
          });
        } else if (estadoFinal === EstadoDetalleRuta.NO_EJECUTADA) {
          // Actualizar estado del detalle
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: estadoFinal,
              hora_real: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
              notas: notasParada
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error('Error del servidor:', errorData);
            throw new Error(errorData.error || 'Error al actualizar la parada');
          }
          
          // Mantener estado de orden de cambio como pendiente
          await fetch(`/api/orden-cambio?id_orden_cambio=${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 0 }) // PENDIENTE
          });
        } else if (estadoFinal === EstadoDetalleRuta.COMPLETADO) {
          // Actualizar estado del detalle
          const response = await fetch(`/api/hoja-ruta/detalle/${paradaActual.id_detalle_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: estadoFinal,
              hora_real: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
              notas: notasParada
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error('Error del servidor:', errorData);
            throw new Error(errorData.error || 'Error al actualizar la parada');
          }
          
          // Completada: actualizar estado a completado
          await fetch(`/api/orden-cambio?id_orden_cambio=${paradaActual.id_referencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 1 }) // COMPLETADO
          });
        }
      }
      
      setConfirmDialog({
        isOpen: true,
        title: 'Éxito',
        message: estadoFinal === EstadoDetalleRuta.FALLIDO
          ? 'Parada marcada como fallida y eliminada de la hoja de ruta. Los estados han sido revertidos y la orden puede ser reasignada.'
          : estadoFinal === EstadoDetalleRuta.NO_EJECUTADA 
          ? 'Parada marcada como no ejecutada. Los estados han sido revertidos.'
          : 'Parada actualizada correctamente',
        type: 'info',
        onConfirm: () => {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          setIsGestionParadaOpen(false);
          recargarHojaParadas();
          fetchHojas();
        }
      });
    } catch (error) {
      console.error('Error al completar parada:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al actualizar la parada',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (hoja: HojaRutaExtendida) => {
    // Si la hoja no tiene detalles, cargarlos
    if (!hoja.detalles || hoja.detalles.length === 0) {
      try {
        const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}&con_detalles=true`);
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          hoja = result.data[0];
        }
      } catch (error) {
        console.error('Error al cargar detalles:', error);
      }
    }
    setCurrentHoja(hoja);
    setIsViewing(true);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleActivar = (hoja: HojaRutaExtendida) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Activar hoja de ruta?',
      message: 'Al activar la hoja, se iniciará el proceso de entrega/recolección. ¿Desea continuar?',
      type: 'info',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: EstadoHojaRuta.ACTIVA })
          });
          if (response.ok) {
            fetchHojas();
          }
        } catch (error) {
          console.error('Error al activar hoja:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleCompletar = async (hoja: HojaRutaExtendida) => {
    setIsLoading(true);
    try {
      // Cargar los detalles de la hoja para validar estados
      const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}&con_detalles=true`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const hojaConDetalles = result.data[0];
        
        // Verificar que todas las paradas estén gestionadas (estado != 0)
        const paradasPendientes = hojaConDetalles.detalles?.filter((d: DetalleHojaRuta) => d.estado === EstadoDetalleRuta.PENDIENTE) || [];
        
        if (paradasPendientes.length > 0) {
          setConfirmDialog({
            isOpen: true,
            title: 'Paradas sin gestionar',
            message: `No se puede completar la hoja de ruta. Hay ${paradasPendientes.length} parada${paradasPendientes.length > 1 ? 's' : ''} sin gestionar. Todas las paradas deben ser gestionadas antes de completar la hoja.`,
            type: 'warning',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Si todas están gestionadas, proceder a completar
      setConfirmDialog({
        isOpen: true,
        title: '¿Completar hoja de ruta?',
        message: 'Todas las paradas han sido gestionadas. ¿Confirma que desea completar esta hoja de ruta?',
        type: 'info',
        onConfirm: async () => {
          setIsLoading(true);
          try {
            const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ estado: EstadoHojaRuta.COMPLETADA })
            });
            
            if (response.ok) {
              // Actualizar las SE de las paradas de RECOLECCION completadas a FINALIZADO
              const hojaResponse = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}&con_detalles=true`);
              const hojaResult = await hojaResponse.json();
              
              if (hojaResult.success && hojaResult.data && hojaResult.data.length > 0) {
                const hojaConDetalles = hojaResult.data[0];
                const paradasRecoleccionCompletadas = hojaConDetalles.detalles?.filter(
                  (d: DetalleHojaRuta) => d.tipo_operacion === TipoOperacionRuta.RECOLECCION && 
                                          (d.estado === EstadoDetalleRuta.COMPLETADO || d.estado === EstadoDetalleRuta.COMPLETADO_PARCIAL)
                ) || [];
                
                // Para cada recolección completada, verificar si todas las órdenes de esa SE están completadas
                for (const detalle of paradasRecoleccionCompletadas) {
                  try {
                    // Obtener la orden de recolección
                    const ordenResponse = await fetch(`/api/orden-recoleccion?id_orden_recoleccion=${detalle.id_referencia}`);
                    if (ordenResponse.ok) {
                      const ordenResult = await ordenResponse.json();
                      
                      if (ordenResult.success && ordenResult.data) {
                        const orden = Array.isArray(ordenResult.data) ? ordenResult.data[0] : ordenResult.data;
                        
                        // Verificar si todas las órdenes de recolección de esta SE están completadas
                        if (orden && orden.numero_solicitud_equipo) {
                          const todasOrdenesResponse = await fetch(`/api/orden-recoleccion?numero_solicitud_equipo=${orden.numero_solicitud_equipo}`);
                          if (todasOrdenesResponse.ok) {
                            const todasOrdenesResult = await todasOrdenesResponse.json();
                            
                            if (todasOrdenesResult.success && Array.isArray(todasOrdenesResult.data)) {
                              // Ignorar órdenes canceladas (estado 3) en la validación
                              const ordenesActivas = todasOrdenesResult.data.filter((o: any) => o.estado !== 3);
                              const todasCompletadas = ordenesActivas.length > 0 && ordenesActivas.every((o: any) => o.estado === 2); // 2 = COMPLETADA
                              
                              if (todasCompletadas && orden.id_solicitud_equipo) {
                                // Actualizar SE a FINALIZADO (6)
                                await fetch(`/api/solicitud-equipo/${orden.id_solicitud_equipo}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ estado_solicitud_equipo: 6 }) // FINALIZADO
                                });
                              }
                            }
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error(`Error actualizando SE de recolección ${detalle.id_referencia}:`, error);
                  }
                }
              }
              
              fetchHojas();
            }
          } catch (error) {
            console.error('Error al completar hoja:', error);
          } finally {
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Error al validar paradas:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al validar el estado de las paradas',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = (hoja: HojaRutaExtendida) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar hoja de ruta?',
      message: 'Las órdenes asociadas volverán a estar disponibles. ¿Desea continuar?',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/hoja-ruta?id_hoja_ruta=${hoja.id_hoja_ruta}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchHojas();
          }
        } catch (error) {
          console.error('Error al eliminar hoja:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const openCrearModal = async () => {
    await fetchOrdenesDisponibles();
    setCurrentHoja({
      fecha_creacion: new Date().toISOString().split('T')[0],
      conductor: '',
      vehiculo: '',
      estado: EstadoHojaRuta.BORRADOR,
      observaciones: ''
    });
    setOrdenesSeleccionadas([]);
    setIsCreating(true);
    setIsViewing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentHoja({
      fecha_creacion: new Date().toISOString().split('T')[0],
      conductor: '',
      vehiculo: '',
      estado: EstadoHojaRuta.BORRADOR,
      observaciones: ''
    });
    setOrdenesSeleccionadas([]);
    setIsCreating(false);
    setIsViewing(false);
  };

  const handleGenerarPDF = () => {
    // Usar window.print() que permite guardar como PDF en todos los navegadores modernos
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ordenesSeleccionadas.length === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Advertencia',
        message: 'Debe seleccionar al menos una orden para la hoja de ruta.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    setIsLoading(true);
    try {
      const detalles = ordenesSeleccionadas.map((index) => {
        const orden = ordenesDisponibles[index];
        return {
          tipo_operacion: orden.tipo,
          id_referencia: orden.id,
          numero_referencia: orden.numero,
          direccion: orden.direccion,
          provincia: orden.provincia,
          canton: orden.canton,
          distrito: orden.distrito,
          otras_senas: orden.otras_senas,
          nombre_cliente: orden.cliente,
          telefono_cliente: orden.telefono,
          estado: 0
        };
      });

      const response = await fetch('/api/hoja-ruta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentHoja,
          detalles
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchHojas();
        closeModal();
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: result.error || 'Error al crear hoja de ruta',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error creando hoja de ruta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOrden = (index: number) => {
    setOrdenesSeleccionadas(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredHojas = hojas.filter(hoja => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (hoja.numero_hoja_ruta?.toLowerCase() || '').includes(search) ||
      (hoja.conductor?.toLowerCase() || '').includes(search) ||
      (hoja.vehiculo?.toLowerCase() || '').includes(search)
    );

    const matchesEstado =
      estadoFiltro === 'todos' ? true :
      hoja.estado === estadoFiltro;

    return matchesSearch && matchesEstado;
  }).sort((a, b) => {
    const numA = a.numero_hoja_ruta || '';
    const numB = b.numero_hoja_ruta || '';
    return numB.localeCompare(numA);
  });

  const columns: Column<HojaRutaExtendida>[] = [
    { key: 'numero_hoja_ruta', header: 'Número', width: '120px' },
    { key: 'fecha_creacion', header: 'Fecha', width: '150px' },
    { key: 'conductor', header: 'Conductor', width: '200px' },
    { key: 'vehiculo', header: 'Vehículo', width: '150px' },
    {
      key: 'total_paradas',
      header: 'Paradas',
      width: '100px',
      render: (h) => h.total_paradas || 0
    },
    {
      key: 'estado',
      header: 'Estado',
      width: '150px',
      render: (h) => {
        const estado = h.estado ?? EstadoHojaRuta.BORRADOR;
        const label = EstadoHojaRutaLabels[estado] || 'Desconocido';

        let className = styles.statusActive;
        if (estado === EstadoHojaRuta.CANCELADA) {
          className = styles.statusInactive;
        } else if (estado === EstadoHojaRuta.COMPLETADA) {
          className = styles.statusSuccess;
        } else if (estado === EstadoHojaRuta.ACTIVA) {
          className = styles.statusContrato;
        }

        return <span className={className}>{label}</span>;
      }
    }
  ];

  const actions: TableAction<HojaRutaExtendida>[] = [
    {
      label: '👁️',
      onClick: handleView,
      className: styles.btnView,
      tooltip: 'Ver detalles',
      condition: (hoja) => usuario?.usuario_rol !== 5
    },
    {
      label: '🖨️',
      onClick: (hoja) => {
        handleView(hoja);
        setTimeout(() => window.print(), 500);
      },
      className: styles.btnImprimir,
      tooltip: 'Imprimir hoja de ruta',
      condition: (hoja) => usuario?.usuario_rol !== 5
    },
    {
      label: '▶️',
      onClick: handleActivar,
      className: styles.btnContrato,
      tooltip: 'Activar hoja de ruta',
      condition: (hoja) => usuario?.usuario_rol !== 5 && hoja.estado === EstadoHojaRuta.BORRADOR
    },
    {
      label: '📋',
      onClick: handleAbrirGestionParadas,
      className: styles.btnContrato,
      tooltip: 'Gestionar paradas',
      condition: (hoja) => hoja.estado === EstadoHojaRuta.ACTIVA
    },
    {
      label: '✅',
      onClick: handleCompletar,
      className: styles.btnEdit,
      tooltip: 'Completar hoja de ruta',
      condition: (hoja) => usuario?.usuario_rol !== 5 && hoja.estado === EstadoHojaRuta.ACTIVA
    },
    {
      label: '🗑️',
      onClick: handleEliminar,
      className: styles.btnAnular,
      tooltip: 'Eliminar hoja de ruta',
      condition: (hoja) => usuario?.usuario_rol !== 5 && hoja.estado === EstadoHojaRuta.BORRADOR
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Hojas de Ruta</h1>
          {usuario?.usuario_rol !== 5 && (
            <button className={styles.btnAdd} onClick={openCrearModal}>
              + Nueva Hoja de Ruta
            </button>
          )}
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar hojas de ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
            className={styles.searchInput}
            style={{ width: '220px', marginLeft: '1rem' }}
          >
            <option value="todos">Todos los estados</option>
            {Object.entries(EstadoHojaRutaLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredHojas}
          actions={actions}
          keyExtractor={(h) => h.id_hoja_ruta!}
          noDataMessage="No se encontraron hojas de ruta"
        />

        {isModalOpen && (
          <div className={`${styles.modalOverlay} ${isViewing ? 'print-hoja-ruta' : ''}`} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h2 style={{ margin: 0 }}>{isViewing ? `Hoja de Ruta N° ${currentHoja.numero_hoja_ruta || ''}` : 'Nueva Hoja de Ruta'}</h2>
                  {isViewing && currentHoja.fecha_creacion && (
                    <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>
                      {new Date(currentHoja.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <button className={styles.closeBtn} onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {isViewing && (
                  <div className="print-only" style={{ display: 'none', marginBottom: '1rem', padding: '1rem', border: '2px solid #000' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <h1 style={{ margin: 0 }}>HOJA DE RUTA N° {currentHoja.numero_hoja_ruta}</h1>
                      <p style={{ margin: '0.5rem 0 0 0' }}>Fecha de impresión: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
                <div className={styles.section}>
                  <h3>Datos de la Hoja de Ruta</h3>
                  <div className={styles.formRow}>
                    {isViewing && (
                      <div className={styles.formGroup}>
                        <label>Número</label>
                        <input
                          type="text"
                          value={currentHoja.numero_hoja_ruta || ''}
                          readOnly
                          style={{ background: '#f0f0f0' }}
                        />
                      </div>
                    )}
                    <div className={styles.formGroup}>
                      <label>Fecha Ruta *</label>
                      <input
                        type="date"
                        value={currentHoja.fecha_creacion || ''}
                        onChange={(e) => setCurrentHoja({ ...currentHoja, fecha_creacion: e.target.value })}
                        disabled={isViewing}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Conductor *</label>
                      <input
                        type="text"
                        value={currentHoja.conductor || ''}
                        onChange={(e) => setCurrentHoja({ ...currentHoja, conductor: e.target.value })}
                        disabled={isViewing}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Vehículo</label>
                      <input
                        type="text"
                        value={currentHoja.vehiculo || ''}
                        onChange={(e) => setCurrentHoja({ ...currentHoja, vehiculo: e.target.value })}
                        disabled={isViewing}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Observaciones</label>
                    <textarea
                      value={currentHoja.observaciones || ''}
                      onChange={(e) => setCurrentHoja({ ...currentHoja, observaciones: e.target.value })}
                      disabled={isViewing}
                      rows={3}
                    />
                  </div>
                </div>

                {isCreating && (
                  <div className={styles.section}>
                    <h3>Seleccionar Órdenes para la Ruta</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                      {ordenesDisponibles.map((orden, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: ordenesSeleccionadas.includes(index) ? '#e3f2fd' : 'white',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem'
                          }}
                          onClick={() => toggleOrden(index)}
                        >
                          <input
                            type="checkbox"
                            checked={ordenesSeleccionadas.includes(index)}
                            onChange={() => toggleOrden(index)}
                            style={{ marginTop: '0.25rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                              <span className={
                                orden.tipo === TipoOperacionRuta.ENTREGA ? styles.statusSuccess :
                                orden.tipo === TipoOperacionRuta.RECOLECCION ? styles.statusActive :
                                styles.statusContrato
                              } style={{ marginRight: '0.5rem' }}>
                                {TipoOperacionRutaLabels[orden.tipo]}
                              </span>
                              {orden.numero} - {orden.descripcion}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                              Cliente: {orden.cliente} | Teléfono: {orden.telefono}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#888' }}>
                              📍 {orden.direccion}
                            </div>
                            {orden.fecha && (
                              <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                📅 {orden.fecha}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {ordenesDisponibles.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                          No hay órdenes disponibles
                        </div>
                      )}
                    </div>
                    {ordenesSeleccionadas.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px' }}>
                        <strong>Órdenes seleccionadas:</strong> {ordenesSeleccionadas.length}
                      </div>
                    )}
                  </div>
                )}

                {isViewing && currentHoja.detalles && currentHoja.detalles.length > 0 && (
                  <div className={`${styles.section} seccion-paradas`}>
                    <h3>Paradas de la Ruta</h3>
                    <div className="paradas-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {currentHoja.detalles.map((detalle, index) => (
                        <div
                          key={index}
                          className="parada-item"
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #eee',
                            backgroundColor: 'white',
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '1rem'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                              <span style={{ marginRight: '0.5rem', color: '#666' }}>#{detalle.orden_visita}</span>
                              <span className={
                                detalle.tipo_operacion === TipoOperacionRuta.ENTREGA ? styles.statusSuccess :
                                detalle.tipo_operacion === TipoOperacionRuta.RECOLECCION ? styles.statusActive :
                                styles.statusContrato
                              } style={{ marginRight: '0.5rem' }}>
                                {TipoOperacionRutaLabels[detalle.tipo_operacion!]}
                              </span>
                              {detalle.numero_referencia}
                              {detalle.estado !== undefined && (
                                <span style={{
                                  marginLeft: '0.5rem',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  backgroundColor: 
                                    detalle.estado === EstadoDetalleRuta.COMPLETADO ? '#4CAF50' :
                                    detalle.estado === EstadoDetalleRuta.COMPLETADO_PARCIAL ? '#FF9800' :
                                    detalle.estado === EstadoDetalleRuta.FALLIDO ? '#f44336' :
                                    detalle.estado === EstadoDetalleRuta.NO_EJECUTADA ? '#9E9E9E' : '#9E9E9E',
                                  color: 'white'
                                }}>
                                  {EstadoDetalleRutaLabels[detalle.estado]}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                              Cliente: {detalle.nombre_cliente} | {detalle.telefono_cliente}
                            </div>
                            {detalle.equipos_info && (
                              <div style={{ fontSize: '0.9rem', color: '#333', marginBottom: '0.25rem', fontWeight: 500 }}>
                                📦 {detalle.equipos_info}
                              </div>
                            )}
                            <div style={{ fontSize: '0.85rem', color: '#888' }}>
                              📍 {detalle.provincia}, {detalle.canton}, {detalle.distrito}
                            </div>
                            {detalle.otras_senas && (
                              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                                {detalle.otras_senas}
                              </div>
                            )}
                            {detalle.notas && (
                              <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                📝 {detalle.notas}
                              </div>
                            )}
                            {detalle.hora_real && (
                              <div style={{ fontSize: '0.85rem', color: '#4CAF50', marginTop: '0.25rem' }}>
                                ⏱️ Completado a las {detalle.hora_real}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '100px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textAlign: 'center' }}>
                              Acciones
                            </div>
                            {currentHoja.estado === EstadoHojaRuta.ACTIVA && (
                              <button
                                onClick={() => handleGestionarParada(detalle)}
                                className={styles.btnEdit}
                                title="Gestionar parada"
                              >
                                📋 Gestionar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isViewing && (
                  <div className="print-only" style={{ display: 'none', marginTop: '3rem', padding: '2rem 0', borderTop: '2px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', paddingBottom: '2rem' }}></div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Firma del Conductor</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{currentHoja.conductor}</p>
                      </div>
                      <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', paddingBottom: '2rem' }}></div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Firma del Supervisor</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                      <p>Este documento es un registro oficial de las entregas, recolecciones y cambios de equipo realizados.</p>
                    </div>
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>
                    {isViewing ? 'Cerrar' : 'Cancelar'}
                  </button>                  {isViewing && (
                    <button type="button" className={styles.btnSubmit} onClick={handleGenerarPDF}>
                      🖨️ Imprimir Hoja de Ruta
                    </button>
                  )}                  {!isViewing && (
                    <button type="submit" className={styles.btnSubmit}>
                      Crear Hoja de Ruta
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
      
      {/* Modal de lista de paradas para gestionar */}
      {isParadasModalOpen && hojaParaGestionar && (
        <div className={styles.modalOverlay} onClick={() => setIsParadasModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className={styles.modalHeader}>
              <h2>Gestión de Paradas - Hoja N° {hojaParaGestionar.numero_hoja_ruta}</h2>
              <button className={styles.closeBtn} onClick={() => setIsParadasModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.section}>
                <div style={{ marginBottom: '1rem', color: '#666' }}>
                  <strong>Conductor:</strong> {hojaParaGestionar.conductor} | <strong>Vehículo:</strong> {hojaParaGestionar.vehiculo || 'N/A'}
                </div>
                {hojaParaGestionar.detalles && hojaParaGestionar.detalles.length > 0 ? (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {hojaParaGestionar.detalles.map((detalle, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid #eee',
                          backgroundColor: 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                            <span style={{ marginRight: '0.5rem', color: '#666' }}>#{detalle.orden_visita}</span>
                            <span className={
                              detalle.tipo_operacion === TipoOperacionRuta.ENTREGA ? styles.statusSuccess :
                              detalle.tipo_operacion === TipoOperacionRuta.RECOLECCION ? styles.statusActive :
                              styles.statusContrato
                            } style={{ marginRight: '0.5rem' }}>
                              {TipoOperacionRutaLabels[detalle.tipo_operacion!]}
                            </span>
                            {detalle.numero_referencia}
                            {detalle.estado !== undefined && (
                              <span style={{
                                marginLeft: '0.5rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                backgroundColor: 
                                  detalle.estado === EstadoDetalleRuta.COMPLETADO ? '#4CAF50' :
                                  detalle.estado === EstadoDetalleRuta.COMPLETADO_PARCIAL ? '#FF9800' :
                                  detalle.estado === EstadoDetalleRuta.FALLIDO ? '#f44336' :
                                  detalle.estado === EstadoDetalleRuta.NO_EJECUTADA ? '#9E9E9E' : '#9E9E9E',
                                color: 'white'
                              }}>
                                {EstadoDetalleRutaLabels[detalle.estado]}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                            Cliente: {detalle.nombre_cliente} | {detalle.telefono_cliente}
                          </div>
                          {detalle.equipos_info && (
                            <div style={{ fontSize: '0.9rem', color: '#333', marginBottom: '0.25rem', fontWeight: 500 }}>
                              📦 {detalle.equipos_info}
                            </div>
                          )}
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>
                            📍 {detalle.provincia}, {detalle.canton}, {detalle.distrito}
                          </div>
                          {detalle.otras_senas && (
                            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                              {detalle.otras_senas}
                            </div>
                          )}
                          {detalle.notas && (
                            <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              📝 {detalle.notas}
                            </div>
                          )}
                          {detalle.hora_real && (
                            <div style={{ fontSize: '0.85rem', color: '#4CAF50', marginTop: '0.25rem' }}>
                              ⏱️ Completado a las {detalle.hora_real}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '100px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', textAlign: 'center' }}>
                            Acciones
                          </div>
                          <button
                            onClick={() => {
                              handleGestionarParada(detalle);
                            }}
                            className={styles.btnEdit}
                            title="Gestionar parada"
                          >
                            📋 Gestionar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                    No hay paradas en esta hoja de ruta
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnCancel} onClick={() => setIsParadasModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión de parada */}
      {isGestionParadaOpen && paradaActual && (
        <div className={styles.modalOverlay} onClick={() => setIsGestionParadaOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2>Gestionar Parada</h2>
              <button className={styles.closeBtn} onClick={() => setIsGestionParadaOpen(false)}>×</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Información de la parada */}
              <div className={styles.section}>
                <h3>Información de la Parada</h3>
                <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Tipo:</strong> {TipoOperacionRutaLabels[paradaActual.tipo_operacion!]}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Referencia:</strong> {paradaActual.numero_referencia}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Cliente:</strong> {paradaActual.nombre_cliente}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Dirección:</strong> {paradaActual.provincia}, {paradaActual.canton}, {paradaActual.distrito}
                  </div>
                  {paradaActual.otras_senas && (
                    <div>
                      <strong>Otras señas:</strong> {paradaActual.otras_senas}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de equipos */}
              <div className={styles.section}>
                <h3>Equipos en esta Parada</h3>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', fontStyle: 'italic' }}>
                  El estado seleccionado se aplicará a todos los equipos de esta parada.
                </div>
                {equiposParada.length > 0 ? (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {equiposParada.map((equipo, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <div style={{ marginRight: '1rem', fontSize: '1.2rem' }}>•</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{equipo.nombre}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>Cantidad: {equipo.cantidad}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                    Cargando equipos...
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className={styles.section}>
                <h3>Observaciones</h3>
                <textarea
                  value={notasParada}
                  onChange={(e) => setNotasParada(e.target.value)}
                  placeholder="Ingrese observaciones sobre la parada (opcional)"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => handleCompletarParada(EstadoDetalleRuta.COMPLETADO)}
                  className={styles.btnSubmit}
                  style={{ flex: 1, backgroundColor: '#4CAF50' }}
                >
                  ✓ Completado
                </button>
                <button
                  onClick={() => handleCompletarParada(EstadoDetalleRuta.NO_EJECUTADA)}
                  className={styles.btnSubmit}
                  style={{ flex: 1, backgroundColor: '#9E9E9E' }}
                >
                  ⊘ No Ejecutada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

export default HojaRuta;
