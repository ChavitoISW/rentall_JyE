import React, { useState, useEffect, useRef } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import SelectorDireccion, { DireccionSeleccionada } from './SelectorDireccion';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import SearchableSelect from './SearchableSelect';
import styles from '../styles/SolicitudEquipo.module.css';
import { 
  EstadoSolicitudEquipo, 
  EstadoSolicitudEquipoLabels,
  EncabezadoSolicitudEquipo,
  DetalleSolicitudEquipo
} from '../types/solicitudEquipo';
import { EstadoEquipo } from '../types/estadoEquipo';

interface DetalleSolicitudEquipoExtended extends DetalleSolicitudEquipo {
  nombre_equipo?: string;
}

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  apellidos_cliente: string;
  documento_identidad_cliente?: string;
  telefono_cliente?: string;
}

interface Equipo {
  id_equipo: number;
  nombre_equipo: string;
  id_equipo_categoria?: number;
  id_estado_equipo?: number;
  id_equipo_especifico?: number;
  nombre_categoria?: string;
  cantidad_equipo?: number;
  cantidad_disponible?: number;
  cantidad_alquilado?: number;
  cantidad_reservado?: number;
  precio_dia?: number;
  precio_semana?: number;
  precio_quincena?: number;
  precio_mes?: number;
}

interface EquipoConsolidado {
  nombre_equipo: string;
  id_equipo_categoria?: number;
  id_equipo_especifico?: number;
  nombre_categoria?: string;
  cantidad_disponible: number;
  equipos_con_cantidades: Array<{ id_equipo: number; cantidad: number }>; // IDs con sus cantidades
  precio_dia?: number;
  precio_semana?: number;
  precio_quincena?: number;
  precio_mes?: number;
}

const SolicitudesEquipo: React.FC = () => {
  const [solicitudesEquipo, setSolicitudesEquipo] = useState<EncabezadoSolicitudEquipo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]); // Equipos individuales (para edición)
  const [equiposConsolidados, setEquiposConsolidados] = useState<EquipoConsolidado[]>([]); // Para dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentSolicitudEquipo, setCurrentSolicitudEquipo] = useState<EncabezadoSolicitudEquipo>({
    numero_solicitud_equipo: '',
    id_cliente: 0,
    fecha_elaboracion: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    nombre_recibe: '',
    cedula_recibe: '',
    telefono_recibe: '',
    precio_total_equipos: 0,
    observaciones_solicitud_equipo: '',
    pago_envio: false,
    monto_envio: 0,
    usa_factura: false,
    subtotal_solicitud_equipo: 0,
    descuento_solicitud_equipo: 0,
    total_solicitud_equipo: 0,
    iva_solicitud_equipo: 0,
    estado_solicitud_equipo: EstadoSolicitudEquipo.SOLICITUD,
  });

  const [detalles, setDetalles] = useState<DetalleSolicitudEquipo[]>([]);
  const [ordenesRecoleccion, setOrdenesRecoleccion] = useState<number[]>([]); // IDs de detalles con órdenes de recolección
  const [direccion, setDireccion] = useState<DireccionSeleccionada>({
    provincia: '',
    canton: '',
    distrito: '',
    otrasSenas: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | 'todos'>('todos');
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteDropdownRef = useRef<HTMLDivElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    showCancel?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    fetchSolicitudesEquipo();
    fetchClientes();
    fetchEquipos();
  }, []);

  useEffect(() => {
    // Verificar si hay un parámetro de búsqueda en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const numeroSE = urlParams.get('numero');
    
    if (numeroSE && solicitudesEquipo.length > 0) {
      const seEncontrada = solicitudesEquipo.find(
        se => se.numero_solicitud_equipo === numeroSE
      );
      
      if (seEncontrada) {
        handleView(seEncontrada);
        // Limpiar el parámetro de la URL sin recargar la página
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [solicitudesEquipo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };

    if (showClienteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClienteDropdown]);

  const fetchSolicitudesEquipo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/solicitud-equipo');
      const result = await response.json();
      
      if (Array.isArray(result.data)) {
        // Solo cargar las solicitudes sin los detalles
        // El estado de vencimiento se calculará cuando se abra cada solicitud
        setSolicitudesEquipo(result.data.map((solicitud: EncabezadoSolicitudEquipo) => ({
          ...solicitud,
          estadoVencimiento: 'normal' // Valor por defecto
        })));
      } else {
        setSolicitudesEquipo([]);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes de equipo:', error);
      setSolicitudesEquipo([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/cliente');
      const result = await response.json();
      setClientes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setClientes([]);
    }
  };

  const fetchEquipos = async () => {
    try {
      const response = await fetch('/api/equipo');
      const result = await response.json();
      
      if (Array.isArray(result.data)) {
        // Filtrar solo equipos DISPONIBLES (estado 1)
        const equiposDisponibles = result.data.filter((equipo: Equipo) => {
          const estado = Number(equipo.id_estado_equipo);
          return estado === EstadoEquipo.DISPONIBLE;
        });
        
        // Enriquecer equipos con precios de sus categorías específicas
        const equiposConPrecios = await Promise.all(
          equiposDisponibles.map(async (equipo: Equipo) => {
            if (equipo.id_equipo_especifico && equipo.nombre_categoria) {
              const cat = equipo.nombre_categoria.toLowerCase();
              let endpoint = '';
              
              if (cat.includes('mezcladora')) endpoint = 'mezcladora';
              else if (cat.includes('andamio')) endpoint = 'andamio';
              else if (cat.includes('compactador')) endpoint = 'compactador';
              else if (cat.includes('rompedor')) endpoint = 'rompedor';
              else if (cat.includes('vibrador')) endpoint = 'vibrador';
              else if (cat.includes('puntal')) endpoint = 'puntal';
              
              if (endpoint) {
                try {
                  const resp = await fetch(`/api/${endpoint}/${equipo.id_equipo_especifico}`);
                  const data = await resp.json();
                  if (data.success && data.data) {
                    return {
                      ...equipo,
                      precio_dia: data.data.precio_dia,
                      precio_semana: data.data.precio_semana,
                      precio_quincena: data.data.precio_quincena,
                      precio_mes: data.data.precio_mes
                    };
                  }
                } catch (error) {
                  console.error(`Error obteniendo precios de ${endpoint}:`, error);
                }
              }
            }
            return equipo;
          })
        );
        
        setEquipos(equiposConPrecios);
        
        // Consolidar equipos por nombre_equipo para el dropdown
        const consolidadoMap = new Map<string, EquipoConsolidado>();
        
        for (const equipo of equiposConPrecios) {
          const key = `${equipo.nombre_equipo}_${equipo.id_equipo_categoria || 0}`;
          
          if (!consolidadoMap.has(key)) {
            consolidadoMap.set(key, {
              nombre_equipo: equipo.nombre_equipo,
              id_equipo_categoria: equipo.id_equipo_categoria,
              id_equipo_especifico: equipo.id_equipo_especifico,
              nombre_categoria: equipo.nombre_categoria,
              cantidad_disponible: 0,
              equipos_con_cantidades: [],
              precio_dia: equipo.precio_dia,
              precio_semana: equipo.precio_semana,
              precio_quincena: equipo.precio_quincena,
              precio_mes: equipo.precio_mes
            });
          }
          
          const consolidado = consolidadoMap.get(key)!;
          // Usar cantidad_disponible del sistema de inventario por estados
          const cantidadDisponible = equipo.cantidad_disponible || 0;
          consolidado.cantidad_disponible += cantidadDisponible;
          consolidado.equipos_con_cantidades.push({
            id_equipo: equipo.id_equipo,
            cantidad: cantidadDisponible
          });
        }
        
        setEquiposConsolidados(Array.from(consolidadoMap.values()));
      } else {
        setEquipos([]);
        setEquiposConsolidados([]);
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setEquipos([]);
      setEquiposConsolidados([]);
    }
  };

  const generarNumeroSolicitudEquipo = () => {
    if (solicitudesEquipo.length === 0) {
      return '00001';
    }
    
    // Obtener todos los números de solicitud de equipo y encontrar el máximo
    const numeros = solicitudesEquipo
      .map(c => c.numero_solicitud_equipo || '0')
      .map(n => parseInt(n) || 0)
      .filter(n => !isNaN(n));
    
    const maxNumero = Math.max(...numeros, 0);
    const siguienteNumero = maxNumero + 1;
    
    // Formatear con ceros a la izquierda (5 dígitos)
    return siguienteNumero.toString().padStart(5, '0');
  };

  const filteredClientes = clientes.filter(cliente =>
    clienteSearchTerm === '' ||
    cliente.nombre_cliente.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    cliente.apellidos_cliente.toLowerCase().includes(clienteSearchTerm.toLowerCase())
  );

  const handleSelectCliente = (cliente: Cliente) => {
    setCurrentSolicitudEquipo({ 
      ...currentSolicitudEquipo, 
      id_cliente: cliente.id_cliente,
      nombre_recibe: `${cliente.nombre_cliente} ${cliente.apellidos_cliente}`,
      cedula_recibe: cliente.documento_identidad_cliente || '',
      telefono_recibe: cliente.telefono_cliente || ''
    });
    setClienteSearchTerm(`${cliente.nombre_cliente} ${cliente.apellidos_cliente}`);
    setShowClienteDropdown(false);
  };

  const getClienteNombre = (id: number) => {
    const cliente = clientes.find(c => c.id_cliente === id);
    return cliente ? `${cliente.nombre_cliente} ${cliente.apellidos_cliente}` : '';
  };

  const getClienteTelefono = (id: number) => {
    const cliente = clientes.find(c => c.id_cliente === id);
    return cliente?.telefono_cliente || '-';
  };

  const calcularFechaVencimiento = (detallesActuales: DetalleSolicitudEquipo[]) => {
    // Obtener todas las fechas de devolución válidas
    const fechasDevolucion = detallesActuales
      .map(d => d.fecha_devolucion)
      .filter(fecha => fecha && fecha !== '')
      .map(fecha => new Date(fecha + 'T00:00:00'));
    
    // Si hay fechas de devolución, encontrar la mayor
    if (fechasDevolucion.length > 0) {
      const fechaMaxima = new Date(Math.max(...fechasDevolucion.map(f => f.getTime())));
      return fechaMaxima.toISOString().split('T')[0];
    }
    
    return '';
  };

  const obtenerEstadoFechaDevolucion = (fechaDevolucion: string): 'vencida' | 'proxima' | 'normal' => {
    if (!fechaDevolucion) return 'normal';
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaDev = new Date(fechaDevolucion + 'T00:00:00');
    
    // Si la fecha ya pasó, está vencida
    if (fechaDev < hoy) {
      return 'vencida';
    }
    
    // Si la fecha es dentro de los próximos 3 días, está próxima a vencer
    const tresDiasDespues = new Date(hoy);
    tresDiasDespues.setDate(tresDiasDespues.getDate() + 3);
    
    if (fechaDev <= tresDiasDespues) {
      return 'proxima';
    }
    
    return 'normal';
  };

  const handleRecoger = async (index: number) => {
    const detalle = detalles[index];
    const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Crear Orden de Recolección',
      message: `¿Desea crear una orden de recolección para el equipo "${detalleExtendido.nombre_equipo || 'Equipo'}"?`,
      type: 'info',
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
      onConfirm: async () => {
        setIsLoading(true);
        try {
          // Verificar si ya existe una orden activa (no cancelada) para este detalle
          const checkResponse = await fetch(`/api/orden-recoleccion?id_detalle_solicitud_equipo=${detalle.id_detalle_solicitud_equipo}`);
          const checkResult = await checkResponse.json();
          
          if (checkResult.success && Array.isArray(checkResult.data) && checkResult.data.length > 0) {
            // Verificar si hay órdenes en estado diferente a CANCELADA (3)
            const ordenActiva = checkResult.data.find((orden: any) => orden.estado !== 3);
            if (ordenActiva) {
              setConfirmDialog({
                isOpen: true,
                title: 'Orden Existente',
                message: `Ya existe una orden de recolección activa (${ordenActiva.numero_orden_recoleccion}) para este equipo.`,
                type: 'warning',
                onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
              });
              setIsLoading(false);
              return;
            }
          }
          
          // Crear orden de recolección
          const ordenData = {
            id_detalle_solicitud_equipo: detalle.id_detalle_solicitud_equipo,
            id_solicitud_equipo: currentSolicitudEquipo.id_solicitud_equipo,
            numero_solicitud_equipo: currentSolicitudEquipo.numero_solicitud_equipo,
            fecha_programada_recoleccion: detalle.fecha_devolucion,
            nombre_equipo: detalleExtendido.nombre_equipo,
            cantidad: detalle.cantidad_equipo,
            estado: 0, // Pendiente
            provincia: currentSolicitudEquipo.provincia_solicitud_equipo || direccion.provincia,
            canton: currentSolicitudEquipo.canton_solicitud_equipo || direccion.canton,
            distrito: currentSolicitudEquipo.distrito_solicitud_equipo || direccion.distrito,
            otras_senas: currentSolicitudEquipo.otras_senas_solicitud_equipo || direccion.otrasSenas,
            nombre_cliente: currentSolicitudEquipo.nombre_recibe,
            telefono_cliente: currentSolicitudEquipo.telefono_recibe
          };

          const response = await fetch('/api/orden-recoleccion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ordenData)
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // El equipo ya está en cantidad_alquilado desde que se generó el contrato
            // No necesitamos actualizar nada aquí - la orden de recolección está lista para la hoja de ruta
            
            // Agregar el ID del detalle a la lista de órdenes de recolección
            if (detalle.id_detalle_solicitud_equipo) {
              setOrdenesRecoleccion(prev => [...prev, detalle.id_detalle_solicitud_equipo!]);
            }
            
            // Verificar si ahora todas las líneas tienen órdenes de recolección
            const totalLineas = detalles.length;
            
            // Obtener todas las órdenes de recolección para esta SE
            const ordenesResponse = await fetch(`/api/orden-recoleccion?numero_solicitud_equipo=${currentSolicitudEquipo.numero_solicitud_equipo}`);
            const ordenesResult = await ordenesResponse.json();
            
            let todasTienenOrden = false;
            if (ordenesResult.success && Array.isArray(ordenesResult.data)) {
              // Contar líneas únicas con órdenes de recolección
              const lineasConOrden = new Set(ordenesResult.data.map((o: any) => o.id_detalle_solicitud_equipo));
              todasTienenOrden = lineasConOrden.size === totalLineas;
              
              // Actualizar el estado con todos los IDs
              setOrdenesRecoleccion(Array.from(lineasConOrden) as number[]);
            }
            
            setConfirmDialog({
              isOpen: true,
              title: 'Éxito',
              message: todasTienenOrden 
                ? `Orden de recolección ${result.data.numero_orden_recoleccion} creada exitosamente. Todas las líneas tienen órdenes de recolección.`
                : `Orden de recolección ${result.data.numero_orden_recoleccion} creada exitosamente.`,
              type: 'info',
              onConfirm: () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                fetchSolicitudesEquipo();
              }
            });
          } else {
            throw new Error(result.error || 'Error al crear orden');
          }
        } catch (error) {
          console.error('Error creando orden de recolección:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al crear la orden de recolección. Por favor, intenta de nuevo.',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleRecogerTodos = async (solicitud: EncabezadoSolicitudEquipo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Crear Órdenes de Recolección',
      message: '¿Desea crear órdenes de recolección para todos los equipos de esta solicitud?',
      type: 'info',
      showCancel: true,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          // Obtener detalles de la solicitud
          const response = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${solicitud.numero_solicitud_equipo}`);
          const result = await response.json();
          const detallesSolicitud = Array.isArray(result.data) ? result.data : [];

          if (detallesSolicitud.length === 0) {
            setConfirmDialog({
              isOpen: true,
              title: 'Sin equipos',
              message: 'No hay equipos en esta solicitud.',
              type: 'warning',
              onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
            });
            return;
          }

          let ordenesCreadas = 0;
          let errores = 0;
          let duplicadas = 0;

          // Crear orden de recolección para cada equipo
          for (const detalle of detallesSolicitud) {
            // Verificar si ya existe una orden activa (no cancelada) para este detalle
            try {
              const checkResponse = await fetch(`/api/orden-recoleccion?id_detalle_solicitud_equipo=${detalle.id_detalle_solicitud_equipo}`);
              const checkResult = await checkResponse.json();
              
              if (checkResult.success && Array.isArray(checkResult.data) && checkResult.data.length > 0) {
                // Verificar si hay órdenes en estado diferente a CANCELADA (3)
                const ordenActiva = checkResult.data.find((orden: any) => orden.estado !== 3);
                if (ordenActiva) {
                  // Ya existe una orden activa para este detalle
                  duplicadas++;
                  continue;
                }
              }
            } catch (error) {
              console.error('Error verificando orden duplicada:', error);
            }

            const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
            const ordenData = {
              id_detalle_solicitud_equipo: detalle.id_detalle_solicitud_equipo,
              id_solicitud_equipo: solicitud.id_solicitud_equipo,
              numero_solicitud_equipo: solicitud.numero_solicitud_equipo,
              fecha_programada_recoleccion: detalle.fecha_devolucion,
              nombre_equipo: detalleExtendido.nombre_equipo,
              cantidad: detalle.cantidad_equipo,
              estado: 0, // Pendiente
              provincia: solicitud.provincia_solicitud_equipo,
              canton: solicitud.canton_solicitud_equipo,
              distrito: solicitud.distrito_solicitud_equipo,
              otras_senas: solicitud.otras_senas_solicitud_equipo,
              nombre_cliente: solicitud.nombre_recibe,
              telefono_cliente: solicitud.telefono_recibe
            };

            try {
              const ordenResponse = await fetch('/api/orden-recoleccion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ordenData)
              });

              const ordenResult = await ordenResponse.json();

              if (ordenResponse.ok && ordenResult.success) {
                ordenesCreadas++;
                
                // El equipo ya está en cantidad_alquilado desde que se generó el contrato
                // No necesitamos actualizar nada aquí - la orden de recolección está lista para la hoja de ruta
              } else {
                errores++;
              }
            } catch (error) {
              errores++;
            }
          }

          let mensaje = '';
          if (ordenesCreadas > 0 && errores === 0 && duplicadas === 0) {
            mensaje = `Se crearon ${ordenesCreadas} boleta(s) de recolección exitosamente.`;
            
            // Actualizar estado de la SE a EN_RUTA_RECOLECCION
            try {
              await fetch(`/api/solicitud-equipo/${solicitud.id_solicitud_equipo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...solicitud,
                  estado_solicitud_equipo: EstadoSolicitudEquipo.EN_RUTA_RECOLECCION
                })
              });
            } catch (error) {
              console.error('Error actualizando estado de SE:', error);
            }
          } else if (ordenesCreadas > 0 || duplicadas > 0) {
            const partes = [];
            if (ordenesCreadas > 0) partes.push(`${ordenesCreadas} boleta(s) creada(s)`);
            if (duplicadas > 0) partes.push(`${duplicadas} equipo(s) ya cuenta(n) con boleta de recolección`);
            if (errores > 0) partes.push(`${errores} error(es)`);
            mensaje = partes.join(', ') + '.';
          } else {
            mensaje = 'No se pudieron crear las boletas de recolección.';
          }

          setConfirmDialog({
            isOpen: true,
            title: ordenesCreadas > 0 ? 'Boletas de Recolección' : 'Error',
            message: mensaje,
            type: ordenesCreadas > 0 ? 'info' : 'danger',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
              fetchSolicitudesEquipo();
            }
          });
        } catch (error) {
          console.error('Error creando órdenes de recolección:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al crear las órdenes de recolección. Por favor, intenta de nuevo.',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleFechaInicioChange = (nuevaFechaInicio: string) => {
    setCurrentSolicitudEquipo(prev => ({ ...prev, fecha_inicio: nuevaFechaInicio }));
    
    // Recalcular todas las fechas de devolución de los detalles
    if (nuevaFechaInicio && detalles.length > 0) {
      const nuevosDetalles = detalles.map(detalle => {
        const cantidadPeriodos = detalle.cantidad_periodicidad || 0;
        if (detalle.periodicidad !== -1 && cantidadPeriodos > 0) {
          const fechaInicio = new Date(nuevaFechaInicio + 'T00:00:00');
          let fechaDevolucion = new Date(fechaInicio);
          
          switch (detalle.periodicidad) {
            case 0: // Día
              fechaDevolucion.setDate(fechaDevolucion.getDate() + (cantidadPeriodos * 1));
              break;
            case 1: // Semana
              fechaDevolucion.setDate(fechaDevolucion.getDate() + (cantidadPeriodos * 7));
              break;
            case 2: // Quincena
              fechaDevolucion.setDate(fechaDevolucion.getDate() + (cantidadPeriodos * 14));
              break;
            case 4: // Mes
              fechaDevolucion.setMonth(fechaDevolucion.getMonth() + cantidadPeriodos);
              break;
          }
          
          return {
            ...detalle,
            fecha_devolucion: fechaDevolucion.toISOString().split('T')[0]
          };
        }
        return detalle;
      });
      
      setDetalles(nuevosDetalles);
      
      // Recalcular fecha de vencimiento
      const nuevaFechaVencimiento = calcularFechaVencimiento(nuevosDetalles);
      if (nuevaFechaVencimiento) {
        setCurrentSolicitudEquipo(prev => ({
          ...prev,
          fecha_inicio: nuevaFechaInicio,
          fecha_vencimiento: nuevaFechaVencimiento
        }));
      }
    }
  };

  const calcularTotales = (
    detallesActuales: DetalleSolicitudEquipo[], 
    usaFacturaParam?: boolean,
    descuentoParam?: number,
    montoEnvioParam?: number,
    pagoEnvioParam?: boolean
  ) => {
    const subtotal = detallesActuales.reduce((sum, d) => sum + (d.subtotal_detalle || 0), 0);
    const usaFactura = usaFacturaParam !== undefined ? usaFacturaParam : currentSolicitudEquipo.usa_factura;
    const iva = usaFactura ? subtotal * 0.13 : 0;
    const descuento = descuentoParam !== undefined ? descuentoParam : (currentSolicitudEquipo.descuento_solicitud_equipo || 0);
    const pagoEnvio = pagoEnvioParam !== undefined ? pagoEnvioParam : currentSolicitudEquipo.pago_envio;
    const montoEnvio = montoEnvioParam !== undefined ? montoEnvioParam : (currentSolicitudEquipo.monto_envio || 0);
    const envio = pagoEnvio ? montoEnvio : 0;
    const total = subtotal + iva - descuento + envio;

    setCurrentSolicitudEquipo(prev => ({
      ...prev,
      usa_factura: usaFactura,
      subtotal_solicitud_equipo: subtotal,
      iva_solicitud_equipo: iva,
      total_solicitud_equipo: total
    }));
  };

  const agregarDetalle = () => {
    const nuevoDetalle: DetalleSolicitudEquipo = {
      id_equipo: 0,
      cantidad_equipo: 1,
      periodicidad: -1,
      cantidad_periodicidad: 1,
      iva_detalle: 0,
      subtotal_detalle: 0,
      monto_descuento: 0,
      monto_final: 0,
      fecha_devolucion: ''
    };
    const nuevosDetalles = [...detalles, nuevoDetalle];
    setDetalles(nuevosDetalles);
  };

  const eliminarDetalle = async (index: number) => {
    const detalleAEliminar = detalles[index];
    const detalleExtendido = detalleAEliminar as DetalleSolicitudEquipoExtended;
    
    // Si el detalle tiene id_detalle_solicitud_equipo, es una línea existente y debemos liberar el inventario
    if (detalleExtendido.id_detalle_solicitud_equipo && detalleAEliminar.id_equipo) {
      try {
        setIsLoading(true);
        
        // Liberar el inventario usando la API especializada
        const response = await fetch('/api/solicitud-equipo/liberar-inventario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_solicitud_equipo: currentSolicitudEquipo.id_solicitud_equipo
          })
        });
        
        const result = await response.json();
        if (!result.success) {
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al liberar el equipo: ' + (result.message || 'Error desconocido'),
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
          setIsLoading(false);
          return;
        }
        
        // Refrescar la lista de equipos después de liberar
        await fetchEquipos();
      } catch (error) {
        console.error('Error al liberar inventario:', error);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al liberar el equipo',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
    calcularTotales(nuevosDetalles);
    
    // Recalcular fecha de vencimiento después de eliminar un detalle
    const nuevaFechaVencimiento = calcularFechaVencimiento(nuevosDetalles);
    if (nuevaFechaVencimiento) {
      setCurrentSolicitudEquipo(prev => ({
        ...prev,
        fecha_vencimiento: nuevaFechaVencimiento
      }));
    } else {
      // Si no hay detalles con fecha de devolución, limpiar fecha de vencimiento
      setCurrentSolicitudEquipo(prev => ({
        ...prev,
        fecha_vencimiento: ''
      }));
    }
  };

  const recalcularTodosLosDetalles = (usaFactura: boolean) => {
    const nuevosDetalles = detalles.map(detalle => {
      let subtotal = 0;
      const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
      
      // Si el detalle ya tiene un subtotal calculado (viene de BD), usarlo
      if (detalle.subtotal_detalle && detalle.subtotal_detalle > 0) {
        subtotal = detalle.subtotal_detalle;
      } else {
        // Calcular desde cero solo si no hay subtotal
        let precioUnitario = 0;
        
        if (detalleExtendido.nombre_equipo) {
          const equipoConsolidado = equiposConsolidados.find(eq => eq.nombre_equipo === detalleExtendido.nombre_equipo);
          if (equipoConsolidado) {
            switch (detalle.periodicidad) {
              case 0:
                precioUnitario = equipoConsolidado.precio_dia || 0;
                break;
              case 1:
                precioUnitario = equipoConsolidado.precio_semana || 0;
                break;
              case 2:
                precioUnitario = equipoConsolidado.precio_quincena || 0;
                break;
              case 4:
                precioUnitario = equipoConsolidado.precio_mes || 0;
                break;
            }
          }
        }
        
        subtotal = (detalle.cantidad_equipo || 0) * (detalle.cantidad_periodicidad || 0) * precioUnitario;
      }
      
      const iva = usaFactura ? subtotal * 0.13 : 0;
      const descuento = detalle.monto_descuento || 0;
      const final = subtotal + iva - descuento;
      
      return {
        ...detalle,
        subtotal_detalle: subtotal,
        iva_detalle: iva,
        monto_final: final
      };
    });
    
    setDetalles(nuevosDetalles);
    calcularTotales(nuevosDetalles, usaFactura);
  };

  const actualizarDetalle = (index: number, campo: keyof DetalleSolicitudEquipo | 'nombre_equipo', valor: any) => {
    const nuevosDetalles = [...detalles];
    
    // Si se está cambiando el equipo, actualizar tanto nombre como validar cantidad disponible
    if (campo === 'nombre_equipo') {
      const equipoConsolidado = equiposConsolidados.find(eq => eq.nombre_equipo === valor);
      if (equipoConsolidado) {
        // Actualizar el detalle con información del equipo seleccionado
        const detalleExtendido = nuevosDetalles[index] as DetalleSolicitudEquipoExtended;
        detalleExtendido.nombre_equipo = valor;
        detalleExtendido.id_equipo = 0; // Se asignará al guardar
      }
    } else {
      nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
    }
    
    const detalle = nuevosDetalles[index];
    const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
    
    // Validar cantidad disponible si se está modificando la cantidad
    if (campo === 'cantidad_equipo' && detalleExtendido.nombre_equipo) {
      const equipoConsolidado = equiposConsolidados.find(eq => eq.nombre_equipo === detalleExtendido.nombre_equipo);
      if (equipoConsolidado) {
        const cantidadSolicitada = Number(valor) || 0;
        if (cantidadSolicitada > equipoConsolidado.cantidad_disponible) {
          setConfirmDialog({
            isOpen: true,
            title: 'Cantidad insuficiente',
            message: `Solo hay ${equipoConsolidado.cantidad_disponible} unidad(es) disponible(s) de ${equipoConsolidado.nombre_equipo}`,
            type: 'warning',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
          // Revertir a la cantidad máxima disponible
          nuevosDetalles[index].cantidad_equipo = equipoConsolidado.cantidad_disponible;
        }
      }
    }
    
    // Calcular fecha de devolución automáticamente
    if ((campo === 'periodicidad' || campo === 'cantidad_periodicidad') && currentSolicitudEquipo.fecha_inicio) {
      const fechaInicio = new Date(currentSolicitudEquipo.fecha_inicio + 'T00:00:00');
      const cantidadPeriodos = Number(detalle.cantidad_periodicidad) || 0;
      const periodicidad = Number(detalle.periodicidad);
      
      if (cantidadPeriodos > 0) {
        let fechaDevolucion = new Date(fechaInicio);
        
        switch (periodicidad) {
          case 0: // Día
            fechaDevolucion.setDate(fechaDevolucion.getDate() + (cantidadPeriodos * 1));
            break;
          case 1: // Semana
            fechaDevolucion.setDate(fechaDevolucion.getDate() + (cantidadPeriodos * 7));
            break;
          case 2: // Quincena
            fechaDevolucion.setDate(fechaDevolucion.getDate() + (cantidadPeriodos * 14));
            break;
          case 4: // Mes
            fechaDevolucion.setMonth(fechaDevolucion.getMonth() + cantidadPeriodos);
            break;
        }
        
        nuevosDetalles[index].fecha_devolucion = fechaDevolucion.toISOString().split('T')[0];
      }
    }
    
    // Calcular montos del detalle usando equipos consolidados
    let precioUnitario = 0;
    
    if (detalleExtendido.nombre_equipo) {
      const equipoConsolidado = equiposConsolidados.find(eq => eq.nombre_equipo === detalleExtendido.nombre_equipo);
      if (equipoConsolidado) {
        switch (detalle.periodicidad) {
          case 0: // Día
            precioUnitario = equipoConsolidado.precio_dia || 0;
            break;
          case 1: // Semana
            precioUnitario = equipoConsolidado.precio_semana || 0;
            break;
          case 2: // Quincena
            precioUnitario = equipoConsolidado.precio_quincena || 0;
            break;
          case 4: // Mes
            precioUnitario = equipoConsolidado.precio_mes || 0;
            break;
        }
      }
    }
    
    const subtotal = (detalle.cantidad_equipo || 0) * (detalle.cantidad_periodicidad || 0) * precioUnitario;
    const iva = currentSolicitudEquipo.usa_factura ? subtotal * 0.13 : 0;
    const descuento = detalle.monto_descuento || 0;
    const final = subtotal + iva - descuento;
    
    nuevosDetalles[index].subtotal_detalle = subtotal;
    nuevosDetalles[index].iva_detalle = iva;
    nuevosDetalles[index].monto_final = final;
    
    setDetalles(nuevosDetalles);
    calcularTotales(nuevosDetalles);
    
    // Recalcular fecha de vencimiento después de actualizar detalle
    const nuevaFechaVencimiento = calcularFechaVencimiento(nuevosDetalles);
    setCurrentSolicitudEquipo(prev => ({
      ...prev,
      fecha_vencimiento: nuevaFechaVencimiento
    }));
  };

  const procesarSolicitudUnica = async (detallesAProcesar: DetalleSolicitudEquipo[]) => {
    // Si estamos editando, solo actualizar el encabezado sin tocar detalles ni inventario
    if (isEditing) {
      try {
        const solicitudEquipoData = {
          ...currentSolicitudEquipo,
          provincia_solicitud_equipo: direccion.provincia,
          canton_solicitud_equipo: direccion.canton,
          distrito_solicitud_equipo: direccion.distrito,
          otras_senas_solicitud_equipo: direccion.otrasSenas
        };

        const response = await fetch(`/api/solicitud-equipo/${currentSolicitudEquipo.id_solicitud_equipo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(solicitudEquipoData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setIsLoading(false);
          setConfirmDialog({
            isOpen: true,
            title: 'Éxito',
            message: 'Solicitud actualizada exitosamente. Los equipos no fueron modificados.',
            type: 'info',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
              fetchSolicitudesEquipo();
              closeModal();
            }
          });
        } else {
          setIsLoading(false);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al actualizar la solicitud: ' + (result.error || 'Error desconocido'),
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        }
      } catch (error) {
        console.error('Error al actualizar solicitud:', error);
        setIsLoading(false);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al actualizar la solicitud. Por favor, intenta de nuevo.',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
      return;
    }

    // CREACIÓN DE NUEVA SOLICITUD: Validar disponibilidad de inventario consolidado y asignar equipos individuales
    const equiposInsuficientes: string[] = [];
    const detallesConEquiposAsignados: DetalleSolicitudEquipo[] = [];
    
    for (const detalle of detallesAProcesar) {
      const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
      
      if (detalleExtendido.nombre_equipo) {
        const equipoConsolidado = equiposConsolidados.find(eq => eq.nombre_equipo === detalleExtendido.nombre_equipo);
        
        if (!equipoConsolidado) {
          equiposInsuficientes.push(`${detalleExtendido.nombre_equipo}: equipo no encontrado`);
          continue;
        }
        
        const cantidadSolicitada = detalle.cantidad_equipo || 1;
        
        // Validar disponibilidad
        if (cantidadSolicitada > equipoConsolidado.cantidad_disponible) {
          equiposInsuficientes.push(
            `${detalleExtendido.nombre_equipo}: se solicitan ${cantidadSolicitada} unidad(es), pero solo hay ${equipoConsolidado.cantidad_disponible} disponible(s)`
          );
          continue;
        }
        
        // Asignar equipos individuales disponibles
        // Recorrer los equipos disponibles y asignar según sus cantidades
        let cantidadRestante = cantidadSolicitada;
        
        for (const equipoInfo of equipoConsolidado.equipos_con_cantidades) {
          if (cantidadRestante <= 0) break;
          
          // Si la cantidad del equipo es null o undefined, tratarla como 1
          const cantidadEquipo = equipoInfo.cantidad ?? 1;
          const cantidadTomar = Math.min(cantidadRestante, cantidadEquipo);
          
          detallesConEquiposAsignados.push({
            ...detalle,
            id_equipo: equipoInfo.id_equipo,
            cantidad_equipo: cantidadTomar
          });
          
          cantidadRestante -= cantidadTomar;
        }
      } else if (detalle.id_equipo) {
        // Línea existente que ya tiene id_equipo asignado
        detallesConEquiposAsignados.push(detalle);
      } else {
        // Detalle sin equipo asignado - esto es un error
        equiposInsuficientes.push(`Detalle sin equipo asignado en la línea ${detallesAProcesar.indexOf(detalle) + 1}`);
      }
    }

    if (equiposInsuficientes.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Inventario Insuficiente',
        message: `No hay suficientes equipos disponibles:\n\n${equiposInsuficientes.join('\n')}`,
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      setIsLoading(false);
      return;
    }

    // Validar que fecha_vencimiento sea mayor que fecha_elaboracion y fecha_inicio
    if (currentSolicitudEquipo.fecha_vencimiento && currentSolicitudEquipo.fecha_elaboracion) {
      const fechaVenc = new Date(currentSolicitudEquipo.fecha_vencimiento + 'T00:00:00');
      const fechaElab = new Date(currentSolicitudEquipo.fecha_elaboracion + 'T00:00:00');
      
      if (fechaVenc <= fechaElab) {
        setConfirmDialog({
          isOpen: true,
          title: 'Error de Validación',
          message: 'La fecha de vencimiento debe ser mayor que la fecha de elaboración.',
          type: 'warning',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
        setIsLoading(false);
        return;
      }
    }

    if (currentSolicitudEquipo.fecha_vencimiento && currentSolicitudEquipo.fecha_inicio) {
      const fechaVenc = new Date(currentSolicitudEquipo.fecha_vencimiento + 'T00:00:00');
      const fechaInicio = new Date(currentSolicitudEquipo.fecha_inicio + 'T00:00:00');
      
      if (fechaVenc <= fechaInicio) {
        setConfirmDialog({
          isOpen: true,
          title: 'Error de Validación',
          message: 'La fecha de vencimiento debe ser mayor que la fecha de inicio.',
          type: 'warning',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Calcular precio_total_equipos sumando precio_equipo de todos los equipos asignados
      let precioTotalEquipos = 0;
      for (const detalle of detallesConEquiposAsignados) {
        if (detalle.id_equipo) {
          const equipo = equipos.find(eq => eq.id_equipo === detalle.id_equipo);
          if (equipo && equipo.id_equipo_especifico && equipo.nombre_categoria) {
            const cat = equipo.nombre_categoria.toLowerCase();
            let endpoint = '';
            
            if (cat.includes('mezcladora')) endpoint = 'mezcladora';
            else if (cat.includes('andamio')) endpoint = 'andamio';
            else if (cat.includes('compactador')) endpoint = 'compactador';
            else if (cat.includes('rompedor')) endpoint = 'rompedor';
            else if (cat.includes('vibrador')) endpoint = 'vibrador';
            else if (cat.includes('puntal')) endpoint = 'puntal';
            
            if (endpoint) {
              try {
                const resp = await fetch(`/api/${endpoint}/${equipo.id_equipo_especifico}`);
                const data = await resp.json();
                if (data.success && data.data && data.data.precio_equipo) {
                  precioTotalEquipos += data.data.precio_equipo * (detalle.cantidad_equipo || 1);
                }
              } catch (error) {
                console.error(`Error obteniendo precio_equipo de ${endpoint}:`, error);
              }
            }
          }
        }
      }
      
      const solicitudEquipoData = {
        ...currentSolicitudEquipo,
        precio_total_equipos: precioTotalEquipos,
        provincia_solicitud_equipo: direccion.provincia,
        canton_solicitud_equipo: direccion.canton,
        distrito_solicitud_equipo: direccion.distrito,
        otras_senas_solicitud_equipo: direccion.otrasSenas
      };

      const url = isEditing ? `/api/solicitud-equipo/${currentSolicitudEquipo.id_solicitud_equipo}` : '/api/solicitud-equipo';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitudEquipoData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Si es edición, liberar inventario y eliminar detalles antiguos primero
        if (isEditing && currentSolicitudEquipo.numero_solicitud_equipo) {
          try {
            // Primero liberar el inventario reservado
            await fetch('/api/solicitud-equipo/liberar-inventario', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id_solicitud_equipo: currentSolicitudEquipo.id_solicitud_equipo
              })
            });

            // Luego eliminar detalles antiguos
            const detallesAntiguos = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${currentSolicitudEquipo.numero_solicitud_equipo}`);
            const resultDetalles = await detallesAntiguos.json();
            if (resultDetalles.success && Array.isArray(resultDetalles.data)) {
              for (const detalleAntiguo of resultDetalles.data) {
                await fetch(`/api/detalle-solicitud-equipo/${detalleAntiguo.id_detalle_solicitud_equipo}`, {
                  method: 'DELETE'
                });
              }
            }
          } catch (error) {
            console.error('Error al liberar inventario o eliminar detalles antiguos:', error);
          }
        }
        
        // Guardar detalles con equipos asignados
        console.log('Detalles con equipos asignados:', detallesConEquiposAsignados);
        
        for (const detalle of detallesConEquiposAsignados) {
          // Validar que el detalle tenga id_equipo antes de guardarlo
          if (!detalle.id_equipo) {
            console.error('Detalle sin id_equipo:', detalle);
            throw new Error(`Detalle sin id_equipo asignado. Asegúrese de que todos los equipos estén seleccionados correctamente.`);
          }
          
          const detalleData = {
            ...detalle,
            id_solicitud_equipo: isEditing ? currentSolicitudEquipo.id_solicitud_equipo : result.data.id_solicitud_equipo,
            numero_solicitud_equipo: isEditing ? currentSolicitudEquipo.numero_solicitud_equipo : result.data.numero_solicitud_equipo
          };
          await fetch('/api/detalle-solicitud-equipo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(detalleData),
          });
        }

        // Reservar inventario (tanto para nueva como para edición)
        try {
          const reservarResponse = await fetch('/api/solicitud-equipo/reservar-inventario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_solicitud_equipo: isEditing ? currentSolicitudEquipo.id_solicitud_equipo : result.data.id_solicitud_equipo
            })
          });
          
          const reservarResult = await reservarResponse.json();
          
          if (!reservarResponse.ok) {
            console.error('Error al reservar inventario:', reservarResult.error);
            setConfirmDialog({
              isOpen: true,
              title: 'Advertencia',
              message: `Solicitud guardada pero hubo un problema al reservar el inventario: ${reservarResult.error}`,
              type: 'warning',
              onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
            });
          }
        } catch (error) {
          console.error('Error al reservar inventario:', error);
        }

        // Mostrar mensaje de éxito
        setIsLoading(false);
        setConfirmDialog({
          isOpen: true,
          title: 'Éxito',
          message: isEditing ? 'Solicitud actualizada exitosamente.' : 'Solicitud creada exitosamente.',
          type: 'info',
          onConfirm: () => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            fetchSolicitudesEquipo();
            fetchEquipos(); // Refrescar inventario consolidado
            closeModal();
          }
        });
      } else {
        setIsLoading(false);
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error al guardar la solicitud de equipo: ' + (result.error || 'Error desconocido'),
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al guardar solicitud de equipo:', error);
      setIsLoading(false);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar la solicitud de equipo. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    }
  };

  const procesarSolicitudes = async (gruposPorFecha: Map<string, DetalleSolicitudEquipo[]>) => {
    // El loading ya está activado desde el onConfirm del diálogo
    const solicitudesCreadas: string[] = [];
    let hayErrores = false;

    try {
      let contador = 1;
      
      // Calcular monto total original para proporción de descuentos y envíos
      const montoTotalOriginal = detalles.reduce((sum, d) => sum + (d.subtotal_detalle || 0), 0);
      
      for (const [fechaDevolucion, detallesGrupo] of gruposPorFecha.entries()) {
        try {
          // Asignar equipos individuales para este grupo
          const equiposInsuficientes: string[] = [];
          const detallesConEquiposAsignados: DetalleSolicitudEquipo[] = [];
          
          for (const detalle of detallesGrupo) {
            const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
            
            if (detalleExtendido.nombre_equipo) {
              const equipoConsolidado = equiposConsolidados.find(eq => eq.nombre_equipo === detalleExtendido.nombre_equipo);
              
              if (!equipoConsolidado) {
                equiposInsuficientes.push(`${detalleExtendido.nombre_equipo}: equipo no encontrado`);
                continue;
              }
              
              const cantidadSolicitada = detalle.cantidad_equipo || 1;
              
              if (cantidadSolicitada > equipoConsolidado.cantidad_disponible) {
                equiposInsuficientes.push(
                  `${detalleExtendido.nombre_equipo}: se solicitan ${cantidadSolicitada} unidad(es), pero solo hay ${equipoConsolidado.cantidad_disponible} disponible(s)`
                );
                continue;
              }
              
              let cantidadRestante = cantidadSolicitada;
              
              for (const equipoInfo of equipoConsolidado.equipos_con_cantidades) {
                if (cantidadRestante <= 0) break;
                
                // Si la cantidad del equipo es null o undefined, tratarla como 1
                const cantidadEquipo = equipoInfo.cantidad ?? 1;
                const cantidadTomar = Math.min(cantidadRestante, cantidadEquipo);
                
                detallesConEquiposAsignados.push({
                  ...detalle,
                  id_equipo: equipoInfo.id_equipo,
                  cantidad_equipo: cantidadTomar
                });
                
                cantidadRestante -= cantidadTomar;
              }
            } else if (detalle.id_equipo) {
              detallesConEquiposAsignados.push(detalle);
            } else {
              equiposInsuficientes.push(`Detalle sin equipo asignado en la línea ${detallesGrupo.indexOf(detalle) + 1}`);
            }
          }
          
          if (equiposInsuficientes.length > 0) {
            hayErrores = true;
            console.error(`Error en equipos para fecha ${fechaDevolucion}:`, equiposInsuficientes.join(', '));
            continue;
          }
          
          // Generar número de solicitud único basado en el original
          const numeroBase = currentSolicitudEquipo.numero_solicitud_equipo || '';
          const numeroSolicitud = gruposPorFecha.size > 1 
            ? `${numeroBase}-${contador}` 
            : numeroBase;

          // Calcular subtotal para este grupo usando detalles con equipos asignados
          const subtotalGrupo = detallesConEquiposAsignados.reduce((sum, d) => sum + (d.subtotal_detalle || 0), 0);
          
          // Calcular proporción de este grupo respecto al total
          const proporcion = montoTotalOriginal > 0 ? subtotalGrupo / montoTotalOriginal : 0;
          
          // Calcular IVA si aplica
          const ivaGrupo = currentSolicitudEquipo.usa_factura ? subtotalGrupo * 0.13 : 0;
          
          // Calcular descuento proporcional
          const descuentoOriginal = currentSolicitudEquipo.descuento_solicitud_equipo || 0;
          const descuentoGrupo = descuentoOriginal * proporcion;
          
          // Calcular envío proporcional
          const montoEnvioOriginal = currentSolicitudEquipo.pago_envio ? (currentSolicitudEquipo.monto_envio || 0) : 0;
          const montoEnvioGrupo = montoEnvioOriginal * proporcion;
          
          // Calcular total
          const totalGrupo = subtotalGrupo + ivaGrupo - descuentoGrupo + montoEnvioGrupo;

          // Calcular precio total de equipos para este grupo usando detalles con equipos asignados
          let precioTotalEquipos = 0;
          for (const detalle of detallesConEquiposAsignados) {
            if (detalle.id_equipo) {
              const equipo = equipos.find(eq => eq.id_equipo === detalle.id_equipo);
              if (equipo && equipo.id_equipo_especifico && equipo.nombre_categoria) {
                const cat = equipo.nombre_categoria.toLowerCase();
                let endpoint = '';
                
                if (cat.includes('mezcladora')) endpoint = 'mezcladora';
                else if (cat.includes('andamio')) endpoint = 'andamio';
                else if (cat.includes('compactador')) endpoint = 'compactador';
                else if (cat.includes('rompedor')) endpoint = 'rompedor';
                else if (cat.includes('vibrador')) endpoint = 'vibrador';
                else if (cat.includes('puntal')) endpoint = 'puntal';
                
                if (endpoint) {
                  try {
                    const resp = await fetch(`/api/${endpoint}/${equipo.id_equipo_especifico}`);
                    const data = await resp.json();
                    if (data.success && data.data && data.data.precio_equipo) {
                      precioTotalEquipos += data.data.precio_equipo * (detalle.cantidad_equipo || 1);
                    }
                  } catch (error) {
                    console.error(`Error obteniendo precio_equipo de ${endpoint}:`, error);
                  }
                }
              }
            }
          }

          // Crear solicitud para este grupo con montos calculados
          const solicitudData = {
            ...currentSolicitudEquipo,
            numero_solicitud_equipo: numeroSolicitud,
            fecha_vencimiento: fechaDevolucion,
            precio_total_equipos: precioTotalEquipos,
            subtotal_solicitud_equipo: subtotalGrupo,
            iva_solicitud_equipo: ivaGrupo,
            descuento_solicitud_equipo: descuentoGrupo,
            monto_envio: montoEnvioGrupo,
            total_solicitud_equipo: totalGrupo,
            provincia_solicitud_equipo: direccion.provincia,
            canton_solicitud_equipo: direccion.canton,
            distrito_solicitud_equipo: direccion.distrito,
            otras_senas_solicitud_equipo: direccion.otrasSenas
          };

          const response = await fetch('/api/solicitud-equipo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(solicitudData),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Guardar detalles con equipos asignados para esta solicitud
            for (const detalle of detallesConEquiposAsignados) {
              if (!detalle.id_equipo) {
                console.error('Detalle sin id_equipo:', detalle);
                continue;
              }
              
              const detalleData = {
                ...detalle,
                id_solicitud_equipo: result.data.id_solicitud_equipo,
                numero_solicitud_equipo: result.data.numero_solicitud_equipo
              };
              await fetch('/api/detalle-solicitud-equipo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detalleData),
              });
            }

            // Reservar inventario
            try {
              await fetch('/api/solicitud-equipo/reservar-inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_solicitud_equipo: result.data.id_solicitud_equipo
                })
              });
            } catch (error) {
              console.error('Error al reservar inventario:', error);
            }

            solicitudesCreadas.push(numeroSolicitud);
          } else {
            hayErrores = true;
            console.error(`Error al crear solicitud ${numeroSolicitud}:`, result.error);
          }

          contador++;
        } catch (error) {
          hayErrores = true;
          console.error(`Error procesando grupo para fecha ${fechaDevolucion}:`, error);
        }
      }

      // Mostrar resultado
      if (solicitudesCreadas.length > 0) {
        const mensaje = hayErrores
          ? `Se crearon ${solicitudesCreadas.length} de ${gruposPorFecha.size} solicitudes:\n\n${solicitudesCreadas.join(', ')}\n\nAlgunas solicitudes no pudieron ser creadas.`
          : `Se crearon ${solicitudesCreadas.length} solicitudes exitosamente:\n\n${solicitudesCreadas.join(', ')}`;

        setConfirmDialog({
          isOpen: true,
          title: hayErrores ? 'Proceso Completado con Errores' : 'Éxito',
          message: mensaje,
          type: hayErrores ? 'warning' : 'info',
          onConfirm: () => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            fetchSolicitudesEquipo();
            closeModal();
          }
        });
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'No se pudo crear ninguna solicitud. Por favor, intenta de nuevo.',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error en procesarSolicitudes:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al procesar las solicitudes. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSolicitudEquipo.numero_solicitud_equipo || !currentSolicitudEquipo.id_cliente) {
      setConfirmDialog({
        isOpen: true,
        title: 'Advertencia',
        message: 'Debe completar el número de solicitud de equipo y seleccionar un cliente.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    // Si estamos editando, solo actualizar el encabezado
    if (isEditing) {
      setIsLoading(true);
      procesarSolicitudUnica([]); // Pasar array vacío ya que no se procesarán detalles
      return;
    }

    // Validaciones solo para creación de nueva solicitud
    if (detalles.length === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Advertencia',
        message: 'Debe agregar al menos un equipo a la solicitud de equipo.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    // Validar que todos los detalles tengan fecha de devolución
    const detallesSinFecha = detalles.filter(d => !d.fecha_devolucion || d.fecha_devolucion === '');
    if (detallesSinFecha.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Advertencia',
        message: 'Todos los equipos deben tener una fecha de devolución definida.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    // Agrupar detalles por fecha de devolución
    const gruposPorFecha = new Map<string, DetalleSolicitudEquipo[]>();
    detalles.forEach(detalle => {
      const fecha = detalle.fecha_devolucion!;
      if (!gruposPorFecha.has(fecha)) {
        gruposPorFecha.set(fecha, []);
      }
      gruposPorFecha.get(fecha)!.push(detalle);
    });

    // Si hay múltiples fechas, advertir al usuario que se crearán múltiples contratos
    if (gruposPorFecha.size > 1) {
      const fechasStr = Array.from(gruposPorFecha.keys())
        .map(fecha => {
          const cantidad = gruposPorFecha.get(fecha)!.length;
          return `• ${fecha} (${cantidad} equipo${cantidad > 1 ? 's' : ''})`;
        })
        .join('\n');

      setConfirmDialog({
        isOpen: true,
        title: 'Múltiples Fechas de Devolución',
        message: `Los equipos tienen diferentes fechas de devolución:\n\n${fechasStr}\n\nSe crearán ${gruposPorFecha.size} solicitudes separadas (una por cada fecha). ¿Desea continuar?`,
        type: 'warning',
        onConfirm: async () => {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          setIsLoading(true);
          procesarSolicitudes(gruposPorFecha);
        },
        onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    // Si solo hay una fecha, procesar normalmente
    if (gruposPorFecha.size === 1) {
      setIsLoading(true);
      procesarSolicitudUnica(Array.from(gruposPorFecha.values())[0]);
      return;
    }
  };

  const handleView = async (solicitudEquipo: EncabezadoSolicitudEquipo) => {
    const solicitudEquipoConValores = {
      ...solicitudEquipo,
      pago_envio: solicitudEquipo.pago_envio ?? false,
      monto_envio: solicitudEquipo.monto_envio ?? 0,
      descuento_solicitud_equipo: solicitudEquipo.descuento_solicitud_equipo ?? 0,
      usa_factura: solicitudEquipo.usa_factura ?? false
    };
    
    setCurrentSolicitudEquipo(solicitudEquipoConValores);
    setClienteSearchTerm(getClienteNombre(solicitudEquipo.id_cliente || 0));
    setDireccion({
      provincia: solicitudEquipo.provincia_solicitud_equipo || '',
      canton: solicitudEquipo.canton_solicitud_equipo || '',
      distrito: solicitudEquipo.distrito_solicitud_equipo || '',
      otrasSenas: solicitudEquipo.otras_senas_solicitud_equipo || ''
    });

    // Cargar detalles de la solicitud de equipo
    if (solicitudEquipo.numero_solicitud_equipo) {
      try {
        const response = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${solicitudEquipo.numero_solicitud_equipo}`);
        const result = await response.json();
        setDetalles(Array.isArray(result.data) ? result.data : []);
        
        // Cargar órdenes de recolección para esta SE
        const ordenesResponse = await fetch(`/api/orden-recoleccion?numero_solicitud_equipo=${solicitudEquipo.numero_solicitud_equipo}`);
        const ordenesResult = await ordenesResponse.json();
        if (ordenesResult.success && Array.isArray(ordenesResult.data)) {
          // Extraer los IDs de detalle que tienen órdenes de recolección
          const idsConOrden = ordenesResult.data.map((o: any) => o.id_detalle_solicitud_equipo);
          setOrdenesRecoleccion(idsConOrden);
        } else {
          setOrdenesRecoleccion([]);
        }
      } catch (error) {
        console.error('Error al cargar detalles:', error);
        setDetalles([]);
        setOrdenesRecoleccion([]);
      }
    }

    setIsViewing(true);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = async (solicitudEquipo: EncabezadoSolicitudEquipo) => {
    // Asegurar que los campos de envío y descuento tengan valores iniciales
    const solicitudEquipoConValores = {
      ...solicitudEquipo,
      pago_envio: solicitudEquipo.pago_envio ?? false,
      monto_envio: solicitudEquipo.monto_envio ?? 0,
      descuento_solicitud_equipo: solicitudEquipo.descuento_solicitud_equipo ?? 0,
      usa_factura: solicitudEquipo.usa_factura ?? false
    };
    
    setClienteSearchTerm(getClienteNombre(solicitudEquipo.id_cliente || 0));
    setDireccion({
      provincia: solicitudEquipo.provincia_solicitud_equipo || '',
      canton: solicitudEquipo.canton_solicitud_equipo || '',
      distrito: solicitudEquipo.distrito_solicitud_equipo || '',
      otrasSenas: solicitudEquipo.otras_senas_solicitud_equipo || ''
    });

    // Cargar detalles de la solicitud de equipo
    if (solicitudEquipo.numero_solicitud_equipo) {
      try {
        const response = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${solicitudEquipo.numero_solicitud_equipo}`);
        const result = await response.json();
        const detallesCargados = Array.isArray(result.data) ? result.data : [];
        setDetalles(detallesCargados);
        
        // Primero establecer los valores base de la SE
        setCurrentSolicitudEquipo(solicitudEquipoConValores);
        
        // Recalcular totales con los detalles cargados (esto actualizará subtotal, iva y total)
        if (detallesCargados.length > 0) {
          calcularTotales(
            detallesCargados, 
            solicitudEquipoConValores.usa_factura,
            solicitudEquipoConValores.descuento_solicitud_equipo,
            solicitudEquipoConValores.monto_envio,
            solicitudEquipoConValores.pago_envio
          );
        }
        
        // Cargar órdenes de recolección para esta SE
        const ordenesResponse = await fetch(`/api/orden-recoleccion?numero_solicitud_equipo=${solicitudEquipo.numero_solicitud_equipo}`);
        const ordenesResult = await ordenesResponse.json();
        if (ordenesResult.success && Array.isArray(ordenesResult.data)) {
          // Extraer los IDs de detalle que tienen órdenes de recolección
          const idsConOrden = ordenesResult.data.map((o: any) => o.id_detalle_solicitud_equipo);
          setOrdenesRecoleccion(idsConOrden);
        } else {
          setOrdenesRecoleccion([]);
        }
      } catch (error) {
        console.error('Error al cargar detalles:', error);
        setDetalles([]);
        setOrdenesRecoleccion([]);
      }
    }

    setIsViewing(false);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleAnular = async (solicitud: EncabezadoSolicitudEquipo) => {
    // Verificar si la solicitud tiene un contrato generado
    if (solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.CONTRATO_GENERADO) {
      setConfirmDialog({
        isOpen: true,
        title: 'No se puede anular',
        message: 'No se puede anular una solicitud que tiene un contrato generado. Por favor, anule el contrato primero.',
        type: 'danger',
        onConfirm: () => {
          // Solo cerrar el diálogo
        }
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: '¿Anular solicitud de equipo?',
      message: '¿Estás seguro de que deseas anular esta solicitud de equipo? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/solicitud-equipo/${solicitud.id_solicitud_equipo}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...solicitud,
              estado_solicitud_equipo: EstadoSolicitudEquipo.ANULADO
            }),
          });
          if (response.ok) {
            fetchSolicitudesEquipo();
          }
        } catch (error) {
          console.error('Error al anular solicitud de equipo:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleGenerarContrato = async (solicitud: EncabezadoSolicitudEquipo) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Generar contrato?',
      message: '¿Estás seguro de que deseas generar el contrato para esta solicitud? Se actualizará el inventario y el estado de la solicitud.',
      type: 'info',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/contrato/generar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id_solicitud_equipo: solicitud.id_solicitud_equipo
            }),
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            setConfirmDialog({
              isOpen: true,
              title: 'Éxito',
              message: `Contrato generado exitosamente. Se procesaron ${result.data.equipos_procesados} equipos.`,
              type: 'info',
              onConfirm: () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                fetchSolicitudesEquipo();
              }
            });
          } else {
            setConfirmDialog({
              isOpen: true,
              title: 'Error',
              message: result.error || 'Error al generar el contrato',
              type: 'danger',
              onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
            });
          }
        } catch (error) {
          console.error('Error al generar contrato:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: 'Error al generar el contrato. Por favor, intenta de nuevo.',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleVerPDF = async (solicitud: EncabezadoSolicitudEquipo) => {
    if (!solicitud.id_solicitud_equipo) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contrato/pdf?id_solicitud_equipo=${solicitud.id_solicitud_equipo}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'No se pudo cargar el PDF del contrato',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al cargar PDF:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al cargar el PDF. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprimirSolicitudPDF = async (solicitud: EncabezadoSolicitudEquipo) => {
    if (!solicitud.id_solicitud_equipo) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/solicitud-equipo/pdf?id_solicitud_equipo=${solicitud.id_solicitud_equipo}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        setConfirmDialog({
          isOpen: true,
          title: 'Error',
          message: 'No se pudo cargar el PDF de la solicitud',
          type: 'danger',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
      }
    } catch (error) {
      console.error('Error al cargar PDF de solicitud:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al cargar el PDF. Por favor, intenta de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    const nuevoNumero = generarNumeroSolicitudEquipo();
    setCurrentSolicitudEquipo({
      numero_solicitud_equipo: nuevoNumero,
      id_cliente: 0,
      fecha_elaboracion: new Date().toISOString().split('T')[0],
      fecha_inicio: '',
      fecha_vencimiento: '',
      nombre_recibe: '',
      cedula_recibe: '',
      telefono_recibe: '',
      precio_total_equipos: 0,
      observaciones_solicitud_equipo: '',
      pago_envio: false,
      monto_envio: 0,
      usa_factura: false,
      subtotal_solicitud_equipo: 0,
      descuento_solicitud_equipo: 0,
      total_solicitud_equipo: 0,
      iva_solicitud_equipo: 0,
      estado_solicitud_equipo: EstadoSolicitudEquipo.SOLICITUD,
    });
    setDetalles([]);
    setDireccion({
      provincia: '',
      canton: '',
      distrito: '',
      otrasSenas: ''
    });
    setClienteSearchTerm('');
    setShowClienteDropdown(false);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSolicitudEquipo({
      numero_solicitud_equipo: '',
      id_cliente: 0,
      fecha_elaboracion: '',
      fecha_inicio: '',
      fecha_vencimiento: '',
      nombre_recibe: '',
      cedula_recibe: '',
      telefono_recibe: '',
      precio_total_equipos: 0,
      observaciones_solicitud_equipo: '',
      pago_envio: false,
      monto_envio: 0,
      usa_factura: false,
      subtotal_solicitud_equipo: 0,
      descuento_solicitud_equipo: 0,
      total_solicitud_equipo: 0,
      iva_solicitud_equipo: 0,
      estado_solicitud_equipo: EstadoSolicitudEquipo.SOLICITUD,
    });
    setDetalles([]);
    setDireccion({
      provincia: '',
      canton: '',
      distrito: '',
      otrasSenas: ''
    });
    setIsViewing(false);
    setIsEditing(false);
  };

  const filteredSolicitudesEquipo = solicitudesEquipo.filter(solicitudEquipo => {
    const clienteNombre = getClienteNombre(solicitudEquipo.id_cliente || 0).toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (solicitudEquipo.numero_solicitud_equipo?.toLowerCase() || '').includes(search) ||
      clienteNombre.includes(search) ||
      (solicitudEquipo.nombre_recibe?.toLowerCase() || '').includes(search)
    );
    
    const matchesEstado = 
      estadoFiltro === 'todos' ? true :
      solicitudEquipo.estado_solicitud_equipo === estadoFiltro;
    
    return matchesSearch && matchesEstado;
  }).sort((a, b) => {
    const numA = a.numero_solicitud_equipo || '';
    const numB = b.numero_solicitud_equipo || '';
    return numB.localeCompare(numA);
  });

  const columns: Column<EncabezadoSolicitudEquipo>[] = [
    { key: 'numero_solicitud_equipo', header: 'Número Solicitud', width: '150px' },
    { 
      key: 'fecha_vencimiento', 
      header: 'Fecha Vencimiento', 
      width: '200px',
      render: (c) => {
        if (!c.fecha_vencimiento) return '-';
        
        const fechaVencimiento = new Date(c.fecha_vencimiento + 'T00:00:00');
        const solicitudExtendida = c as EncabezadoSolicitudEquipo & { estadoVencimiento?: 'vencido' | 'porVencer' | 'normal' };
        
        let className = '';
        // Solo aplicar colores si el estado NO es FINALIZADO
        if (c.estado_solicitud_equipo !== EstadoSolicitudEquipo.FINALIZADO) {
          if (solicitudExtendida.estadoVencimiento === 'vencido') {
            className = styles.fechaVencida;
          } else if (solicitudExtendida.estadoVencimiento === 'porVencer') {
            className = styles.fechaPorVencer;
          }
        }
        
        return (
          <span className={className}>
            {fechaVencimiento.toLocaleDateString('es-CR')}
          </span>
        );
      }
    },
    { 
      key: 'id_cliente', 
      header: 'Nombre del Cliente', width: '320px',
      render: (c) => getClienteNombre(c.id_cliente || 0)
    },
    { 
      key: 'telefono_cliente', 
      header: 'Teléfono Cliente', width: '140px',
      filterable: false,
      sortable: false,
      render: (c) => getClienteTelefono(c.id_cliente || 0)
    },
    { 
      key: 'total_solicitud_equipo', 
      header: 'Total',
      width: '150px',
      render: (c) => `₡${(c.total_solicitud_equipo || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'estado_solicitud_equipo', 
      header: 'Estado',
      width: '200px',
      render: (c) => {
        const estado = c.estado_solicitud_equipo || EstadoSolicitudEquipo.SOLICITUD;
        const label = EstadoSolicitudEquipoLabels[estado as EstadoSolicitudEquipo] || 'Desconocido';
        
        let className = '';
        if (estado === EstadoSolicitudEquipo.CANCELADO || estado === EstadoSolicitudEquipo.ANULADO) {
          className = styles.statusInactive; // Gris para cancelado/anulado
        } else if (estado === EstadoSolicitudEquipo.FINALIZADO) {
          className = styles.statusFinalizado; // Verde oscuro para finalizado
        } else if (estado === EstadoSolicitudEquipo.CONTRATO_GENERADO) {
          className = styles.statusContrato; // Azul para contrato generado
        } else if (estado === EstadoSolicitudEquipo.EN_RUTA_ENTREGA) {
          className = styles.statusSuccess; // Verde claro para entrega
        } else if (estado === EstadoSolicitudEquipo.EN_RUTA_RECOLECCION) {
          className = styles.statusActive; // Rojo/Naranja para recolección
        } else if (estado === EstadoSolicitudEquipo.SOLICITUD) {
          className = styles.statusSolicitud; // Naranja para solicitud
        } else if (estado === EstadoSolicitudEquipo.EXTENDIDO) {
          className = styles.statusExtendido; // Color especial para extendido
        }
        
        return <span className={className}>{label}</span>;
      }
    }
  ];

  const actions: TableAction<EncabezadoSolicitudEquipo>[] = [
    {
      label: '👁️',
      onClick: handleView,
      className: styles.btnView,
      tooltip: 'Ver detalles de la solicitud',
      condition: (solicitud) => solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.SOLICITUD
    },
    {
      label: '✏️',
      onClick: handleEdit,
      className: styles.btnEdit,
      tooltip: 'Editar solicitud',
      condition: (solicitud) => 
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.ANULADO &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.CONTRATO_GENERADO &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EN_RUTA_ENTREGA &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EN_RUTA_RECOLECCION &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.DONDE_CLIENTE &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.FINALIZADO &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EXTENDIDO
    },
    {
      label: '🖨️',
      onClick: handleImprimirSolicitudPDF,
      className: styles.btnPrintDoc,
      tooltip: 'Imprimir solicitud PDF'
    },
    {
      label: '📄',
      onClick: handleVerPDF,
      className: styles.btnVerPDF,
      tooltip: 'Ver contrato PDF',
      condition: (solicitud) => 
        solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.CONTRATO_GENERADO ||
        solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.DONDE_CLIENTE ||
        solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.FINALIZADO ||
        solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.EN_RUTA_ENTREGA ||
        solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.EN_RUTA_RECOLECCION
    },
    {
      label: '📝',
      onClick: handleGenerarContrato,
      className: styles.btnContrato,
      tooltip: 'Generar contrato',
      condition: (solicitud) => solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.SOLICITUD
    },
    {
      label: '📦',
      onClick: handleRecogerTodos,
      className: styles.btnRecoger,
      tooltip: 'Recoger todos los equipos',
      condition: (solicitud) => 
        solicitud.estado_solicitud_equipo === EstadoSolicitudEquipo.EN_RUTA_RECOLECCION ||
        (solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.SOLICITUD &&
         solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.CONTRATO_GENERADO &&
         solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EN_RUTA_ENTREGA &&
         solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.ANULADO &&
         solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.FINALIZADO &&
         solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EXTENDIDO)
    },
    {
      label: '🚫',
      onClick: handleAnular,
      className: styles.btnAnular,
      tooltip: 'Anular solicitud',
      condition: (solicitud) => 
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.ANULADO &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.FINALIZADO &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EN_RUTA_ENTREGA &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EN_RUTA_RECOLECCION &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.DONDE_CLIENTE &&
        solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.EXTENDIDO
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Solicitudes de Equipo</h1>
          <button className={styles.btnAdd} onClick={openModal}>
            + Nueva Solicitud de Equipo
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar solicitudes de equipo..."
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
            {Object.entries(EstadoSolicitudEquipoLabels).map(([value, label]: [string, string]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredSolicitudesEquipo}
          actions={actions}
          keyExtractor={(c) => c.id_solicitud_equipo!}
          noDataMessage="No se encontraron solicitudes de equipo"
        />

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isViewing ? 'Ver Solicitud de Equipo' : (isEditing ? 'Editar Solicitud de Equipo' : 'Nueva Solicitud de Equipo')}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                  <h3>Datos de la Solicitud</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Número de Solicitud *</label>
                      <input
                        type="text"
                        value={currentSolicitudEquipo.numero_solicitud_equipo}
                        readOnly
                        required
                        style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cliente *</label>
                      <div style={{ position: 'relative' }} ref={clienteDropdownRef}>
                        <input
                          type="text"
                          value={clienteSearchTerm}
                          onChange={(e) => {
                            setClienteSearchTerm(e.target.value);
                            setShowClienteDropdown(true);
                          }}
                          onClick={() => {
                            if (currentSolicitudEquipo.id_cliente !== 0) {
                              setClienteSearchTerm('');
                              setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, id_cliente: 0 });
                            }
                            setShowClienteDropdown(true);
                          }}
                          onFocus={() => setShowClienteDropdown(true)}
                          placeholder="Buscar cliente..."
                          required={currentSolicitudEquipo.id_cliente === 0}
                          readOnly={currentSolicitudEquipo.id_cliente !== 0 || isViewing}
                          disabled={isViewing}
                          style={{ cursor: isViewing ? 'not-allowed' : 'pointer', background: isViewing ? '#f0f0f0' : undefined }}
                        />
                        {showClienteDropdown && filteredClientes.length > 0 && (
                          <div className={styles.dropdown}>
                            {filteredClientes.map(c => (
                              <div
                                key={c.id_cliente}
                                className={styles.dropdownItem}
                                onClick={() => handleSelectCliente(c)}
                              >
                                {c.nombre_cliente} {c.apellidos_cliente}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Fecha Elaboración *</label>
                      <input
                        type="date"
                        value={currentSolicitudEquipo.fecha_elaboracion}
                        onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, fecha_elaboracion: e.target.value })}
                        disabled={isViewing}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Fecha Inicio *</label>
                      <input
                        type="date"
                        value={currentSolicitudEquipo.fecha_inicio}
                        onChange={(e) => handleFechaInicioChange(e.target.value)}
                        disabled={isViewing}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Fecha Vencimiento *</label>
                        <input
                        type="date"
                        value={currentSolicitudEquipo.fecha_vencimiento}
                        onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, fecha_vencimiento: e.target.value })}
                        disabled={true}
                        required
                        title="Esta fecha se calcula automáticamente como la fecha mayor de las fechas de devolución de los equipos"
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                      <small style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        (calculada automáticamente)
                      </small>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Datos de Quien Recibe</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={currentSolicitudEquipo.nombre_recibe}
                        onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, nombre_recibe: e.target.value })}
                        disabled={isViewing}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cédula *</label>
                      <input
                        type="text"
                        value={currentSolicitudEquipo.cedula_recibe}
                        onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, cedula_recibe: e.target.value })}
                        disabled={isViewing}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Teléfono *</label>
                      <input
                        type="text"
                        value={currentSolicitudEquipo.telefono_recibe}
                        onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, telefono_recibe: e.target.value })}
                        disabled={isViewing}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Dirección de Entrega</h3>
                  <SelectorDireccion
                    onChange={setDireccion}
                    value={direccion}
                    disabled={isViewing}
                    required={true}
                  />
                </div>

                <div className={styles.section}>
                  <h3>Opciones de Solicitud</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Estado de la Solicitud *</label>
                      <select
                        value={currentSolicitudEquipo.estado_solicitud_equipo}
                        onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, estado_solicitud_equipo: Number(e.target.value) })}
                        disabled={true}
                        required
                        className={
                          currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.SOLICITUD ? styles.statusSolicitud :
                          currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.CONTRATO_GENERADO ? styles.statusContrato :
                          currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.EN_RUTA_ENTREGA ? styles.statusSuccess :
                          currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.EN_RUTA_RECOLECCION ? styles.statusActive :
                          currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.FINALIZADO ? styles.statusFinalizado :
                          (currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.CANCELADO || 
                           currentSolicitudEquipo.estado_solicitud_equipo === EstadoSolicitudEquipo.ANULADO) ? styles.statusInactive :
                          ''
                        }
                      >
                        <option value={currentSolicitudEquipo.estado_solicitud_equipo}>
                          {EstadoSolicitudEquipoLabels[currentSolicitudEquipo.estado_solicitud_equipo as EstadoSolicitudEquipo]}
                        </option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Pago de Envío</label>
                      <div className={styles.toggleContainer}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={currentSolicitudEquipo.pago_envio}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const subtotal = currentSolicitudEquipo.subtotal_solicitud_equipo || 0;
                              const iva = currentSolicitudEquipo.usa_factura ? (currentSolicitudEquipo.iva_solicitud_equipo || 0) : 0;
                              const descuento = currentSolicitudEquipo.descuento_solicitud_equipo || 0;
                              const envio = checked ? (currentSolicitudEquipo.monto_envio || 0) : 0;
                              setCurrentSolicitudEquipo({
                                ...currentSolicitudEquipo,
                                pago_envio: checked,
                                total_solicitud_equipo: subtotal + iva - descuento + envio
                              });
                            }}
                            disabled={isViewing}
                            className={styles.togglePagoEnvio}
                          />
                        </label>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Usa Factura Electrónica</label>
                      <div className={styles.toggleContainer}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={currentSolicitudEquipo.usa_factura}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              // Recalcular todos los detalles con el nuevo estado de factura
                              recalcularTodosLosDetalles(checked);
                            }}
                            disabled={isViewing}
                            className={styles.toggleFactura}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Equipos</h3>
                  {!isViewing && !isEditing && (
                    <button type="button" className={styles.btnAddDetalle} onClick={agregarDetalle}>
                      + Agregar Equipo
                    </button>
                  )}
                  {isEditing && (
                    <p className={styles.infoMessage} style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                      ℹ️ Los equipos no pueden ser modificados al editar una solicitud
                    </p>
                  )}
                  
                  {detalles.length > 0 && (
                    <div className={styles.detalleHeader}>
                      <span>Equipo</span>
                      <span>Cantidad Equipos</span>
                      <span>Periodicidad</span>
                      <span>Cant. Períodos</span>
                      <span>F. Devolución</span>
                      <span>Monto</span>
                      <span></span>
                    </div>
                  )}
                  
                  <div className={styles.detallesContainer}>
                    {detalles.map((detalle, index) => {
                      const detalleExtendido = detalle as DetalleSolicitudEquipoExtended;
                      
                      // Obtener cantidad máxima disponible para este equipo
                      const equipoConsolidado = detalleExtendido.nombre_equipo 
                        ? equiposConsolidados.find(eq => eq.nombre_equipo === detalleExtendido.nombre_equipo)
                        : null;
                      const maxCantidad = equipoConsolidado?.cantidad_disponible || 9999;
                      
                      // Determinar el estado de la fecha de devolución
                      const estadoFecha = obtenerEstadoFechaDevolucion(detalle.fecha_devolucion || '');
                      const claseEstado = currentSolicitudEquipo.estado_solicitud_equipo !== EstadoSolicitudEquipo.FINALIZADO
                        ? (estadoFecha === 'vencida' ? styles.detalleRowVencida : 
                           estadoFecha === 'proxima' ? styles.detalleRowProxima : '')
                        : '';
                      
                      // Determinar si es una línea existente (tiene id_detalle_solicitud_equipo)
                      const esLineaExistente = isEditing && !!detalleExtendido.id_detalle_solicitud_equipo;
                      // En modo edición, TODOS los detalles son de solo lectura
                      const camposDeshabilitados = isViewing || isEditing;
                      
                      return (
                      <div key={index} className={`${styles.detalleRow} ${claseEstado}`}>
                        {camposDeshabilitados ? (
                          <div className={styles.selectEquipo}>
                            {detalleExtendido.nombre_equipo || 'Equipo no encontrado'}
                          </div>
                        ) : (
                          <SearchableSelect
                            value={detalleExtendido.nombre_equipo || ''}
                            onChange={(value) => actualizarDetalle(index, 'nombre_equipo', value)}
                            options={equiposConsolidados
                              .filter(eq => eq.cantidad_disponible > 0)
                              .map(eq => ({
                                value: eq.nombre_equipo,
                                label: `${eq.nombre_equipo} (${eq.cantidad_disponible} disponible${eq.cantidad_disponible !== 1 ? 's' : ''})`
                              }))}
                            placeholder="Seleccione equipo"
                            disabled={camposDeshabilitados}
                            className={styles.selectEquipo}
                          />
                        )}
                        
                        <input
                          type="number"
                          placeholder="Cantidad"
                          min="1"
                          max={maxCantidad}
                          value={detalle.cantidad_equipo || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                              const numVal = Number(val);
                              // Validar que no exceda el máximo disponible
                              if (numVal > maxCantidad) {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Cantidad no válida',
                                  message: `La cantidad máxima disponible de ${detalleExtendido.nombre_equipo} es ${maxCantidad}`,
                                  type: 'warning',
                                  onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
                                });
                                actualizarDetalle(index, 'cantidad_equipo', maxCantidad);
                              } else {
                                actualizarDetalle(index, 'cantidad_equipo', val === '' ? undefined : numVal);
                              }
                            }
                          }}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          disabled={camposDeshabilitados}
                          className={styles.inputSmall}
                        />
                        
                        <select
                          value={detalle.periodicidad}
                          onChange={(e) => actualizarDetalle(index, 'periodicidad', Number(e.target.value))}
                          disabled={camposDeshabilitados}
                          className={styles.inputSmall}
                        >
                          <option value="-1" disabled>Seleccionar periodicidad</option>
                          <option value="0">Día</option>
                          <option value="1">Semana</option>
                          <option value="2">Quincena</option>
                          <option value="4">Mes</option>
                        </select>
                        
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant."
                          value={detalle.cantidad_periodicidad}
                          onChange={(e) => actualizarDetalle(index, 'cantidad_periodicidad', Number(e.target.value))}
                          disabled={camposDeshabilitados}
                          className={styles.inputSmall}
                        />
                        
                        <input
                          type="date"
                          placeholder="F. Devolución"
                          value={detalle.fecha_devolucion}
                          onChange={(e) => actualizarDetalle(index, 'fecha_devolucion', e.target.value)}
                          disabled={camposDeshabilitados}
                          className={styles.inputMedium}
                        />
                        
                        <span className={styles.montoFinal}>
                          ₡{(detalle.monto_final || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                        </span>
                        
                        {/* Mostrar botón de eliminar cuando NO está en modo vista NI modo edición */}
                        {!isViewing && !isEditing &&
                         !((estadoFecha === 'vencida' || estadoFecha === 'proxima') && 
                           (currentSolicitudEquipo.estado_solicitud_equipo ?? 0) >= EstadoSolicitudEquipo.CONTRATO_GENERADO) && (
                          <button 
                            type="button" 
                            onClick={() => eliminarDetalle(index)}
                            className={styles.btnDeleteDetalle}
                          >
                            ×
                          </button>
                        )}
                        
                        {/* Espacio vacío en modo vista o edición */}
                        {(isViewing || isEditing) && 
                         !((estadoFecha === 'vencida' || estadoFecha === 'proxima') && 
                           (currentSolicitudEquipo.estado_solicitud_equipo ?? 0) >= EstadoSolicitudEquipo.CONTRATO_GENERADO) && 
                         <span></span>}
                      </div>
                    )})}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Totales</h3>
                  <div className={styles.totalesContainer}>
                    <div className={styles.totalRow}>
                      <span>Subtotal:</span>
                      <span>₡{(currentSolicitudEquipo.subtotal_solicitud_equipo || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {currentSolicitudEquipo.usa_factura && (
                      <div className={styles.totalRow}>
                        <span>IVA (13%):</span>
                        <span>₡{(currentSolicitudEquipo.iva_solicitud_equipo || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {currentSolicitudEquipo.pago_envio && (
                      <div className={styles.totalRow}>
                        <label>Envío:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>₡</span>
                          <input
                            type="number"
                            min="0"
                            value={currentSolicitudEquipo.monto_envio || ''}
                            onChange={(e) => {
                              const envio = Number(e.target.value) || 0;
                              const subtotal = currentSolicitudEquipo.subtotal_solicitud_equipo || 0;
                              const iva = currentSolicitudEquipo.iva_solicitud_equipo || 0;
                              const descuento = currentSolicitudEquipo.descuento_solicitud_equipo || 0;
                              setCurrentSolicitudEquipo(prev => ({
                                ...prev,
                                monto_envio: e.target.value === '' ? 0 : Number(e.target.value),
                                total_solicitud_equipo: subtotal + iva - descuento + envio
                              }));
                            }}
                            disabled={isViewing}
                            className={styles.inputDescuento}
                          />
                        </div>
                      </div>
                    )}
                    <div className={styles.totalRow}>
                      <label>Descuento:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>₡</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSolicitudEquipo.descuento_solicitud_equipo || ''}
                          onChange={(e) => {
                            const descuento = Number(e.target.value) || 0;
                            const subtotal = currentSolicitudEquipo.subtotal_solicitud_equipo || 0;
                            const iva = currentSolicitudEquipo.iva_solicitud_equipo || 0;
                            const envio = currentSolicitudEquipo.pago_envio ? (currentSolicitudEquipo.monto_envio || 0) : 0;
                            setCurrentSolicitudEquipo(prev => ({
                              ...prev,
                              descuento_solicitud_equipo: e.target.value === '' ? 0 : Number(e.target.value),
                              total_solicitud_equipo: subtotal + iva - descuento + envio
                            }));
                          }}
                          disabled={isViewing}
                          className={styles.inputDescuento}
                        />
                      </div>
                    </div>
                    <div className={styles.totalRow + ' ' + styles.totalFinal}>
                      <span>Total:</span>
                      <span>₡{(currentSolicitudEquipo.total_solicitud_equipo || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Observaciones</label>
                  <textarea
                    value={currentSolicitudEquipo.observaciones_solicitud_equipo}
                    onChange={(e) => setCurrentSolicitudEquipo({ ...currentSolicitudEquipo, observaciones_solicitud_equipo: e.target.value })}
                    disabled={isViewing}
                    placeholder="Observaciones adicionales..."
                    rows={4}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>
                    {isViewing ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {!isViewing && (
                    <button type="submit" className={styles.btnSubmit}>
                      {isEditing ? 'Actualizar' : 'Guardar'}
                    </button>
                  )}
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
        showCancel={confirmDialog.title.includes('Eliminar') || confirmDialog.title.includes('eliminar') || confirmDialog.title.includes('Generar') || confirmDialog.title.includes('generar') || confirmDialog.title.includes('Crear') || confirmDialog.title.includes('Recolección')}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel || (() => setConfirmDialog({ ...confirmDialog, isOpen: false }))}
      />
    </div>
  );
};

export default SolicitudesEquipo;
