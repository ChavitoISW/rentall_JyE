import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column, TableAction } from './Table';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import { EstadoContrato, EstadoContratoLabels, Contrato } from '../types/contrato';
import styles from '../styles/SolicitudEquipo.module.css';

interface ContratoExtendido extends Contrato {
  numero_solicitud_equipo?: string;
  id_cliente?: number;
  nombre_cliente?: string;
  fecha_vencimiento?: string;
  estadoVencimiento?: 'vencido' | 'porVencer' | 'normal';
}

interface DetalleEquipo {
  id_equipo: number;
  nombre_equipo: string;
  cantidad_equipo: number;
  periodicidad: number;
  cantidad_periodos: number;
  fecha_devolucion: string;
  precio_dia?: number;
  precio_semana?: number;
  precio_quincena?: number;
  precio_mes?: number;
  monto_calculado: number;
}

const Contratos: React.FC = () => {
  const [contratos, setContratos] = useState<ContratoExtendido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | 'todos'>('todos');
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [contratoToAnular, setContratoToAnular] = useState<ContratoExtendido | null>(null);
  
  // Estados para extensión
  const [showExtenderModal, setShowExtenderModal] = useState(false);
  const [contratoToExtender, setContratoToExtender] = useState<ContratoExtendido | null>(null);
  const [equiposExtension, setEquiposExtension] = useState<DetalleEquipo[]>([]);
  const [fechaInicioExtension, setFechaInicioExtension] = useState('');
  const [fechaVencimientoExtension, setFechaVencimientoExtension] = useState('');
  const [totalExtension, setTotalExtension] = useState(0);
  const [descuentoExtension, setDescuentoExtension] = useState(0);
  const [usaFactura, setUsaFactura] = useState(false);
  
  // Estados para orden de cambio
  const [showCambioModal, setShowCambioModal] = useState(false);
  const [contratoParaCambio, setContratoParaCambio] = useState<ContratoExtendido | null>(null);
  const [equipoACambiar, setEquipoACambiar] = useState<{id_equipo: number, nombre_equipo: string} | null>(null);
  const [equiposDisponibles, setEquiposDisponibles] = useState<any[]>([]);
  const [equipoNuevoSeleccionado, setEquipoNuevoSeleccionado] = useState<number | null>(null);
  const [motivoCambio, setMotivoCambio] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchContratos();
  }, []);

  // Función para formatear fechas sin conversión UTC (evita el problema de -1 día)
  // Formato: dd/mm/yyyy
  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    // Extraer solo la parte de la fecha (antes de 'T' o espacio)
    const fechaParte = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr.split(' ')[0];
    const partes = fechaParte.split('-');
    
    if (partes.length !== 3) return fechaStr; // Retornar original si no tiene el formato esperado
    
    const [year, month, day] = partes;
    // Asegurar que día y mes tengan 2 dígitos
    const dayStr = day.padStart(2, '0');
    const monthStr = month.padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  };

  const fetchContratos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contrato');
      if (response.ok) {
        const result = await response.json();
        const contratosData = Array.isArray(result.data) ? result.data : [];
        
        // Para cada contrato en estado GENERADO, verificar el estado de vencimiento de los detalles
        const contratosConEstado = await Promise.all(
          contratosData.map(async (contrato: ContratoExtendido) => {
            if (contrato.estado === EstadoContrato.GENERADO && contrato.numero_solicitud_equipo) {
              try {
                const detallesResponse = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${contrato.numero_solicitud_equipo}`);
                const detallesResult = await detallesResponse.json();
                
                if (Array.isArray(detallesResult.data) && detallesResult.data.length > 0) {
                  const fechaActual = new Date();
                  fechaActual.setHours(0, 0, 0, 0);
                  
                  let hayVencido = false;
                  let hayPorVencer = false;
                  
                  for (const detalle of detallesResult.data) {
                    if (detalle.fecha_devolucion) {
                      // Parsear manualmente para evitar conversión UTC
                      const [year, month, day] = detalle.fecha_devolucion.split('T')[0].split('-');
                      const fechaDevolucion = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      fechaDevolucion.setHours(0, 0, 0, 0);
                      
                      const diferenciaDias = Math.ceil((fechaDevolucion.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (diferenciaDias <= 1) {
                        hayVencido = true;
                        break;
                      } else if (diferenciaDias <= 3) {
                        hayPorVencer = true;
                      }
                    }
                  }
                  
                  return {
                    ...contrato,
                    estadoVencimiento: hayVencido ? 'vencido' : hayPorVencer ? 'porVencer' : 'normal'
                  };
                }
              } catch (error) {
                console.error('Error al verificar detalles de contrato:', error);
              }
            }
            
            return { ...contrato, estadoVencimiento: 'normal' };
          })
        );
        
        setContratos(contratosConEstado);
      }
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      setContratos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContratos = contratos.filter(contrato => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (contrato.numero_solicitud_equipo?.toLowerCase() || '').includes(search) ||
      (contrato.nombre_cliente?.toLowerCase() || '').includes(search)
    );
    
    const matchesEstado = 
      estadoFiltro === 'todos' ? true :
      contrato.estado === estadoFiltro;
    
    return matchesSearch && matchesEstado;
  });

  const columns: Column<ContratoExtendido>[] = [
    { 
      key: 'id_contrato', 
      header: '# Contrato', 
      width: '150px' 
    },
    { 
      key: 'numero_solicitud_equipo', 
      header: 'Solicitud', 
      width: '140px',
      render: (c) => (
        <a 
          href={`/solicitudes-equipos?numero=${c.numero_solicitud_equipo}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkSolicitud}
        >
          {c.numero_solicitud_equipo}
        </a>
      )
    },
    { 
      key: 'nombre_cliente', 
      header: 'Cliente', 
      width: '280px' 
    },
    { 
      key: 'estado', 
      header: 'Estado',
      width: '150px',
      render: (c) => {
        const estado = c.estado !== undefined && c.estado !== null ? c.estado : EstadoContrato.GENERADO;
        const label = EstadoContratoLabels[estado as EstadoContrato] || 'Desconocido';
        
        let className = styles.statusActive;
        if (estado === EstadoContrato.ANULADO) {
          className = styles.statusInactive;
        } else if (estado === EstadoContrato.FINALIZADO) {
          className = styles.statusFinalizado;
        } else if (estado === EstadoContrato.EXTENDIDO) {
          className = styles.statusSuccess;
        }
        
        return <span className={className}>{label}</span>;
      }
    },
    { 
      key: 'fecha_vencimiento', 
      header: 'Vencimiento',
      width: '150px',
      render: (c) => {
        if (!c.fecha_vencimiento) return '-';
        
        let className = '';
        if (c.estadoVencimiento === 'vencido') {
          className = styles.fechaVencida;
        } else if (c.estadoVencimiento === 'porVencer') {
          className = styles.fechaPorVencer;
        }
        
        return (
          <span className={className}>
            {formatearFecha(c.fecha_vencimiento)}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      header: 'Creación',
      width: '150px',
      render: (c) => c.created_at ? formatearFecha(c.created_at) : '-'
    }
  ];

  const handleDescargarPDF = async (contrato: ContratoExtendido) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/contrato/pdf?id=${contrato.id_contrato}`);
      
      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${contrato.numero_solicitud_equipo || contrato.id_contrato}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setConfirmDialog({
        isOpen: true,
        title: 'Éxito',
        message: 'El PDF del contrato se descargó correctamente',
        type: 'info',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo descargar el PDF del contrato',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVistaPreviaPDF = async (contrato: ContratoExtendido) => {
    if (!contrato.id_solicitud_equipo) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/contrato/pdf?id_solicitud_equipo=${contrato.id_solicitud_equipo}`);

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

  const handleAnular = async (contrato: ContratoExtendido) => {
    if (contrato.estado === EstadoContrato.ANULADO) {
      setConfirmDialog({
        isOpen: true,
        title: 'Contrato ya anulado',
        message: 'Este contrato ya se encuentra en estado anulado.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    setContratoToAnular(contrato);
    setMotivoAnulacion('');
    setShowAnularModal(true);
  };

  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      alert('Debe ingresar un motivo de anulación');
      return;
    }

    if (!contratoToAnular) return;

    setShowAnularModal(false);
    setConfirmDialog({
      isOpen: true,
      title: '¿Anular contrato?',
      message: '¿Estás seguro de que deseas anular este contrato? Esta acción regresará la solicitud a estado SOLICITUD y los equipos a estado RESERVADO.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/contrato/anular/${contratoToAnular.id_contrato}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              motivo_anulacion: motivoAnulacion,
              usuario_anulacion: 'Usuario'
            }),
          });

          if (response.ok) {
            // Recargar contratos inmediatamente
            await fetchContratos();
            
            setConfirmDialog({
              isOpen: true,
              title: 'Éxito',
              message: 'Contrato anulado exitosamente. La solicitud ha sido revertida a estado SOLICITUD.',
              type: 'info',
              onConfirm: () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
              }
            });
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al anular contrato');
          }
        } catch (error: any) {
          console.error('Error al anular contrato:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: error.message || 'No se pudo anular el contrato',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const calcularPrecioEquipo = (equipo: DetalleEquipo, conFactura: boolean): number => {
    let precioUnitario = 0;
    const periodicidad = Number(equipo.periodicidad);
    
    switch (periodicidad) {
      case 0: // Día
        precioUnitario = Number(equipo.precio_dia) || 0;
        break;
      case 1: // Semana
        precioUnitario = Number(equipo.precio_semana) || 0;
        break;
      case 2: // Quincena
        precioUnitario = Number(equipo.precio_quincena) || 0;
        break;
      case 4: // Mes
        precioUnitario = Number(equipo.precio_mes) || 0;
        break;
      default:
        console.warn('Periodicidad no reconocida:', periodicidad);
        precioUnitario = 0;
    }
    
    const cantidadEquipo = Number(equipo.cantidad_equipo) || 0;
    const cantidadPeriodos = Number(equipo.cantidad_periodos) || 0;
    const subtotal = cantidadEquipo * cantidadPeriodos * precioUnitario;
    const iva = conFactura ? subtotal * 0.13 : 0;
    const total = subtotal + iva;
    
    console.log('Cálculo precio:', {
      nombre: equipo.nombre_equipo,
      periodicidad,
      precioUnitario,
      cantidadEquipo,
      cantidadPeriodos,
      subtotal,
      iva,
      total,
      conFactura
    });
    
    return total;
  };

  const handleGenerarCambio = async (contrato: ContratoExtendido) => {
    if (!contrato.numero_solicitud_equipo) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo obtener la información de la solicitud de equipo',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    // Mostrar modal de selección de equipo a cambiar
    try {
      setIsLoading(true);
      // Obtener equipos del contrato desde detalle_solicitud_equipo
      const detallesResponse = await fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${contrato.numero_solicitud_equipo}`);
      const detallesResult = await detallesResponse.json();
      
      if (!detallesResult.success || !detallesResult.data || detallesResult.data.length === 0) {
        throw new Error('No se encontraron equipos en el contrato');
      }

      // Obtener equipos con información completa
      const equiposDelContrato = detallesResult.data.filter((d: any) => d.id_equipo);
      
      if (equiposDelContrato.length === 0) {
        throw new Error('No hay equipos en el contrato');
      }

      setContratoParaCambio(contrato);
      // Si solo hay un equipo, seleccionarlo automáticamente
      if (equiposDelContrato.length === 1) {
        const equipo = equiposDelContrato[0];
        await iniciarCambioEquipo(contrato, equipo.id_equipo, equipo.nombre_equipo || `Equipo #${equipo.id_equipo}`);
      } else {
        // Por ahora seleccionar el primero (podrías implementar un selector aquí)
        const equipo = equiposDelContrato[0];
        await iniciarCambioEquipo(contrato, equipo.id_equipo, equipo.nombre_equipo || `Equipo #${equipo.id_equipo}`);
      }
    } catch (error: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Error al cargar los equipos del contrato',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const iniciarCambioEquipo = async (contrato: ContratoExtendido, idEquipoActual: number, nombreEquipoActual: string) => {
    try {
      setIsLoading(true);
      // Obtener info del equipo para saber su categoría
      const equipoResponse = await fetch(`/api/equipo/${idEquipoActual}`);
      const equipoResult = await equipoResponse.json();
      
      if (!equipoResult.success || !equipoResult.data) {
        throw new Error('No se pudo obtener información del equipo');
      }

      const categoriaId = equipoResult.data.id_equipo_categoria;
      
      // Obtener equipos disponibles de la misma categoría
      const equiposResponse = await fetch('/api/equipo');
      const equiposResult = await equiposResponse.json();
      
      if (!equiposResult.success || !equiposResult.data) {
        throw new Error('No se pudieron cargar los equipos disponibles');
      }

      // Filtrar equipos de la misma categoría que tengan unidades disponibles
      const equiposDisp = equiposResult.data.filter((eq: any) => 
        eq.id_equipo_categoria === categoriaId && 
        eq.id_equipo !== idEquipoActual &&
        (eq.cantidad_disponible || 0) > 0
      );

      if (equiposDisp.length === 0) {
        throw new Error('No hay equipos disponibles de la misma categoría para realizar el cambio');
      }

      setEquipoACambiar({ id_equipo: idEquipoActual, nombre_equipo: nombreEquipoActual });
      setEquiposDisponibles(equiposDisp);
      setEquipoNuevoSeleccionado(null);
      setMotivoCambio('');
      setShowCambioModal(true);
    } catch (error: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Error al iniciar el proceso de cambio',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarCambio = async () => {
    console.log('=== INICIO confirmarCambio ===');
    console.log('motivoCambio:', motivoCambio);
    console.log('equipoNuevoSeleccionado:', equipoNuevoSeleccionado);
    console.log('contratoParaCambio:', contratoParaCambio);
    console.log('equipoACambiar:', equipoACambiar);
    
    if (!motivoCambio.trim()) {
      console.log('ERROR: Motivo de cambio vacío');
      alert('Debe ingresar el motivo del cambio');
      return;
    }

    if (!equipoNuevoSeleccionado) {
      console.log('ERROR: No hay equipo nuevo seleccionado');
      alert('Debe seleccionar un equipo nuevo');
      return;
    }

    if (!contratoParaCambio || !equipoACambiar) {
      console.log('ERROR: Falta contratoParaCambio o equipoACambiar');
      return;
    }

    console.log('Todas las validaciones pasaron, cerrando modal...');
    setShowCambioModal(false);
    console.log('Abriendo diálogo de confirmación...');
    setConfirmDialog({
      isOpen: true,
      title: '¿Confirmar orden de cambio?',
      message: `Se creará una orden de cambio para reemplazar ${equipoACambiar.nombre_equipo} por el equipo seleccionado. Esta acción actualizará el inventario.`,
      type: 'warning',
      onConfirm: async () => {
        console.log('=== Usuario confirmó la orden de cambio ===');
        setIsLoading(true);
        try {
          console.log('Buscando equipo nuevo en lista de disponibles...');
          const equipoNuevo = equiposDisponibles.find(eq => eq.id_equipo === equipoNuevoSeleccionado);
          console.log('Equipo nuevo encontrado:', equipoNuevo);
          
          // Obtener datos completos de la SE para dirección y teléfono
          console.log('Obteniendo datos de la SE, id:', contratoParaCambio.id_solicitud_equipo);
          
          let seResult: { success: boolean; data: any } = { success: false, data: null };
          try {
            const seResponse = await fetch(`/api/solicitud-equipo/${contratoParaCambio.id_solicitud_equipo}`);
            console.log('seResponse recibido, status:', seResponse.status);
            
            if (seResponse.ok) {
              seResult = await seResponse.json();
              console.log('Resultado SE completo:', seResult);
            } else {
              console.error('Error en fetch SE, status:', seResponse.status);
            }
          } catch (fetchError) {
            console.error('Error al obtener datos de SE:', fetchError);
          }
          
          console.log('Preparando datos de dirección...');
          let direccionData = {
            provincia: 'N/A',
            canton: 'N/A',
            distrito: 'N/A',
            otras_senas: '',
            telefono: ''
          };
          
          if (seResult.success && seResult.data) {
            const se: any = seResult.data;
            console.log('Datos SE encontrados:', se);
            direccionData = {
              provincia: se.provincia_solicitud_equipo || 'N/A',
              canton: se.canton_solicitud_equipo || 'N/A',
              distrito: se.distrito_solicitud_equipo || 'N/A',
              otras_senas: se.otras_senas_solicitud_equipo || '',
              telefono: se.telefono_recibe || ''
            };
            console.log('Dirección preparada:', direccionData);
          } else {
            console.log('No se encontraron datos de SE, usando valores por defecto');
          }
          
          console.log('Construyendo objeto ordenCambio...');
          const ordenCambio = {
            id_solicitud_equipo: contratoParaCambio.id_solicitud_equipo,
            numero_solicitud_equipo: contratoParaCambio.numero_solicitud_equipo,
            id_equipo_actual: equipoACambiar.id_equipo,
            nombre_equipo_actual: equipoACambiar.nombre_equipo,
            id_equipo_nuevo: equipoNuevoSeleccionado,
            nombre_equipo_nuevo: equipoNuevo?.nombre_equipo || 'N/A',
            motivo_cambio: motivoCambio,
            provincia: direccionData.provincia,
            canton: direccionData.canton,
            distrito: direccionData.distrito,
            otras_senas: direccionData.otras_senas,
            nombre_cliente: contratoParaCambio.nombre_cliente,
            telefono_cliente: direccionData.telefono
          };

          console.log('Creando orden de cambio con datos:', ordenCambio);

          const response = await fetch('/api/orden-cambio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ordenCambio)
          });

          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);

          if (!response.ok) {
            let errorMessage = 'Error al crear la orden de cambio';
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            try {
              const text = await response.text();
              console.log('Response text:', text);
              
              if (contentType && contentType.includes('application/json')) {
                const errorData = JSON.parse(text);
                errorMessage = errorData.error || errorMessage;
              } else {
                errorMessage = `Error ${response.status}: ${text || response.statusText}`;
              }
            } catch (e) {
              console.error('Error al parsear respuesta:', e);
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();
          console.log('Resultado recibido:', result);
          console.log('Orden creada en servidor:', result.data);
          
          setConfirmDialog({
            isOpen: true,
            title: 'Éxito',
            message: `Orden de cambio #${result.data.numero_orden_cambio} creada exitosamente. El inventario ha sido actualizado.`,
            type: 'info',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
              // Limpiar estados
              setEquipoACambiar(null);
              setEquiposDisponibles([]);
              setEquipoNuevoSeleccionado(null);
              setMotivoCambio('');
            }
          });
        } catch (error: any) {
          console.error('=== ERROR al crear orden de cambio ===');
          console.error('Error:', error);
          console.error('Message:', error.message);
          console.error('Stack:', error.stack);
          
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: error.message || 'No se pudo crear la orden de cambio',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          console.log('=== Finalizando creación de orden de cambio ===');
          setIsLoading(false);
        }
      }
    });
  };

  const recalcularTotalExtension = (equipos: DetalleEquipo[]) => {
    const subtotal = equipos.reduce((sum, eq) => sum + eq.monto_calculado, 0);
    setTotalExtension(subtotal - descuentoExtension);
  };

  const handleExtender = async (contrato: ContratoExtendido) => {
    if (contrato.estado !== EstadoContrato.GENERADO) {
      setConfirmDialog({
        isOpen: true,
        title: 'No se puede extender',
        message: 'Solo se pueden extender contratos en estado GENERADO.',
        type: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
      return;
    }

    // REGLA DE NEGOCIO: La fecha de inicio de una extensión DEBE ser la misma
    // que la fecha de vencimiento del contrato raíz
    // Este campo es de solo lectura y no puede ser modificado por el usuario
    const fechaInicioStr = contrato.fecha_vencimiento!.split('T')[0];
    setFechaInicioExtension(fechaInicioStr);

    // Obtener detalles de la SE original y precios actuales de equipos
    setIsLoading(true);
    try {
      const [detallesResp, seResp] = await Promise.all([
        fetch(`/api/detalle-solicitud-equipo?numero_solicitud_equipo=${contrato.numero_solicitud_equipo}`),
        fetch(`/api/solicitud-equipo/${contrato.id_solicitud_equipo}`)
      ]);
      
      const detallesResult = await detallesResp.json();
      const seResult = await seResp.json();
      
      if (detallesResult.success && Array.isArray(detallesResult.data)) {
        // Obtener usa_factura de la SE original
        const usaFacturaSE = seResult.success && seResult.data ? seResult.data.usa_factura : false;
        setUsaFactura(usaFacturaSE);
        
        // Obtener precios actuales para cada equipo
        const equiposConPrecios = await Promise.all(
          detallesResult.data.map(async (det: any) => {
            console.log('Detalle original de API:', {
              nombre_equipo: det.nombre_equipo,
              periodicidad: det.periodicidad,
              periodicidad_tipo: typeof det.periodicidad,
              cantidad_periodicidad: det.cantidad_periodicidad,
              fecha_devolucion: det.fecha_devolucion
            });
            
            // Obtener precios actuales del equipo
            const preciosResp = await fetch(`/api/equipo/precios?id_equipo=${det.id_equipo}`);
            const preciosResult = await preciosResp.json();
            
            const precios = preciosResult.success ? preciosResult.data : {
              precio_dia: 0,
              precio_semana: 0,
              precio_quincena: 0,
              precio_mes: 0
            };
            
            // Formatear fecha_devolucion para input type="date" (YYYY-MM-DD)
            // IMPORTANTE: Calcular fecha basándose en la NUEVA fecha de inicio, no la del contrato original
            // Iniciar sin periodicidad seleccionada para que el usuario elija
            const periodicidadNum = -1; // Sin seleccionar
            
            const cantidadPeriodos = Number(det.cantidad_periodicidad) || 1;
            
            // Calcular nueva fecha de devolución basada en la nueva fecha de inicio
            // Si periodicidad es -1 (sin seleccionar), dejar fecha vacía
            const fechaDevolucionCalculada = periodicidadNum === -1 ? '' : calcularFechaDevolucion(
              fechaInicioStr,
              periodicidadNum,
              cantidadPeriodos
            );
            
            const equipoExtension: DetalleEquipo = {
              id_equipo: det.id_equipo,
              nombre_equipo: det.nombre_equipo,
              cantidad_equipo: Number(det.cantidad_equipo) || 1,
              periodicidad: periodicidadNum,
              cantidad_periodos: cantidadPeriodos,
              fecha_devolucion: fechaDevolucionCalculada,
              precio_dia: Number(precios.precio_dia) || 0,
              precio_semana: Number(precios.precio_semana) || 0,
              precio_quincena: Number(precios.precio_quincena) || 0,
              precio_mes: Number(precios.precio_mes) || 0,
              monto_calculado: 0
            };
            
            // Calcular monto inicial
            equipoExtension.monto_calculado = calcularPrecioEquipo(equipoExtension, usaFacturaSE);
            
            console.log('Equipo inicializado:', equipoExtension.nombre_equipo, {
              periodicidad: equipoExtension.periodicidad,
              cantidad_periodos: equipoExtension.cantidad_periodos,
              cantidad_equipo: equipoExtension.cantidad_equipo,
              precio_dia: equipoExtension.precio_dia,
              precio_semana: equipoExtension.precio_semana,
              precio_quincena: equipoExtension.precio_quincena,
              precio_mes: equipoExtension.precio_mes,
              monto: equipoExtension.monto_calculado
            });
            
            return equipoExtension;
          })
        );
        
        setEquiposExtension(equiposConPrecios);
        setDescuentoExtension(0);
        recalcularTotalExtension(equiposConPrecios);
        
        // Calcular fecha de vencimiento inicial (fecha máxima de devolución)
        const fechasDevolucion = equiposConPrecios
          .map(eq => eq.fecha_devolucion)
          .filter(f => f);
        
        if (fechasDevolucion.length > 0) {
          const maxFecha = fechasDevolucion.reduce((max, fecha) => fecha > max ? fecha : max);
          setFechaVencimientoExtension(maxFecha);
        }
        
        setContratoToExtender(contrato);
        setShowExtenderModal(true);
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'No se pudieron cargar los detalles del contrato',
        type: 'danger',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calcularFechaDevolucion = (fechaInicio: string, periodicidad: number, cantidadPeriodos: number): string => {
    if (!fechaInicio || !cantidadPeriodos || periodicidad === -1) return '';
    
    const fecha = new Date(fechaInicio + 'T00:00:00');
    
    switch (periodicidad) {
      case 0: // Día
        fecha.setDate(fecha.getDate() + cantidadPeriodos);
        break;
      case 1: // Semana
        fecha.setDate(fecha.getDate() + (cantidadPeriodos * 7));
        break;
      case 2: // Quincena
        fecha.setDate(fecha.getDate() + (cantidadPeriodos * 14));
        break;
      case 4: // Mes
        fecha.setMonth(fecha.getMonth() + cantidadPeriodos);
        break;
      default:
        return '';
    }
    
    return fecha.toISOString().split('T')[0];
  };

  const handleUpdateEquipo = (index: number, field: string, value: any) => {
    console.log('handleUpdateEquipo llamado:', { index, field, value });
    
    setEquiposExtension((prevEquipos) => {
      // Crear copia del array
      const nuevosEquipos = prevEquipos.map((equipo, idx) => {
        if (idx !== index) return equipo;
        
        // Crear copia del equipo específico
        const equipoActualizado = { ...equipo };
        
        // Actualizar el campo
        if (field === 'periodicidad' || field === 'cantidad_periodos' || field === 'cantidad_equipo') {
          (equipoActualizado as any)[field] = Number(value);
        } else {
          (equipoActualizado as any)[field] = value;
        }
        
        // Si se cambia periodicidad o cantidad_periodos, recalcular fecha_devolucion automáticamente
        if (field === 'periodicidad' || field === 'cantidad_periodos') {
          equipoActualizado.fecha_devolucion = calcularFechaDevolucion(
            fechaInicioExtension,
            equipoActualizado.periodicidad,
            equipoActualizado.cantidad_periodos
          );
          console.log('Fecha de devolución recalculada:', equipoActualizado.fecha_devolucion);
        }
        
        // Si se cambia manualmente la fecha de devolución, también necesitamos recalcular el vencimiento
        // (esto se hace más abajo cuando se recalcula para todos los equipos)
        
        // Recalcular monto del equipo
        const montoNuevo = calcularPrecioEquipo(equipoActualizado, usaFactura);
        equipoActualizado.monto_calculado = montoNuevo;
        
        console.log('Equipo actualizado (dentro de setState):', {
          field,
          valorAnterior: equipo[field as keyof DetalleEquipo],
          valorNuevo: equipoActualizado[field as keyof DetalleEquipo],
          fecha_devolucion: equipoActualizado.fecha_devolucion,
          equipoCompleto: equipoActualizado
        });
        
        return equipoActualizado;
      });
      
      // Recalcular total y fecha de vencimiento
      const subtotal = nuevosEquipos.reduce((sum, eq) => sum + eq.monto_calculado, 0);
      setTotalExtension(subtotal - descuentoExtension);
      
      // Calcular nueva fecha de vencimiento (fecha máxima de devolución)
      const fechasDevolucion = nuevosEquipos
        .map(eq => eq.fecha_devolucion)
        .filter(f => f);
      
      if (fechasDevolucion.length > 0) {
        const maxFecha = fechasDevolucion.reduce((max, fecha) => fecha > max ? fecha : max);
        setFechaVencimientoExtension(maxFecha);
      }
      
      return nuevosEquipos;
    });
  };

  const confirmarExtension = async () => {
    // Validar que todos los equipos tengan fecha de devolución
    const hayErrores = equiposExtension.some(eq => 
      !eq.fecha_devolucion || 
      eq.periodicidad === undefined || 
      eq.periodicidad === null || 
      eq.periodicidad === -1 ||
      !eq.cantidad_periodos || 
      eq.cantidad_periodos <= 0
    );
    
    if (hayErrores) {
      console.log('Equipos con errores:', equiposExtension.map(eq => ({
        nombre: eq.nombre_equipo,
        periodicidad: eq.periodicidad,
        cantidad_periodos: eq.cantidad_periodos,
        fecha_devolucion: eq.fecha_devolucion
      })));
      alert('Todos los equipos deben tener periodicidad, cantidad de períodos y fecha de devolución');
      return;
    }

    if (!contratoToExtender) return;

    setShowExtenderModal(false);
    setConfirmDialog({
      isOpen: true,
      title: '¿Extender contrato?',
      message: `¿Estás seguro de que deseas crear una extensión del contrato #${contratoToExtender.id_contrato}? Se creará un nuevo contrato con fecha de inicio ${fechaInicioExtension}.`,
      type: 'warning',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/contrato/extender/${contratoToExtender.id_contrato}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              equipos: equiposExtension,
              descuento: descuentoExtension
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            await fetchContratos();
            
            setConfirmDialog({
              isOpen: true,
              title: 'Éxito',
              message: `Extensión creada exitosamente. Nuevo contrato #${result.data.id_contrato} generado.`,
              type: 'info',
              onConfirm: () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
              }
            });
          } else {
            throw new Error(result.error || 'Error al extender contrato');
          }
        } catch (error: any) {
          console.error('Error al extender contrato:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: error.message || 'No se pudo crear la extensión del contrato',
            type: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const actions: TableAction<ContratoExtendido>[] = [
    {
      label: '📄',
      onClick: handleVistaPreviaPDF,
      className: styles.btnPrintDoc,
      tooltip: 'Imprimir contrato PDF'
    },   
    {
      label: '🔄',
      onClick: handleGenerarCambio,
      className: styles.btnInfo,
      condition: (c) => c.estado === EstadoContrato.GENERADO,
      tooltip: 'Generar orden de cambio de equipo'
    },
    {
      label: '🚫',
      onClick: handleAnular,
      className: styles.btnAnular,
      condition: (c) => c.estado !== EstadoContrato.EXTENDIDO && c.estado !== EstadoContrato.FINALIZADO && c.estado !== EstadoContrato.ANULADO,
      tooltip: 'Anular contrato'
    },
    {
      label: '📅',
      onClick: handleExtender,
      className: styles.btnContrato,
      condition: (c) => c.estado === EstadoContrato.GENERADO && (c.estadoVencimiento === 'vencido' || c.estadoVencimiento === 'porVencer'),
      tooltip: 'Extender contrato'
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Gestión de Contratos</h1>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar contratos..."
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
            {Object.entries(EstadoContratoLabels).map(([value, label]: [string, string]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredContratos}
          actions={actions}
          keyExtractor={(c) => c.id_contrato!}
          noDataMessage="No se encontraron contratos"
        />
      </main>

      <Footer />
      
      {/* Modal de Anulación */}
      {showAnularModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAnularModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Anular Contrato</h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAnularModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Contrato: <strong>#{contratoToAnular?.id_contrato}</strong><br />
                Cliente: <strong>{contratoToAnular?.nombre_cliente}</strong>
              </p>
              <label className={styles.modalLabel}>
                Motivo de anulación <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                className={styles.modalTextarea}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ingrese el motivo por el cual se anula este contrato..."
                rows={4}
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowAnularModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnAnularConfirm}
                onClick={confirmarAnulacion}
                disabled={!motivoAnulacion.trim()}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Extensión */}
      {showExtenderModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExtenderModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div className={styles.modalHeader}>
              <h2>Extender Contrato</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowExtenderModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.form}>
              <div className={styles.section}>
                <h3>Información del Contrato Original</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Contrato #</label>
                    <input
                      type="text"
                      value={contratoToExtender?.id_contrato || ''}
                      readOnly
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cliente</label>
                    <input
                      type="text"
                      value={contratoToExtender?.nombre_cliente || ''}
                      readOnly
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nueva Fecha Inicio</label>
                    <input
                      type="date"
                      value={fechaInicioExtension}
                      readOnly
                      title="Fecha calculada automáticamente: Fecha de vencimiento del contrato + 1 día. Esta fecha no puede ser modificada según reglas de negocio."
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nueva Fecha Vencimiento</label>
                    <input
                      type="date"
                      value={fechaVencimientoExtension}
                      readOnly
                      title="Calculada automáticamente: Fecha máxima de devolución de equipos"
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Equipos a Extender</h3>
                {equiposExtension.length > 0 && (
                  <div className={styles.detalleHeader}>
                    <span>Equipo</span>
                    <span>Cantidad</span>
                    <span>Periodicidad</span>
                    <span>Cant. Períodos</span>
                    <span>F. Devolución</span>
                    <span>Monto</span>
                  </div>
                )}
                
                <div className={styles.detallesContainer}>
                  {equiposExtension.map((equipo, index) => (
                    <div key={`${equipo.id_equipo}-${index}`} className={styles.detalleRow}>
                      <div className={styles.selectEquipo} style={{ minWidth: '200px' }}>
                        {equipo.nombre_equipo}
                      </div>
                      
                      <input
                        type="number"
                        value={equipo.cantidad_equipo}
                        readOnly
                        className={styles.inputSmall}
                        style={{ background: '#f0f0f0', cursor: 'not-allowed', textAlign: 'center' }}
                      />
                      
                      <select
                        value={equipo.periodicidad}
                        onChange={(e) => handleUpdateEquipo(index, 'periodicidad', Number(e.target.value))}
                        className={styles.inputSmall}
                      >
                        <option value="-1" disabled>Seleccionar</option>
                        <option value="0">Día</option>
                        <option value="1">Semana</option>
                        <option value="2">Quincena</option>
                        <option value="4">Mes</option>
                      </select>
                      
                      <input
                        type="number"
                        placeholder="Cant."
                        min="1"
                        value={equipo.cantidad_periodos}
                        onChange={(e) => handleUpdateEquipo(index, 'cantidad_periodos', Number(e.target.value))}
                        className={styles.inputSmall}
                      />
                      
                      <input
                        type="date"
                        value={equipo.fecha_devolucion || ''}
                        onChange={(e) => handleUpdateEquipo(index, 'fecha_devolucion', e.target.value)}
                        min={fechaInicioExtension}
                        className={styles.inputMedium}
                      />
                      
                      <span className={styles.montoFinal}>
                        ₡{(equipo.monto_calculado || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f7ff', border: '1px solid #b3d9ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <label style={{ margin: 0, fontSize: '0.9rem', color: '#0066cc', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        Descuento (₡):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={descuentoExtension === 0 ? '' : descuentoExtension}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                          setDescuentoExtension(val);
                          const subtotal = equiposExtension.reduce((sum, eq) => sum + eq.monto_calculado, 0);
                          setTotalExtension(subtotal - val);
                        }}
                        style={{ width: '130px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #b3d9ff', fontSize: '0.9rem' }}
                      />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0066cc', fontWeight: 500 }}>
                      <strong>Total Estimado:</strong> ₡{totalExtension.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                      {usaFactura ? '(Incluye IVA 13%)' : '(Sin IVA)'}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
                    <p style={{ margin: 0 }}>Los precios mostrados son según las tarifas actuales del sistema.</p>
                    <p style={{ margin: '0.25rem 0 0 0' }}>El monto se recalcula automáticamente al modificar los campos.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowExtenderModal(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={styles.btnContrato}
                onClick={confirmarExtension}
                type="button"
              >
                Crear Extensión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Orden de Cambio */}
      {showCambioModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCambioModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className={styles.modalHeader}>
              <h2>🔄 Generar Orden de Cambio</h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowCambioModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Contrato: <strong>#{contratoParaCambio?.id_contrato}</strong><br />
                Cliente: <strong>{contratoParaCambio?.nombre_cliente}</strong>
              </p>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#495057' }}>
                  Equipo Actual (a retirar)
                </label>
                <div style={{ padding: '0.75rem', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107', color: '#856404' }}>
                  <strong style={{ fontSize: '1.05rem' }}>← {equipoACambiar?.nombre_equipo}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className={styles.modalLabel}>
                  Equipo Nuevo (a entregar) <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  className={styles.searchInput}
                  value={equipoNuevoSeleccionado || ''}
                  onChange={(e) => setEquipoNuevoSeleccionado(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Seleccione el equipo de reemplazo --</option>
                  {equiposDisponibles.map((equipo) => (
                    <option key={equipo.id_equipo} value={equipo.id_equipo}>
                      {equipo.nombre_equipo} (Disponibles: {equipo.cantidad_disponible})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.modalLabel}>
                  Motivo del Cambio <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  className={styles.modalTextarea}
                  value={motivoCambio}
                  onChange={(e) => setMotivoCambio(e.target.value)}
                  placeholder="Ejemplo: Equipo presenta fallas mecánicas, cliente solicita cambio por X motivo, etc."
                  rows={4}
                  maxLength={500}
                />
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', textAlign: 'right' }}>
                  {motivoCambio.length}/500 caracteres
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e7f3ff', borderRadius: '6px', border: '1px solid #0066cc' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#004085' }}>
                  <strong>Nota:</strong> Al crear la orden, el equipo actual pasará a estado "En Recolección" y el equipo nuevo a "Alquilado".
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowCambioModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnContrato}
                onClick={confirmarCambio}
                disabled={!motivoCambio.trim() || !equipoNuevoSeleccionado}
                style={{
                  opacity: (!motivoCambio.trim() || !equipoNuevoSeleccionado) ? 0.5 : 1,
                  cursor: (!motivoCambio.trim() || !equipoNuevoSeleccionado) ? 'not-allowed' : 'pointer'
                }}
              >
                Crear Orden de Cambio
              </button>
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
        showCancel={false}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default Contratos;
