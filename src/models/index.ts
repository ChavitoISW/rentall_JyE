import db from '../lib/database';
import { EstadoEquipo } from '../types/estadoEquipo';

export enum EstadoSolicitudEquipo {
  SOLICITUD = 1,
  CONTRATO_GENERADO = 2,
  EN_RUTA_ENTREGA = 3,
  DONDE_CLIENTE = 4,
  EN_RUTA_RECOLECCION = 5,
  FINALIZADO = 6,
  CANCELADO = 7,
  ANULADO = 8
}

export const EstadoSolicitudEquipoLabels: Record<EstadoSolicitudEquipo, string> = {
  [EstadoSolicitudEquipo.SOLICITUD]: 'Solicitud',
  [EstadoSolicitudEquipo.CONTRATO_GENERADO]: 'Contrato Generado',
  [EstadoSolicitudEquipo.EN_RUTA_ENTREGA]: 'En Ruta Entrega',
  [EstadoSolicitudEquipo.DONDE_CLIENTE]: 'Contrato Activo',
  [EstadoSolicitudEquipo.EN_RUTA_RECOLECCION]: 'En Ruta Recolección',
  [EstadoSolicitudEquipo.FINALIZADO]: 'Finalizado',
  [EstadoSolicitudEquipo.CANCELADO]: 'Cancelado',
  [EstadoSolicitudEquipo.ANULADO]: 'Anulado'
};

export interface CategoriaEquipo {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id_cliente?: number;
  documento_identidad_cliente: string;
  nombre_cliente: string;
  apellidos_cliente: string;
  telefono_cliente?: string;
  email_cliente?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  estado_cliente?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Rol {
  id_rol?: number;
  nombre_rol: string;
  descripcion_rol?: string;
  estado_rol?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Usuario {
  id_usuario?: number;
  identificacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  telefono_usuario?: string;
  email_usuario?: string;
  contrasena_usuario?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  otras_senas?: string;
  direccion_usuario?: string;
  estado_usuario?: boolean;
  usuario_rol?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Equipo {
  id_equipo?: number;
  cantidad_equipo: number;
  nombre_equipo: string;
  id_equipo_categoria?: number;
  id_estado_equipo?: number;
  id_equipo_especifico?: number;
  // Nuevas columnas para sistema de inventario por estados
  cantidad_disponible?: number;
  cantidad_alquilado?: number;
  cantidad_en_transito?: number;
  cantidad_en_recoleccion?: number;
  cantidad_en_mantenimiento?: number;
  cantidad_reservado?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EncabezadoSolicitudEquipo {
  id_solicitud_equipo?: number;
  numero_solicitud_equipo?: string;
  id_cliente?: number;
  fecha_elaboracion?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  nombre_recibe?: string;
  cedula_recibe?: string;
  telefono_recibe?: string;
  precio_total_equipos?: number;
  provincia_solicitud_equipo?: string;
  canton_solicitud_equipo?: string;
  distrito_solicitud_equipo?: string;
  otras_senas_solicitud_equipo?: string;
  observaciones_solicitud_equipo?: string;
  pago_envio?: boolean;
  monto_envio?: number;
  usa_factura?: boolean;
  subtotal_solicitud_equipo?: number;
  descuento_solicitud_equipo?: number;
  total_solicitud_equipo?: number;
  iva_solicitud_equipo?: number;
  estado_solicitud_equipo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleSolicitudEquipo {
  id_detalle_solicitud_equipo?: number;
  numero_solicitud_equipo?: string;
  id_equipo?: number;
  cantidad_equipo?: number;
  periodicidad?: number;
  cantidad_periodicidad?: number;
  iva_detalle?: number;
  subtotal_detalle?: number;
  monto_descuento?: number;
  monto_final?: number;
  fecha_devolucion?: string;
  created_at?: string;
  updated_at?: string;
}

// Funciones CRUD para CategoriaEquipo
export const categoriaEquipoModel = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM categoria_equipo').all() as any[];
    return rows.map(row => ({
      ...row,
      estado: row.estado === 1
    })) as CategoriaEquipo[];
  },

  getById: (id: number) => {
    const row = db.prepare('SELECT * FROM categoria_equipo WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      estado: row.estado === 1
    } as CategoriaEquipo;
  },

  getByEstado: (estado: boolean) => {
    const estadoValue = estado ? 1 : 0;
    const rows = db.prepare('SELECT * FROM categoria_equipo WHERE estado = ?').all(estadoValue) as any[];
    return rows.map(row => ({
      ...row,
      estado: row.estado === 1
    })) as CategoriaEquipo[];
  },

  create: (categoriaEquipo: CategoriaEquipo) => {
    const stmt = db.prepare(`
      INSERT INTO categoria_equipo (nombre, descripcion, estado) 
      VALUES (?, ?, ?)
    `);
    const estadoValue = categoriaEquipo.estado !== false ? 1 : 0;
    const result = stmt.run(
      categoriaEquipo.nombre,
      categoriaEquipo.descripcion || null,
      estadoValue
    );
    return result.lastInsertRowid;
  },

  update: (id: number, categoriaEquipo: Partial<CategoriaEquipo>) => {
    const fields = [];
    const values = [];

    if (categoriaEquipo.nombre) {
      fields.push('nombre = ?');
      values.push(categoriaEquipo.nombre);
    }
    if (categoriaEquipo.descripcion !== undefined) {
      fields.push('descripcion = ?');
      values.push(categoriaEquipo.descripcion);
    }
    if (categoriaEquipo.estado !== undefined) {
      fields.push('estado = ?');
      values.push(categoriaEquipo.estado ? 1 : 0);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE categoria_equipo SET ${fields.join(', ')} WHERE id = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM categoria_equipo WHERE id = ?').run(id);
  },
};

// Funciones CRUD para Cliente
export const clienteModel = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM cliente').all() as any[];
    return rows.map(row => ({
      ...row,
      estado_cliente: row.estado_cliente === 1
    })) as Cliente[];
  },

  getById: (id: number) => {
    const row = db.prepare('SELECT * FROM cliente WHERE id_cliente = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      estado_cliente: row.estado_cliente === 1
    } as Cliente & { nombre_categoria_cliente?: string };
  },

  getByDocumento: (documento: string) => {
    const row = db.prepare('SELECT * FROM cliente WHERE documento_identidad_cliente = ?').get(documento) as any;
    if (!row) return undefined;
    return {
      ...row,
      estado_cliente: row.estado_cliente === 1
    } as Cliente;
  },

  getByEstado: (estado: boolean) => {
    const estadoValue = estado ? 1 : 0;
    const rows = db.prepare('SELECT * FROM cliente WHERE estado_cliente = ?').all(estadoValue) as any[];
    return rows.map(row => ({
      ...row,
      estado_cliente: row.estado_cliente === 1
    })) as Cliente[];
  },

  create: (cliente: Cliente) => {
    const stmt = db.prepare(`
      INSERT INTO cliente (
        documento_identidad_cliente, 
        nombre_cliente, 
        apellidos_cliente, 
        telefono_cliente, 
        email_cliente,
        provincia,
        canton,
        distrito,
        otras_senas,
        estado_cliente
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const estadoValue = cliente.estado_cliente !== false ? 1 : 0;
    const result = stmt.run(
      cliente.documento_identidad_cliente,
      cliente.nombre_cliente,
      cliente.apellidos_cliente,
      cliente.telefono_cliente || null,
      cliente.email_cliente || null,
      cliente.provincia || null,
      cliente.canton || null,
      cliente.distrito || null,
      cliente.otras_senas || null,
      estadoValue
    );
    return result.lastInsertRowid;
  },

  update: (id: number, cliente: Partial<Cliente>) => {
    const fields = [];
    const values = [];

    if (cliente.documento_identidad_cliente) {
      fields.push('documento_identidad_cliente = ?');
      values.push(cliente.documento_identidad_cliente);
    }
    if (cliente.nombre_cliente) {
      fields.push('nombre_cliente = ?');
      values.push(cliente.nombre_cliente);
    }
    if (cliente.apellidos_cliente) {
      fields.push('apellidos_cliente = ?');
      values.push(cliente.apellidos_cliente);
    }
    if (cliente.telefono_cliente !== undefined) {
      fields.push('telefono_cliente = ?');
      values.push(cliente.telefono_cliente);
    }
    if (cliente.email_cliente !== undefined) {
      fields.push('email_cliente = ?');
      values.push(cliente.email_cliente);
    }
    if (cliente.provincia !== undefined) {
      fields.push('provincia = ?');
      values.push(cliente.provincia);
    }
    if (cliente.canton !== undefined) {
      fields.push('canton = ?');
      values.push(cliente.canton);
    }
    if (cliente.distrito !== undefined) {
      fields.push('distrito = ?');
      values.push(cliente.distrito);
    }
    if (cliente.otras_senas !== undefined) {
      fields.push('otras_senas = ?');
      values.push(cliente.otras_senas);
    }
    if (cliente.estado_cliente !== undefined) {
      fields.push('estado_cliente = ?');
      values.push(cliente.estado_cliente ? 1 : 0);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE cliente SET ${fields.join(', ')} WHERE id_cliente = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM cliente WHERE id_cliente = ?').run(id);
  },
};

// Funciones CRUD para Rol
export const rolModel = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM rol').all() as any[];
    return rows.map(row => ({
      ...row,
      estado_rol: row.estado_rol === 1
    })) as Rol[];
  },

  getById: (id: number) => {
    const row = db.prepare('SELECT * FROM rol WHERE id_rol = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      estado_rol: row.estado_rol === 1
    } as Rol;
  },

  getByEstado: (estado: boolean) => {
    const estadoValue = estado ? 1 : 0;
    const rows = db.prepare('SELECT * FROM rol WHERE estado_rol = ?').all(estadoValue) as any[];
    return rows.map(row => ({
      ...row,
      estado_rol: row.estado_rol === 1
    })) as Rol[];
  },

  create: (rol: Rol) => {
    const stmt = db.prepare(`
      INSERT INTO rol (nombre_rol, descripcion_rol, estado_rol) 
      VALUES (?, ?, ?)
    `);
    const estadoValue = rol.estado_rol !== false ? 1 : 0;
    const result = stmt.run(
      rol.nombre_rol,
      rol.descripcion_rol || null,
      estadoValue
    );
    return result.lastInsertRowid;
  },

  update: (id: number, rol: Partial<Rol>) => {
    const fields = [];
    const values = [];

    if (rol.nombre_rol) {
      fields.push('nombre_rol = ?');
      values.push(rol.nombre_rol);
    }
    if (rol.descripcion_rol !== undefined) {
      fields.push('descripcion_rol = ?');
      values.push(rol.descripcion_rol);
    }
    if (rol.estado_rol !== undefined) {
      fields.push('estado_rol = ?');
      values.push(rol.estado_rol ? 1 : 0);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE rol SET ${fields.join(', ')} WHERE id_rol = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM rol WHERE id_rol = ?').run(id);
  },
};

// Funciones CRUD para Usuario
export const usuarioModel = {
  getAll: () => {
    const rows = db.prepare(`
      SELECT usuario.*, rol.nombre_rol 
      FROM usuario 
      LEFT JOIN rol ON usuario.usuario_rol = rol.id_rol
    `).all() as any[];
    return rows.map(row => ({
      ...row,
      estado_usuario: row.estado_usuario === 1
    })) as (Usuario & { nombre_rol?: string })[];
  },

  getById: (id: number) => {
    const row = db.prepare(`
      SELECT usuario.*, rol.nombre_rol 
      FROM usuario 
      LEFT JOIN rol ON usuario.usuario_rol = rol.id_rol 
      WHERE usuario.id_usuario = ?
    `).get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      estado_usuario: row.estado_usuario === 1
    } as Usuario & { nombre_rol?: string };
  },

  getByIdentificacion: (identificacion: string) => {
    const row = db.prepare(`
      SELECT usuario.*, rol.nombre_rol 
      FROM usuario 
      LEFT JOIN rol ON usuario.usuario_rol = rol.id_rol 
      WHERE usuario.identificacion_usuario = ?
    `).get(identificacion) as any;
    if (!row) return undefined;
    return {
      ...row,
      estado_usuario: row.estado_usuario === 1
    } as Usuario & { nombre_rol?: string };
  },

  getByEstado: (estado: boolean) => {
    const estadoValue = estado ? 1 : 0;
    const rows = db.prepare(`
      SELECT usuario.*, rol.nombre_rol 
      FROM usuario 
      LEFT JOIN rol ON usuario.usuario_rol = rol.id_rol 
      WHERE usuario.estado_usuario = ?
    `).all(estadoValue) as any[];
    return rows.map(row => ({
      ...row,
      estado_usuario: row.estado_usuario === 1
    })) as (Usuario & { nombre_rol?: string })[];
  },

  create: (usuario: Usuario) => {
    const stmt = db.prepare(`
      INSERT INTO usuario (
        identificacion_usuario, 
        nombre_usuario, 
        apellido_usuario, 
        telefono_usuario, 
        email_usuario,
        contrasena_usuario,
        provincia,
        canton,
        distrito,
        otras_senas,
        direccion_usuario, 
        estado_usuario, 
        usuario_rol
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const estadoValue = usuario.estado_usuario !== false ? 1 : 0;
    const result = stmt.run(
      usuario.identificacion_usuario,
      usuario.nombre_usuario,
      usuario.apellido_usuario,
      usuario.telefono_usuario || null,
      usuario.email_usuario || null,
      usuario.contrasena_usuario || 'temporal123',
      usuario.provincia || null,
      usuario.canton || null,
      usuario.distrito || null,
      usuario.otras_senas || null,
      usuario.direccion_usuario || null,
      estadoValue,
      usuario.usuario_rol || null
    );
    return result.lastInsertRowid;
  },

  update: (id: number, usuario: Partial<Usuario>) => {
    const fields = [];
    const values = [];

    if (usuario.identificacion_usuario) {
      fields.push('identificacion_usuario = ?');
      values.push(usuario.identificacion_usuario);
    }
    if (usuario.nombre_usuario) {
      fields.push('nombre_usuario = ?');
      values.push(usuario.nombre_usuario);
    }
    if (usuario.apellido_usuario) {
      fields.push('apellido_usuario = ?');
      values.push(usuario.apellido_usuario);
    }
    if (usuario.telefono_usuario !== undefined) {
      fields.push('telefono_usuario = ?');
      values.push(usuario.telefono_usuario);
    }
    if (usuario.email_usuario !== undefined) {
      fields.push('email_usuario = ?');
      values.push(usuario.email_usuario);
    }
    if (usuario.provincia !== undefined) {
      fields.push('provincia = ?');
      values.push(usuario.provincia);
    }
    if (usuario.canton !== undefined) {
      fields.push('canton = ?');
      values.push(usuario.canton);
    }
    if (usuario.distrito !== undefined) {
      fields.push('distrito = ?');
      values.push(usuario.distrito);
    }
    if (usuario.otras_senas !== undefined) {
      fields.push('otras_senas = ?');
      values.push(usuario.otras_senas);
    }
    if (usuario.direccion_usuario !== undefined) {
      fields.push('direccion_usuario = ?');
      values.push(usuario.direccion_usuario);
    }
    if (usuario.contrasena_usuario !== undefined) {
      fields.push('contrasena_usuario = ?');
      values.push(usuario.contrasena_usuario);
    }
    if (usuario.estado_usuario !== undefined) {
      fields.push('estado_usuario = ?');
      values.push(usuario.estado_usuario ? 1 : 0);
    }
    if (usuario.usuario_rol !== undefined) {
      fields.push('usuario_rol = ?');
      values.push(usuario.usuario_rol);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM usuario WHERE id_usuario = ?').run(id);
  },
};

// Funciones CRUD para Equipo
export const equipoModel = {
  getAll: () => {
    const rows = db.prepare(`
      SELECT equipo.*, 
        categoria_equipo.nombre as nombre_categoria
      FROM equipo 
      LEFT JOIN categoria_equipo ON equipo.id_equipo_categoria = categoria_equipo.id
    `).all() as (Equipo & { nombre_categoria?: string; nombre_estado?: string; nombre_equipo_especifico?: string })[];
    
    // Post-procesar para obtener nombre_equipo_especifico
    const enrichedRows = rows.map(row => {
      let nombre_equipo_especifico = null;
      
      if (row.id_equipo_especifico && row.nombre_categoria) {
        const cat = row.nombre_categoria.toLowerCase();
        
        try {
          if (cat.includes('mezcladora')) {
            const equipo = db.prepare('SELECT nombre_equipo FROM mezcladora WHERE id_mezcladora = ?').get(row.id_equipo_especifico) as any;
            nombre_equipo_especifico = equipo?.nombre_equipo;
          } else if (cat.includes('andamio')) {
            const equipo = db.prepare('SELECT nombre_equipo FROM andamio WHERE id_andamio = ?').get(row.id_equipo_especifico) as any;
            nombre_equipo_especifico = equipo?.nombre_equipo;
          } else if (cat.includes('compactador')) {
            const equipo = db.prepare('SELECT nombre_equipo FROM compactador WHERE id_compactador = ?').get(row.id_equipo_especifico) as any;
            nombre_equipo_especifico = equipo?.nombre_equipo;
          } else if (cat.includes('rompedor')) {
            const equipo = db.prepare('SELECT nombre_equipo FROM rompedor WHERE id_rompedor = ?').get(row.id_equipo_especifico) as any;
            nombre_equipo_especifico = equipo?.nombre_equipo;
          } else if (cat.includes('vibrador')) {
            // Intentar primero con nombre_equipo, si falla usar nombre_vibrador
            try {
              const equipo = db.prepare('SELECT nombre_equipo FROM vibrador WHERE id_vibrador = ?').get(row.id_equipo_especifico) as any;
              nombre_equipo_especifico = equipo?.nombre_equipo;
            } catch {
              const equipo = db.prepare('SELECT nombre_vibrador as nombre_equipo FROM vibrador WHERE id_vibrador = ?').get(row.id_equipo_especifico) as any;
              nombre_equipo_especifico = equipo?.nombre_equipo;
            }
          } else if (cat.includes('puntal')) {
            // Intentar primero con nombre_equipo, si falla usar nombre_puntal
            try {
              const equipo = db.prepare('SELECT nombre_equipo FROM puntal WHERE id_puntal = ?').get(row.id_equipo_especifico) as any;
              nombre_equipo_especifico = equipo?.nombre_equipo;
            } catch {
              const equipo = db.prepare('SELECT nombre_puntal as nombre_equipo FROM puntal WHERE id_puntal = ?').get(row.id_equipo_especifico) as any;
              nombre_equipo_especifico = equipo?.nombre_equipo;
            }
          }
        } catch (error) {
          console.error(`Error obteniendo equipo específico para ${cat}:`, error);
        }
      }
      
      return { ...row, nombre_equipo_especifico };
    });
    
    return enrichedRows;
  },

  getById: (id: number) => {
    const row = db.prepare(`
      SELECT equipo.*, 
        categoria_equipo.nombre as nombre_categoria
      FROM equipo 
      LEFT JOIN categoria_equipo ON equipo.id_equipo_categoria = categoria_equipo.id
      WHERE equipo.id_equipo = ?
    `).get(id) as (Equipo & { nombre_categoria?: string; nombre_estado?: string }) | undefined;
    return row;
  },

  getByCategoria: (categoriaId: number) => {
    const rows = db.prepare(`
      SELECT equipo.*, 
        categoria_equipo.nombre as nombre_categoria
      FROM equipo 
      LEFT JOIN categoria_equipo ON equipo.id_equipo_categoria = categoria_equipo.id
      WHERE equipo.id_equipo_categoria = ?
    `).all(categoriaId) as (Equipo & { nombre_categoria?: string; nombre_estado?: string })[];
    return rows;
  },

  getByEstado: (estadoId: number) => {
    const rows = db.prepare(`
      SELECT equipo.*, 
        categoria_equipo.nombre as nombre_categoria
      FROM equipo 
      LEFT JOIN categoria_equipo ON equipo.id_equipo_categoria = categoria_equipo.id
      WHERE equipo.id_estado_equipo = ?
    `).all(estadoId) as (Equipo & { nombre_categoria?: string; nombre_estado?: string })[];
    return rows;
  },

  create: (equipo: Equipo) => {
    const stmt = db.prepare(`
      INSERT INTO equipo (
        cantidad_equipo, 
        nombre_equipo, 
        id_equipo_categoria,
        id_estado_equipo,
        id_equipo_especifico,
        cantidad_disponible,
        cantidad_alquilado,
        cantidad_en_transito,
        cantidad_en_recoleccion,
        cantidad_en_mantenimiento,
        cantidad_reservado
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Distribuir la cantidad según el estado seleccionado
    let cantDisponible = 0;
    let cantAlquilado = 0;
    let cantEnTransito = 0;
    let cantEnRecoleccion = 0;
    let cantEnMantenimiento = 0;
    let cantReservado = 0;
    
    const cantidad = equipo.cantidad_equipo;
    const estado = equipo.id_estado_equipo;
    
    switch (estado) {
      case EstadoEquipo.DISPONIBLE:
        cantDisponible = cantidad;
        break;
      case EstadoEquipo.RESERVADO:
        cantReservado = cantidad;
        break;
      case EstadoEquipo.ASIGNADO:
        cantAlquilado = cantidad;
        break;
      case EstadoEquipo.EN_RECOLECCION:
        cantEnRecoleccion = cantidad;
        break;
      case EstadoEquipo.EN_MANTENIMIENTO:
        cantEnMantenimiento = cantidad;
        break;
      case EstadoEquipo.NO_DISPONIBLE:
        // No se asigna a ninguna columna, queda en 0
        break;
      default:
        // Si no se especifica estado, por defecto está disponible
        cantDisponible = cantidad;
    }
    
    const result = stmt.run(
      equipo.cantidad_equipo,
      equipo.nombre_equipo,
      equipo.id_equipo_categoria || null,
      equipo.id_estado_equipo || EstadoEquipo.DISPONIBLE,
      equipo.id_equipo_especifico || null,
      cantDisponible,
      cantAlquilado,
      cantEnTransito,
      cantEnRecoleccion,
      cantEnMantenimiento,
      cantReservado
    );
    return result.lastInsertRowid;
  },

  update: (id: number, equipo: Partial<Equipo>) => {
    const fields = [];
    const values = [];

    // Obtener el equipo actual
    const equipoActual = db.prepare('SELECT * FROM equipo WHERE id_equipo = ?').get(id) as Equipo;
    
    if (!equipoActual) {
      throw new Error('Equipo no encontrado');
    }

    // Verificar si cambia el estado
    const cambiaEstado = equipo.id_estado_equipo !== undefined && equipo.id_estado_equipo !== equipoActual.id_estado_equipo;
    const cambiaCantidad = equipo.cantidad_equipo !== undefined && equipo.cantidad_equipo !== equipoActual.cantidad_equipo;

    // Si cambia el estado o la cantidad, redistribuir las cantidades por estado
    if (cambiaEstado || cambiaCantidad) {
      const nuevoEstado = equipo.id_estado_equipo ?? equipoActual.id_estado_equipo;
      const nuevaCantidad = equipo.cantidad_equipo ?? equipoActual.cantidad_equipo;
      
      // Resetear todas las cantidades
      let cantDisponible = 0;
      let cantAlquilado = 0;
      let cantEnTransito = 0;
      let cantEnRecoleccion = 0;
      let cantEnMantenimiento = 0;
      let cantReservado = 0;
      
      // Asignar la cantidad total al estado correspondiente
      switch (nuevoEstado) {
        case EstadoEquipo.DISPONIBLE:
          cantDisponible = nuevaCantidad;
          break;
        case EstadoEquipo.RESERVADO:
          cantReservado = nuevaCantidad;
          break;
        case EstadoEquipo.ASIGNADO:
          cantAlquilado = nuevaCantidad;
          break;
        case EstadoEquipo.EN_RECOLECCION:
          cantEnRecoleccion = nuevaCantidad;
          break;
        case EstadoEquipo.EN_MANTENIMIENTO:
          cantEnMantenimiento = nuevaCantidad;
          break;
        case EstadoEquipo.NO_DISPONIBLE:
          // No se asigna a ninguna columna
          break;
        default:
          cantDisponible = nuevaCantidad;
      }
      
      // Actualizar todas las cantidades por estado
      fields.push('cantidad_equipo = ?');
      values.push(nuevaCantidad);
      fields.push('cantidad_disponible = ?');
      values.push(cantDisponible);
      fields.push('cantidad_alquilado = ?');
      values.push(cantAlquilado);
      fields.push('cantidad_en_transito = ?');
      values.push(cantEnTransito);
      fields.push('cantidad_en_recoleccion = ?');
      values.push(cantEnRecoleccion);
      fields.push('cantidad_en_mantenimiento = ?');
      values.push(cantEnMantenimiento);
      fields.push('cantidad_reservado = ?');
      values.push(cantReservado);
    }
    
    if (equipo.nombre_equipo) {
      fields.push('nombre_equipo = ?');
      values.push(equipo.nombre_equipo);
    }
    if (equipo.id_equipo_categoria !== undefined) {
      fields.push('id_equipo_categoria = ?');
      values.push(equipo.id_equipo_categoria);
    }
    if (equipo.id_estado_equipo !== undefined && !cambiaEstado && !cambiaCantidad) {
      // Si solo se actualiza el estado sin cambiar cantidad (caso edge)
      fields.push('id_estado_equipo = ?');
      values.push(equipo.id_estado_equipo);
    } else if (cambiaEstado || cambiaCantidad) {
      // Ya se procesó arriba, solo actualizar el campo
      fields.push('id_estado_equipo = ?');
      values.push(equipo.id_estado_equipo ?? equipoActual.id_estado_equipo);
    }
    if (equipo.id_equipo_especifico !== undefined) {
      fields.push('id_equipo_especifico = ?');
      values.push(equipo.id_equipo_especifico);
    }
    
    // Permitir actualizar cantidades por estado manualmente si se especifican explícitamente
    // (esto sobrescribirá la lógica automática si es necesario)
    if (!cambiaEstado && !cambiaCantidad) {
      if (equipo.cantidad_disponible !== undefined) {
        fields.push('cantidad_disponible = ?');
        values.push(equipo.cantidad_disponible);
      }
      if (equipo.cantidad_alquilado !== undefined) {
        fields.push('cantidad_alquilado = ?');
        values.push(equipo.cantidad_alquilado);
      }
      if (equipo.cantidad_en_transito !== undefined) {
        fields.push('cantidad_en_transito = ?');
        values.push(equipo.cantidad_en_transito);
      }
      if (equipo.cantidad_en_recoleccion !== undefined) {
        fields.push('cantidad_en_recoleccion = ?');
        values.push(equipo.cantidad_en_recoleccion);
      }
      if (equipo.cantidad_en_mantenimiento !== undefined) {
        fields.push('cantidad_en_mantenimiento = ?');
        values.push(equipo.cantidad_en_mantenimiento);
      }
      if (equipo.cantidad_reservado !== undefined) {
        fields.push('cantidad_reservado = ?');
        values.push(equipo.cantidad_reservado);
      }
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE equipo SET ${fields.join(', ')} WHERE id_equipo = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM equipo WHERE id_equipo = ?').run(id);
  },
};

export interface Mezcladora {
  id_mezcladora?: number;
  nombre_equipo?: string;
  capacidad_mezcladora?: string;
  voltaje_mezcladora?: string;
  chasis_mezcladora?: string;
  estado_mezcladora?: number;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
  created_at?: string;
  updated_at?: string;
}

export const mezcladoraModel = {
  getAll: () => {
    return db.prepare('SELECT * FROM mezcladora').all();
  },

  getById: (id: number) => {
    return db.prepare('SELECT * FROM mezcladora WHERE id_mezcladora = ?').get(id);
  },

  create: (mezcladora: Mezcladora) => {
    const stmt = db.prepare(`
      INSERT INTO mezcladora (nombre_equipo, capacidad_mezcladora, voltaje_mezcladora, chasis_mezcladora, estado_mezcladora, precio_equipo, precio_mes, precio_quincena, precio_semana, precio_dia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const estadoValue = typeof mezcladora.estado_mezcladora === 'boolean' 
      ? (mezcladora.estado_mezcladora ? 1 : 0)
      : (mezcladora.estado_mezcladora ?? 1);
    const result = stmt.run(
      mezcladora.nombre_equipo || null,
      mezcladora.capacidad_mezcladora || null,
      mezcladora.voltaje_mezcladora || null,
      mezcladora.chasis_mezcladora || null,
      estadoValue,
      mezcladora.precio_equipo || null,
      mezcladora.precio_mes || null,
      mezcladora.precio_quincena || null,
      mezcladora.precio_semana || null,
      mezcladora.precio_dia || null
    );
    return result.lastInsertRowid;
  },

  update: (id: number, mezcladora: Partial<Mezcladora>) => {
    const fields = [];
    const values = [];

    if (mezcladora.nombre_equipo !== undefined) {
      fields.push('nombre_equipo = ?');
      values.push(mezcladora.nombre_equipo);
    }
    if (mezcladora.capacidad_mezcladora !== undefined) {
      fields.push('capacidad_mezcladora = ?');
      values.push(mezcladora.capacidad_mezcladora);
    }
    if (mezcladora.voltaje_mezcladora !== undefined) {
      fields.push('voltaje_mezcladora = ?');
      values.push(mezcladora.voltaje_mezcladora);
    }
    if (mezcladora.chasis_mezcladora !== undefined) {
      fields.push('chasis_mezcladora = ?');
      values.push(mezcladora.chasis_mezcladora);
    }
    if (mezcladora.estado_mezcladora !== undefined) {
      fields.push('estado_mezcladora = ?');
      values.push(mezcladora.estado_mezcladora);
    }
    if (mezcladora.precio_equipo !== undefined) {
      fields.push('precio_equipo = ?');
      values.push(mezcladora.precio_equipo);
    }
    if (mezcladora.precio_mes !== undefined) {
      fields.push('precio_mes = ?');
      values.push(mezcladora.precio_mes);
    }
    if (mezcladora.precio_quincena !== undefined) {
      fields.push('precio_quincena = ?');
      values.push(mezcladora.precio_quincena);
    }
    if (mezcladora.precio_semana !== undefined) {
      fields.push('precio_semana = ?');
      values.push(mezcladora.precio_semana);
    }
    if (mezcladora.precio_dia !== undefined) {
      fields.push('precio_dia = ?');
      values.push(mezcladora.precio_dia);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE mezcladora SET ${fields.join(', ')} WHERE id_mezcladora = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM mezcladora WHERE id_mezcladora = ?').run(id);
  },
};

export interface Andamio {
  id_andamio?: number;
  ancho_andamio: string;
  largo_andamio: string;
  nombre_equipo?: string;
  estado_andamio?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
  created_at?: string;
  updated_at?: string;
}

export const andamioModel = {
  getAll: () => {
    return db.prepare('SELECT * FROM andamio').all();
  },

  getById: (id: number) => {
    return db.prepare('SELECT * FROM andamio WHERE id_andamio = ?').get(id);
  },

  create: (andamio: Andamio) => {
    const stmt = db.prepare(`
      INSERT INTO andamio (ancho_andamio, largo_andamio, nombre_equipo, estado_andamio, precio_equipo, precio_mes, precio_quincena, precio_semana, precio_dia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      andamio.ancho_andamio,
      andamio.largo_andamio,
      andamio.nombre_equipo || null,
      andamio.estado_andamio ? 1 : 0,
      andamio.precio_equipo || null,
      andamio.precio_mes || null,
      andamio.precio_quincena || null,
      andamio.precio_semana || null,
      andamio.precio_dia || null
    );
  },

  update: (id: number, andamio: Partial<Andamio>) => {
    const fields = [];
    const values = [];

    if (andamio.ancho_andamio) {
      fields.push('ancho_andamio = ?');
      values.push(andamio.ancho_andamio);
    }
    if (andamio.largo_andamio) {
      fields.push('largo_andamio = ?');
      values.push(andamio.largo_andamio);
    }
    if (andamio.nombre_equipo !== undefined) {
      fields.push('nombre_equipo = ?');
      values.push(andamio.nombre_equipo);
    }
    if (andamio.estado_andamio !== undefined) {
      fields.push('estado_andamio = ?');
      values.push(andamio.estado_andamio ? 1 : 0);
    }
    if (andamio.precio_equipo !== undefined) {
      fields.push('precio_equipo = ?');
      values.push(andamio.precio_equipo);
    }
    if (andamio.precio_mes !== undefined) {
      fields.push('precio_mes = ?');
      values.push(andamio.precio_mes);
    }
    if (andamio.precio_quincena !== undefined) {
      fields.push('precio_quincena = ?');
      values.push(andamio.precio_quincena);
    }
    if (andamio.precio_semana !== undefined) {
      fields.push('precio_semana = ?');
      values.push(andamio.precio_semana);
    }
    if (andamio.precio_dia !== undefined) {
      fields.push('precio_dia = ?');
      values.push(andamio.precio_dia);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE andamio SET ${fields.join(', ')} WHERE id_andamio = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM andamio WHERE id_andamio = ?').run(id);
  },
};

export interface Compactador {
  id_compactador?: number;
  nombre_equipo: string;
  descripcion_equipo?: string;
  estado_equipo?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
  created_at?: string;
  updated_at?: string;
}

export const compactadorModel = {
  getAll: () => {
    return db.prepare('SELECT * FROM compactador').all();
  },

  getById: (id: number) => {
    return db.prepare('SELECT * FROM compactador WHERE id_compactador = ?').get(id);
  },

  create: (compactador: Compactador) => {
    const stmt = db.prepare(`
      INSERT INTO compactador (nombre_equipo, descripcion_equipo, estado_equipo, precio_equipo, precio_mes, precio_quincena, precio_semana, precio_dia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      compactador.nombre_equipo,
      compactador.descripcion_equipo || null,
      compactador.estado_equipo ? 1 : 0,
      compactador.precio_equipo || null,
      compactador.precio_mes || null,
      compactador.precio_quincena || null,
      compactador.precio_semana || null,
      compactador.precio_dia || null
    );
  },

  update: (id: number, compactador: Partial<Compactador>) => {
    const fields = [];
    const values = [];

    if (compactador.nombre_equipo) {
      fields.push('nombre_equipo = ?');
      values.push(compactador.nombre_equipo);
    }
    if (compactador.descripcion_equipo !== undefined) {
      fields.push('descripcion_equipo = ?');
      values.push(compactador.descripcion_equipo);
    }
    if (compactador.estado_equipo !== undefined) {
      fields.push('estado_equipo = ?');
      values.push(compactador.estado_equipo ? 1 : 0);
    }
    if (compactador.precio_equipo !== undefined) {
      fields.push('precio_equipo = ?');
      values.push(compactador.precio_equipo);
    }
    if (compactador.precio_mes !== undefined) {
      fields.push('precio_mes = ?');
      values.push(compactador.precio_mes);
    }
    if (compactador.precio_quincena !== undefined) {
      fields.push('precio_quincena = ?');
      values.push(compactador.precio_quincena);
    }
    if (compactador.precio_semana !== undefined) {
      fields.push('precio_semana = ?');
      values.push(compactador.precio_semana);
    }
    if (compactador.precio_dia !== undefined) {
      fields.push('precio_dia = ?');
      values.push(compactador.precio_dia);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE compactador SET ${fields.join(', ')} WHERE id_compactador = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM compactador WHERE id_compactador = ?').run(id);
  },
};

export interface Rompedor {
  id_rompedor?: number;
  nombre_equipo?: string;
  capacidad_rompedor?: string;
  voltaje_rompedor?: string;
  estado_rompedor?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
  created_at?: string;
  updated_at?: string;
}

export const rompedorModel = {
  getAll: () => {
    return db.prepare('SELECT * FROM rompedor').all();
  },

  getById: (id: number) => {
    return db.prepare('SELECT * FROM rompedor WHERE id_rompedor = ?').get(id);
  },

  create: (rompedor: Rompedor) => {
    const stmt = db.prepare(`
      INSERT INTO rompedor (nombre_equipo, capacidad_rompedor, voltaje_rompedor, estado_rompedor, precio_equipo, precio_mes, precio_quincena, precio_semana, precio_dia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      rompedor.nombre_equipo || null,
      rompedor.capacidad_rompedor || null,
      rompedor.voltaje_rompedor || null,
      rompedor.estado_rompedor ? 1 : 0,
      rompedor.precio_equipo || null,
      rompedor.precio_mes || null,
      rompedor.precio_quincena || null,
      rompedor.precio_semana || null,
      rompedor.precio_dia || null
    );
  },

  update: (id: number, rompedor: Partial<Rompedor>) => {
    const fields = [];
    const values = [];

    if (rompedor.nombre_equipo !== undefined) {
      fields.push('nombre_equipo = ?');
      values.push(rompedor.nombre_equipo);
    }
    if (rompedor.capacidad_rompedor !== undefined) {
      fields.push('capacidad_rompedor = ?');
      values.push(rompedor.capacidad_rompedor);
    }
    if (rompedor.voltaje_rompedor !== undefined) {
      fields.push('voltaje_rompedor = ?');
      values.push(rompedor.voltaje_rompedor);
    }
    if (rompedor.estado_rompedor !== undefined) {
      fields.push('estado_rompedor = ?');
      values.push(rompedor.estado_rompedor ? 1 : 0);
    }
    if (rompedor.precio_equipo !== undefined) {
      fields.push('precio_equipo = ?');
      values.push(rompedor.precio_equipo);
    }
    if (rompedor.precio_mes !== undefined) {
      fields.push('precio_mes = ?');
      values.push(rompedor.precio_mes);
    }
    if (rompedor.precio_quincena !== undefined) {
      fields.push('precio_quincena = ?');
      values.push(rompedor.precio_quincena);
    }
    if (rompedor.precio_semana !== undefined) {
      fields.push('precio_semana = ?');
      values.push(rompedor.precio_semana);
    }
    if (rompedor.precio_dia !== undefined) {
      fields.push('precio_dia = ?');
      values.push(rompedor.precio_dia);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE rompedor SET ${fields.join(', ')} WHERE id_rompedor = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM rompedor WHERE id_rompedor = ?').run(id);
  },
};

export interface Vibrador {
  id_vibrador?: number;
  nombre_vibrador: string;
  descripcion_vibrador?: string;
  voltaje_vibrador?: string;
  estado_vibrador?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Puntal {
  id_puntal?: number;
  nombre_puntal: string;
  largo_puntal?: string;
  estado_puntal?: boolean;
  precio_equipo?: number;
  precio_mes?: number;
  precio_quincena?: number;
  precio_semana?: number;
  precio_dia?: number;
  created_at?: string;
  updated_at?: string;
}

export const vibradorModel = {
  getAll: () => {
    return db.prepare('SELECT * FROM vibrador').all();
  },

  getById: (id: number) => {
    return db.prepare('SELECT * FROM vibrador WHERE id_vibrador = ?').get(id);
  },

  create: (vibrador: Vibrador) => {
    const stmt = db.prepare(`
      INSERT INTO vibrador (nombre_vibrador, descripcion_vibrador, voltaje_vibrador, estado_vibrador, precio_equipo, precio_mes, precio_quincena, precio_semana, precio_dia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      vibrador.nombre_vibrador,
      vibrador.descripcion_vibrador || null,
      vibrador.voltaje_vibrador || null,
      vibrador.estado_vibrador ? 1 : 0,
      vibrador.precio_equipo || null,
      vibrador.precio_mes || null,
      vibrador.precio_quincena || null,
      vibrador.precio_semana || null,
      vibrador.precio_dia || null
    );
  },

  update: (id: number, vibrador: Partial<Vibrador>) => {
    const fields = [];
    const values = [];

    if (vibrador.nombre_vibrador) {
      fields.push('nombre_vibrador = ?');
      values.push(vibrador.nombre_vibrador);
    }
    if (vibrador.descripcion_vibrador !== undefined) {
      fields.push('descripcion_vibrador = ?');
      values.push(vibrador.descripcion_vibrador);
    }
    if (vibrador.voltaje_vibrador !== undefined) {
      fields.push('voltaje_vibrador = ?');
      values.push(vibrador.voltaje_vibrador);
    }
    if (vibrador.estado_vibrador !== undefined) {
      fields.push('estado_vibrador = ?');
      values.push(vibrador.estado_vibrador ? 1 : 0);
    }
    if (vibrador.precio_equipo !== undefined) {
      fields.push('precio_equipo = ?');
      values.push(vibrador.precio_equipo);
    }
    if (vibrador.precio_mes !== undefined) {
      fields.push('precio_mes = ?');
      values.push(vibrador.precio_mes);
    }
    if (vibrador.precio_quincena !== undefined) {
      fields.push('precio_quincena = ?');
      values.push(vibrador.precio_quincena);
    }
    if (vibrador.precio_semana !== undefined) {
      fields.push('precio_semana = ?');
      values.push(vibrador.precio_semana);
    }
    if (vibrador.precio_dia !== undefined) {
      fields.push('precio_dia = ?');
      values.push(vibrador.precio_dia);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE vibrador SET ${fields.join(', ')} WHERE id_vibrador = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM vibrador WHERE id_vibrador = ?').run(id);
  },
};

export const puntalModel = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM puntal').all() as any[];
    return rows.map(row => ({
      ...row,
      nombre_puntal: row.nombre_equipo
    }));
  },

  getById: (id: number) => {
    const row = db.prepare('SELECT * FROM puntal WHERE id_puntal = ?').get(id) as any;
    if (row) {
      return {
        ...row,
        nombre_puntal: row.nombre_equipo
      };
    }
    return row;
  },

  create: (puntal: Puntal) => {
    const stmt = db.prepare(`
      INSERT INTO puntal (nombre_equipo, largo_puntal, estado_puntal, precio_equipo, precio_mes, precio_quincena, precio_semana, precio_dia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      puntal.nombre_puntal,
      puntal.largo_puntal || null,
      puntal.estado_puntal ? 1 : 0,
      puntal.precio_equipo || null,
      puntal.precio_mes || null,
      puntal.precio_quincena || null,
      puntal.precio_semana || null,
      puntal.precio_dia || null
    );
  },

  update: (id: number, puntal: Partial<Puntal>) => {
    const fields = [];
    const values = [];

    if (puntal.nombre_puntal) {
      fields.push('nombre_equipo = ?');
      values.push(puntal.nombre_puntal);
    }
    if (puntal.largo_puntal !== undefined) {
      fields.push('largo_puntal = ?');
      values.push(puntal.largo_puntal);
    }
    if (puntal.estado_puntal !== undefined) {
      fields.push('estado_puntal = ?');
      values.push(puntal.estado_puntal ? 1 : 0);
    }
    if (puntal.precio_equipo !== undefined) {
      fields.push('precio_equipo = ?');
      values.push(puntal.precio_equipo);
    }
    if (puntal.precio_mes !== undefined) {
      fields.push('precio_mes = ?');
      values.push(puntal.precio_mes);
    }
    if (puntal.precio_quincena !== undefined) {
      fields.push('precio_quincena = ?');
      values.push(puntal.precio_quincena);
    }
    if (puntal.precio_semana !== undefined) {
      fields.push('precio_semana = ?');
      values.push(puntal.precio_semana);
    }
    if (puntal.precio_dia !== undefined) {
      fields.push('precio_dia = ?');
      values.push(puntal.precio_dia);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE puntal SET ${fields.join(', ')} WHERE id_puntal = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM puntal WHERE id_puntal = ?').run(id);
  },
};

// Funciones CRUD para EncabezadoSolicitudEquipo
export const encabezadoSolicitudEquipoModel = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM encabezado_solicitud_equipo').all() as any[];
    return rows.map(row => ({
      ...row,
      pago_envio: row.pago_envio === 1,
      usa_factura: row.usa_factura === 1
    })) as EncabezadoSolicitudEquipo[];
  },

  getById: (id: number) => {
    const row = db.prepare('SELECT * FROM encabezado_solicitud_equipo WHERE id_solicitud_equipo = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      pago_envio: row.pago_envio === 1,
      usa_factura: row.usa_factura === 1
    } as EncabezadoSolicitudEquipo;
  },

  create: (solicitudEquipo: EncabezadoSolicitudEquipo) => {
    const stmt = db.prepare(`
      INSERT INTO encabezado_solicitud_equipo (
        numero_solicitud_equipo,
        id_cliente,
        fecha_elaboracion,
        fecha_inicio,
        fecha_vencimiento,
        nombre_recibe,
        cedula_recibe,
        telefono_recibe,
        precio_total_equipos,
        provincia_solicitud_equipo,
        canton_solicitud_equipo,
        distrito_solicitud_equipo,
        otras_senas_solicitud_equipo,
        observaciones_solicitud_equipo,
        pago_envio,
        monto_envio,
        usa_factura,
        subtotal_solicitud_equipo,
        descuento_solicitud_equipo,
        total_solicitud_equipo,
        iva_solicitud_equipo,
        estado_solicitud_equipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      solicitudEquipo.numero_solicitud_equipo || null,
      solicitudEquipo.id_cliente || null,
      solicitudEquipo.fecha_elaboracion || null,
      solicitudEquipo.fecha_inicio || null,
      solicitudEquipo.fecha_vencimiento || null,
      solicitudEquipo.nombre_recibe || null,
      solicitudEquipo.cedula_recibe || null,
      solicitudEquipo.telefono_recibe || null,
      solicitudEquipo.precio_total_equipos || null,
      solicitudEquipo.provincia_solicitud_equipo || null,
      solicitudEquipo.canton_solicitud_equipo || null,
      solicitudEquipo.distrito_solicitud_equipo || null,
      solicitudEquipo.otras_senas_solicitud_equipo || null,
      solicitudEquipo.observaciones_solicitud_equipo || null,
      solicitudEquipo.pago_envio ? 1 : 0,
      solicitudEquipo.monto_envio || null,
      solicitudEquipo.usa_factura ? 1 : 0,
      solicitudEquipo.subtotal_solicitud_equipo || null,
      solicitudEquipo.descuento_solicitud_equipo || null,
      solicitudEquipo.total_solicitud_equipo || null,
      solicitudEquipo.iva_solicitud_equipo || null,
      solicitudEquipo.estado_solicitud_equipo || 1
    );
    return result.lastInsertRowid;
  },

  update: (id: number, solicitudEquipo: Partial<EncabezadoSolicitudEquipo>) => {
    const fields = [];
    const values = [];

    if (solicitudEquipo.numero_solicitud_equipo !== undefined) {
      fields.push('numero_solicitud_equipo = ?');
      values.push(solicitudEquipo.numero_solicitud_equipo);
    }
    if (solicitudEquipo.id_cliente !== undefined) {
      fields.push('id_cliente = ?');
      values.push(solicitudEquipo.id_cliente);
    }
    if (solicitudEquipo.fecha_elaboracion !== undefined) {
      fields.push('fecha_elaboracion = ?');
      values.push(solicitudEquipo.fecha_elaboracion);
    }
    if (solicitudEquipo.fecha_inicio !== undefined) {
      fields.push('fecha_inicio = ?');
      values.push(solicitudEquipo.fecha_inicio);
    }
    if (solicitudEquipo.fecha_vencimiento !== undefined) {
      fields.push('fecha_vencimiento = ?');
      values.push(solicitudEquipo.fecha_vencimiento);
    }
    if (solicitudEquipo.nombre_recibe !== undefined) {
      fields.push('nombre_recibe = ?');
      values.push(solicitudEquipo.nombre_recibe);
    }
    if (solicitudEquipo.cedula_recibe !== undefined) {
      fields.push('cedula_recibe = ?');
      values.push(solicitudEquipo.cedula_recibe);
    }
    if (solicitudEquipo.telefono_recibe !== undefined) {
      fields.push('telefono_recibe = ?');
      values.push(solicitudEquipo.telefono_recibe);
    }
    if (solicitudEquipo.precio_total_equipos !== undefined) {
      fields.push('precio_total_equipos = ?');
      values.push(solicitudEquipo.precio_total_equipos);
    }
    if (solicitudEquipo.provincia_solicitud_equipo !== undefined) {
      fields.push('provincia_solicitud_equipo = ?');
      values.push(solicitudEquipo.provincia_solicitud_equipo);
    }
    if (solicitudEquipo.canton_solicitud_equipo !== undefined) {
      fields.push('canton_solicitud_equipo = ?');
      values.push(solicitudEquipo.canton_solicitud_equipo);
    }
    if (solicitudEquipo.distrito_solicitud_equipo !== undefined) {
      fields.push('distrito_solicitud_equipo = ?');
      values.push(solicitudEquipo.distrito_solicitud_equipo);
    }
    if (solicitudEquipo.otras_senas_solicitud_equipo !== undefined) {
      fields.push('otras_senas_solicitud_equipo = ?');
      values.push(solicitudEquipo.otras_senas_solicitud_equipo);
    }
    if (solicitudEquipo.observaciones_solicitud_equipo !== undefined) {
      fields.push('observaciones_solicitud_equipo = ?');
      values.push(solicitudEquipo.observaciones_solicitud_equipo);
    }
    if (solicitudEquipo.pago_envio !== undefined) {
      fields.push('pago_envio = ?');
      values.push(solicitudEquipo.pago_envio ? 1 : 0);
    }
    if (solicitudEquipo.monto_envio !== undefined) {
      fields.push('monto_envio = ?');
      values.push(solicitudEquipo.monto_envio);
    }
    if (solicitudEquipo.usa_factura !== undefined) {
      fields.push('usa_factura = ?');
      values.push(solicitudEquipo.usa_factura ? 1 : 0);
    }
    if (solicitudEquipo.subtotal_solicitud_equipo !== undefined) {
      fields.push('subtotal_solicitud_equipo = ?');
      values.push(solicitudEquipo.subtotal_solicitud_equipo);
    }
    if (solicitudEquipo.descuento_solicitud_equipo !== undefined) {
      fields.push('descuento_solicitud_equipo = ?');
      values.push(solicitudEquipo.descuento_solicitud_equipo);
    }
    if (solicitudEquipo.total_solicitud_equipo !== undefined) {
      fields.push('total_solicitud_equipo = ?');
      values.push(solicitudEquipo.total_solicitud_equipo);
    }
    if (solicitudEquipo.iva_solicitud_equipo !== undefined) {
      fields.push('iva_solicitud_equipo = ?');
      values.push(solicitudEquipo.iva_solicitud_equipo);
    }
    if (solicitudEquipo.estado_solicitud_equipo !== undefined) {
      fields.push('estado_solicitud_equipo = ?');
      values.push(solicitudEquipo.estado_solicitud_equipo);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE encabezado_solicitud_equipo SET ${fields.join(', ')} WHERE id_solicitud_equipo = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM encabezado_solicitud_equipo WHERE id_solicitud_equipo = ?').run(id);
  },
};

// Funciones CRUD para DetalleSolicitudEquipo
export const detalleSolicitudEquipoModel = {
  getAll: () => {
    return db.prepare('SELECT * FROM detalle_solicitud_equipo').all() as DetalleSolicitudEquipo[];
  },

  getById: (id: number) => {
    return db.prepare('SELECT * FROM detalle_solicitud_equipo WHERE id_detalle_solicitud_equipo = ?').get(id) as DetalleSolicitudEquipo;
  },

  getByNumeroSolicitudEquipo: (numeroSolicitudEquipo: string) => {
    return db.prepare('SELECT * FROM detalle_solicitud_equipo WHERE numero_solicitud_equipo = ?').all(numeroSolicitudEquipo) as DetalleSolicitudEquipo[];
  },

  getDetallesByNumeroSolicitud: (numeroSolicitudEquipo: string) => {
    const detalles = db.prepare(`
      SELECT 
        d.*,
        e.nombre_equipo
      FROM detalle_solicitud_equipo d
      LEFT JOIN equipo e ON d.id_equipo = e.id_equipo
      WHERE d.numero_solicitud_equipo = ?
    `).all(numeroSolicitudEquipo) as any[];
    
    return detalles;
  },

  getDetallesByIdSolicitud: (idSolicitudEquipo: number) => {
    const detalles = db.prepare(`
      SELECT 
        d.*,
        e.nombre_equipo
      FROM detalle_solicitud_equipo d
      LEFT JOIN equipo e ON d.id_equipo = e.id_equipo
      LEFT JOIN encabezado_solicitud_equipo se ON d.numero_solicitud_equipo = se.numero_solicitud_equipo
      WHERE se.id_solicitud_equipo = ?
    `).all(idSolicitudEquipo) as any[];
    
    return detalles;
  },

  create: (detalle: DetalleSolicitudEquipo) => {
    const stmt = db.prepare(`
      INSERT INTO detalle_solicitud_equipo (
        numero_solicitud_equipo,
        id_equipo,
        cantidad_equipo,
        periodicidad,
        cantidad_periodicidad,
        iva_detalle,
        subtotal_detalle,
        monto_descuento,
        monto_final,
        fecha_devolucion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      detalle.numero_solicitud_equipo || null,
      detalle.id_equipo || null,
      detalle.cantidad_equipo || null,
      detalle.periodicidad || null,
      detalle.cantidad_periodicidad || null,
      detalle.iva_detalle || null,
      detalle.subtotal_detalle || null,
      detalle.monto_descuento || null,
      detalle.monto_final || null,
      detalle.fecha_devolucion || null
    );
    return result.lastInsertRowid;
  },

  update: (id: number, detalle: Partial<DetalleSolicitudEquipo>) => {
    const fields = [];
    const values = [];

    if (detalle.numero_solicitud_equipo !== undefined) {
      fields.push('numero_solicitud_equipo = ?');
      values.push(detalle.numero_solicitud_equipo);
    }
    if (detalle.id_equipo !== undefined) {
      fields.push('id_equipo = ?');
      values.push(detalle.id_equipo);
    }
    if (detalle.cantidad_equipo !== undefined) {
      fields.push('cantidad_equipo = ?');
      values.push(detalle.cantidad_equipo);
    }
    if (detalle.periodicidad !== undefined) {
      fields.push('periodicidad = ?');
      values.push(detalle.periodicidad);
    }
    if (detalle.cantidad_periodicidad !== undefined) {
      fields.push('cantidad_periodicidad = ?');
      values.push(detalle.cantidad_periodicidad);
    }
    if (detalle.iva_detalle !== undefined) {
      fields.push('iva_detalle = ?');
      values.push(detalle.iva_detalle);
    }
    if (detalle.subtotal_detalle !== undefined) {
      fields.push('subtotal_detalle = ?');
      values.push(detalle.subtotal_detalle);
    }
    if (detalle.monto_descuento !== undefined) {
      fields.push('monto_descuento = ?');
      values.push(detalle.monto_descuento);
    }
    if (detalle.monto_final !== undefined) {
      fields.push('monto_final = ?');
      values.push(detalle.monto_final);
    }
    if (detalle.fecha_devolucion !== undefined) {
      fields.push('fecha_devolucion = ?');
      values.push(detalle.fecha_devolucion);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE detalle_solicitud_equipo SET ${fields.join(', ')} WHERE id_detalle_solicitud_equipo = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: number) => {
    return db.prepare('DELETE FROM detalle_solicitud_equipo WHERE id_detalle_solicitud_equipo = ?').run(id);
  },

  deleteByNumeroSolicitudEquipo: (numeroSolicitudEquipo: string) => {
    return db.prepare('DELETE FROM detalle_solicitud_equipo WHERE numero_solicitud_equipo = ?').run(numeroSolicitudEquipo);
  },
};

// ==================== CONTRATO ====================
export interface Contrato {
  id_contrato?: number;
  id_solicitud_equipo: number;
  estado: number;
  created_at?: string;
  updated_at?: string;
}

export const contratoModel = {
  generarContrato: async (id_solicitud_equipo: number) => {
    const transaction = db.transaction(() => {
      // 1. Obtener información de la solicitud
      const solicitud = db.prepare(`
        SELECT * FROM encabezado_solicitud_equipo WHERE id_solicitud_equipo = ?
      `).get(id_solicitud_equipo) as any;

      if (!solicitud) {
        throw new Error('Solicitud no encontrada');
      }

      // Verificar que la solicitud esté en estado SOLICITUD
      if (solicitud.estado_solicitud_equipo !== EstadoSolicitudEquipo.SOLICITUD) {
        throw new Error('Solo se pueden generar contratos para solicitudes en estado SOLICITUD');
      }

      // 2. Obtener los detalles de la solicitud
      const detalles = db.prepare(`
        SELECT * FROM detalle_solicitud_equipo WHERE numero_solicitud_equipo = ?
      `).all(solicitud.numero_solicitud_equipo) as any[];

      if (!detalles || detalles.length === 0) {
        throw new Error('La solicitud no tiene equipos asociados');
      }

      // 3. Actualizar inventario: reservado → alquilado
      for (const detalle of detalles) {
        const equipo = db.prepare(`
          SELECT * FROM equipo WHERE id_equipo = ?
        `).get(detalle.id_equipo) as any;

        if (!equipo) {
          throw new Error(`Equipo con id ${detalle.id_equipo} no encontrado`);
        }

        const cantidadReservado = equipo.cantidad_reservado || 0;
        const cantidadSolicitada = detalle.cantidad_equipo || 0;

        // Validar que hay suficiente cantidad reservada
        if (cantidadReservado < cantidadSolicitada) {
          throw new Error(`No hay suficiente cantidad reservada del equipo ${equipo.nombre_equipo}. Reservado: ${cantidadReservado}, Solicitado: ${cantidadSolicitada}`);
        }

        // Actualizar usando el nuevo sistema de columnas
        // reservado → alquilado
        const nuevaCantidadReservado = cantidadReservado - cantidadSolicitada;
        const nuevaCantidadAlquilado = (equipo.cantidad_alquilado || 0) + cantidadSolicitada;
        
        db.prepare(`
          UPDATE equipo 
          SET cantidad_reservado = ?,
              cantidad_alquilado = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id_equipo = ?
        `).run(nuevaCantidadReservado, nuevaCantidadAlquilado, detalle.id_equipo);
      }

      // 4. Registrar en bitácora de equipos (CRÍTICO para poder revertir en caso de anulación)
      for (const detalle of detalles) {
        db.prepare(`
          INSERT INTO bitacora_equipo (
            id_equipo,
            id_solicitud_equipo,
            numero_solicitud_equipo,
            cantidad_equipo,
            fecha_inicio,
            estado_bitacora,
            observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          detalle.id_equipo,
          id_solicitud_equipo,
          solicitud.numero_solicitud_equipo,
          detalle.cantidad_equipo,
          solicitud.fecha_vencimiento,
          1, // Estado activo
          'Equipo asignado al generar contrato'
        );
      }

      // 5. Actualizar estado de la solicitud a CONTRATO_GENERADO
      db.prepare(`
        UPDATE encabezado_solicitud_equipo 
        SET estado_solicitud_equipo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id_solicitud_equipo = ?
      `).run(EstadoSolicitudEquipo.CONTRATO_GENERADO, id_solicitud_equipo);

      // 6. Crear el registro del contrato
      const resultContrato = db.prepare(`
        INSERT INTO contrato (id_solicitud_equipo, estado)
        VALUES (?, ?)
      `).run(id_solicitud_equipo, 1); // Estado 1 = Generado

      return {
        id_contrato: resultContrato.lastInsertRowid,
        id_solicitud_equipo,
        numero_solicitud_equipo: solicitud.numero_solicitud_equipo,
        equipos_procesados: detalles.length
      };
    });

    return transaction();
  },

  getAll: () => {
    return db.prepare(`
      SELECT 
        c.*, 
        s.numero_solicitud_equipo, 
        s.id_cliente,
        s.fecha_vencimiento,
        CASE 
          WHEN cl.nombre_cliente IS NOT NULL THEN cl.nombre_cliente || ' ' || cl.apellidos_cliente
          ELSE 'Sin cliente'
        END as nombre_cliente
      FROM contrato c
      LEFT JOIN encabezado_solicitud_equipo s ON c.id_solicitud_equipo = s.id_solicitud_equipo
      LEFT JOIN cliente cl ON s.id_cliente = cl.id_cliente
      ORDER BY c.created_at DESC
    `).all();
  },

  getById: (id: number) => {
    return db.prepare(`
      SELECT c.*, s.numero_solicitud_equipo, s.id_cliente
      FROM contrato c
      LEFT JOIN encabezado_solicitud_equipo s ON c.id_solicitud_equipo = s.id_solicitud_equipo
      WHERE c.id_contrato = ?
    `).get(id);
  },

  getBySolicitudEquipo: (id_solicitud_equipo: number) => {
    return db.prepare(`
      SELECT * FROM contrato WHERE id_solicitud_equipo = ?
    `).get(id_solicitud_equipo);
  }
};
