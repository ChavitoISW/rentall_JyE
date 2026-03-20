import Database from 'better-sqlite3';
import path from 'path';

// Configurar ruta de la base de datos según el entorno
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database', 'rentall.db');
console.log('📁 Ruta de base de datos:', dbPath);

const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Crear tabla de categoría de equipo
db.exec(`
  CREATE TABLE IF NOT EXISTS categoria_equipo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    estado INTEGER DEFAULT 1 CHECK(estado IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de cliente
db.exec(`
  CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    documento_identidad_cliente TEXT NOT NULL UNIQUE,
    nombre_cliente TEXT NOT NULL,
    apellidos_cliente TEXT NOT NULL,
    telefono_cliente TEXT,
    email_cliente TEXT,
    provincia TEXT,
    canton TEXT,
    distrito TEXT,
    otras_senas TEXT,
    estado_cliente INTEGER DEFAULT 1 CHECK(estado_cliente IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de rol
db.exec(`
  CREATE TABLE IF NOT EXISTS rol (
    id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_rol TEXT NOT NULL,
    descripcion_rol TEXT,
    estado_rol INTEGER DEFAULT 1 CHECK(estado_rol IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de usuario
db.exec(`
  CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    identificacion_usuario TEXT NOT NULL UNIQUE,
    nombre_usuario TEXT NOT NULL,
    apellido_usuario TEXT NOT NULL,
    telefono_usuario TEXT,
    email_usuario TEXT,
    contrasena_usuario TEXT,
    provincia TEXT,
    canton TEXT,
    distrito TEXT,
    otras_senas TEXT,
    direccion_usuario TEXT,
    estado_usuario INTEGER DEFAULT 1 CHECK(estado_usuario IN (0, 1)),
    usuario_rol INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_rol) REFERENCES rol(id_rol)
  )
`);

// Crear tabla de equipo
db.exec(`
  CREATE TABLE IF NOT EXISTS equipo (
    id_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
    cantidad_equipo INTEGER NOT NULL DEFAULT 1,
    nombre_equipo TEXT NOT NULL,
    id_equipo_categoria INTEGER,
    id_estado_equipo INTEGER DEFAULT 1,
    id_equipo_especifico INTEGER,
    cantidad_disponible INTEGER DEFAULT 0,
    cantidad_alquilado INTEGER DEFAULT 0,
    cantidad_en_transito INTEGER DEFAULT 0,
    cantidad_en_recoleccion INTEGER DEFAULT 0,
    cantidad_en_mantenimiento INTEGER DEFAULT 0,
    cantidad_reservado INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_equipo_categoria) REFERENCES categoria_equipo(id)
  )
`);

// Crear tabla de mezcladora
db.exec(`
  CREATE TABLE IF NOT EXISTS mezcladora (
    id_mezcladora INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_equipo TEXT,
    capacidad_mezcladora TEXT,
    voltaje_mezcladora TEXT,
    chasis_mezcladora TEXT,
    estado_mezcladora INTEGER DEFAULT 1 CHECK(estado_mezcladora IN (0, 1)),
    precio_equipo INTEGER,
    precio_mes INTEGER,
    precio_quincena INTEGER,
    precio_semana INTEGER,
    precio_dia INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de andamio
db.exec(`
  CREATE TABLE IF NOT EXISTS andamio (
    id_andamio INTEGER PRIMARY KEY AUTOINCREMENT,
    ancho_andamio TEXT NOT NULL,
    largo_andamio TEXT NOT NULL,
    nombre_equipo TEXT,
    estado_andamio INTEGER DEFAULT 1 CHECK(estado_andamio IN (0, 1)),
    precio_equipo INTEGER,
    precio_mes INTEGER,
    precio_quincena INTEGER,
    precio_semana INTEGER,
    precio_dia INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de compactador
db.exec(`
  CREATE TABLE IF NOT EXISTS compactador (
    id_compactador INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_equipo TEXT NOT NULL,
    descripcion_equipo TEXT,
    estado_equipo INTEGER DEFAULT 1 CHECK(estado_equipo IN (0, 1)),
    precio_equipo INTEGER,
    precio_mes INTEGER,
    precio_quincena INTEGER,
    precio_semana INTEGER,
    precio_dia INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de rompedor
db.exec(`
  CREATE TABLE IF NOT EXISTS rompedor (
    id_rompedor INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_equipo TEXT,
    capacidad_rompedor TEXT,
    voltaje_rompedor TEXT,
    estado_rompedor INTEGER DEFAULT 1 CHECK(estado_rompedor IN (0, 1)),
    precio_equipo INTEGER,
    precio_mes INTEGER,
    precio_quincena INTEGER,
    precio_semana INTEGER,
    precio_dia INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de vibrador
db.exec(`
  CREATE TABLE IF NOT EXISTS vibrador (
    id_vibrador INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_equipo TEXT NOT NULL,
    descripcion_vibrador TEXT,
    voltaje_vibrador TEXT,
    estado_vibrador INTEGER DEFAULT 1 CHECK(estado_vibrador IN (0, 1)),
    precio_equipo INTEGER,
    precio_mes INTEGER,
    precio_quincena INTEGER,
    precio_semana INTEGER,
    precio_dia INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de puntal
db.exec(`
  CREATE TABLE IF NOT EXISTS puntal (
    id_puntal INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_equipo TEXT NOT NULL,
    largo_puntal TEXT,
    estado_puntal INTEGER DEFAULT 1 CHECK(estado_puntal IN (0, 1)),
    precio_equipo INTEGER,
    precio_mes INTEGER,
    precio_quincena INTEGER,
    precio_semana INTEGER,
    precio_dia INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de encabezado_solicitud_equipo
db.exec(`
  CREATE TABLE IF NOT EXISTS encabezado_solicitud_equipo (
    id_solicitud_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_solicitud_equipo TEXT UNIQUE,
    id_cliente INTEGER,
    fecha_elaboracion TEXT,
    fecha_inicio TEXT,
    fecha_vencimiento TEXT,
    nombre_recibe TEXT,
    cedula_recibe TEXT,
    telefono_recibe TEXT,
    precio_total_equipos REAL,
    provincia_solicitud_equipo TEXT,
    canton_solicitud_equipo TEXT,
    distrito_solicitud_equipo TEXT,
    otras_senas_solicitud_equipo TEXT,
    observaciones_solicitud_equipo TEXT,
    pago_envio INTEGER DEFAULT 0 CHECK(pago_envio IN (0, 1)),
    monto_envio REAL,
    usa_factura INTEGER DEFAULT 0 CHECK(usa_factura IN (0, 1)),
    subtotal_solicitud_equipo REAL,
    descuento_solicitud_equipo REAL,
    total_solicitud_equipo REAL,
    iva_solicitud_equipo REAL,
    estado_solicitud_equipo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    numero_se_origen TEXT,
    es_extension INTEGER DEFAULT 0,
    id_contrato_origen INTEGER,
    id_solicitud_origen INTEGER,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
  )
`);

// Crear tabla de detalle_solicitud_equipo
db.exec(`
  CREATE TABLE IF NOT EXISTS detalle_solicitud_equipo (
    id_detalle_solicitud_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_solicitud_equipo TEXT,
    id_equipo INTEGER,
    cantidad_equipo INTEGER,
    periodicidad INTEGER,
    cantidad_periodicidad INTEGER,
    iva_detalle REAL,
    subtotal_detalle REAL,
    monto_descuento REAL,
    monto_final REAL,
    fecha_devolucion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (numero_solicitud_equipo) REFERENCES encabezado_solicitud_equipo(numero_solicitud_equipo),
    FOREIGN KEY (id_equipo) REFERENCES equipo(id_equipo)
  )
`);

// Crear tabla de contrato
db.exec(`
  CREATE TABLE IF NOT EXISTS contrato (
    id_contrato INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_contrato TEXT,
    id_solicitud_equipo INTEGER,
    estado INTEGER DEFAULT 1,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo(id_solicitud_equipo)
  )
`);

// Crear tabla de factura_contrato
db.exec(`
  CREATE TABLE IF NOT EXISTS factura_contrato (
    id_factura_contrato INTEGER PRIMARY KEY AUTOINCREMENT,
    id_solicitud_equipo INTEGER NOT NULL,
    id_contrato INTEGER NOT NULL,
    numero_factura TEXT NOT NULL,
    monto_subtotal REAL NOT NULL DEFAULT 0,
    monto_iva REAL NOT NULL DEFAULT 0,
    monto_total REAL NOT NULL DEFAULT 0,
    fecha_emision DATE NOT NULL,
    estado_factura INTEGER DEFAULT 0,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo(id_solicitud_equipo),
    FOREIGN KEY (id_contrato) REFERENCES contrato(id_contrato)
  )
`);

// Crear tabla de hoja_ruta
db.exec(`
  CREATE TABLE IF NOT EXISTS hoja_ruta (
    id_hoja_ruta INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_hoja_ruta TEXT,
    usuario_id INTEGER,
    fecha_creacion DATE,
    estado_hoja_ruta INTEGER DEFAULT 0,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    conductor TEXT,
    vehiculo TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario)
  )
`);

// Crear tabla de detalle_hoja_ruta
db.exec(`
  CREATE TABLE IF NOT EXISTS detalle_hoja_ruta (
    id_detalle_hoja_ruta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_hoja_ruta INTEGER,
    numero_hoja_ruta TEXT,
    tipo_operacion INTEGER,
    id_referencia INTEGER,
    orden_parada INTEGER,
    estado_detalle INTEGER DEFAULT 0,
    provincia TEXT,
    canton TEXT,
    distrito TEXT,
    otras_senas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    numero_referencia TEXT,
    direccion TEXT,
    nombre_cliente TEXT,
    telefono_cliente TEXT,
    hora_estimada TEXT,
    notas TEXT,
    hora_real TEXT,
    FOREIGN KEY (id_hoja_ruta) REFERENCES hoja_ruta(id_hoja_ruta) ON DELETE CASCADE
  )
`);

// Crear tabla de orden_recoleccion
db.exec(`
  CREATE TABLE IF NOT EXISTS orden_recoleccion (
    id_orden_recoleccion INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden_recoleccion TEXT UNIQUE,
    id_detalle_solicitud_equipo INTEGER,
    id_solicitud_equipo INTEGER,
    numero_solicitud_equipo TEXT,
    fecha_creacion DATE,
    fecha_programada_recoleccion DATE,
    nombre_equipo TEXT,
    cantidad INTEGER,
    estado INTEGER DEFAULT 0,
    observaciones TEXT,
    provincia TEXT,
    canton TEXT,
    distrito TEXT,
    otras_senas TEXT,
    nombre_cliente TEXT,
    telefono_cliente TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_detalle_solicitud_equipo) REFERENCES detalle_solicitud_equipo(id_detalle_solicitud_equipo)
  )
`);

// Crear tabla de orden_cambio_equipo
db.exec(`
  CREATE TABLE IF NOT EXISTS orden_cambio_equipo (
    id_orden_cambio INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden_cambio TEXT UNIQUE NOT NULL,
    id_solicitud_equipo INTEGER,
    numero_solicitud_equipo TEXT,
    id_equipo_actual INTEGER,
    nombre_equipo_actual TEXT,
    id_equipo_nuevo INTEGER,
    nombre_equipo_nuevo TEXT,
    motivo_cambio TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT (date('now')),
    fecha_programada TEXT,
    estado INTEGER DEFAULT 0 CHECK(estado IN (0, 1, 2, 3)),
    observaciones TEXT,
    provincia TEXT,
    canton TEXT,
    distrito TEXT,
    otras_senas TEXT,
    nombre_cliente TEXT,
    telefono_cliente TEXT,
    FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo(id_solicitud_equipo)
  )
`);

// Crear tabla usuarios (diferente de usuario)
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_nombre TEXT NOT NULL,
    usuario_apellido TEXT,
    usuario_cedula TEXT,
    usuario_correo TEXT,
    usuario_telefono TEXT,
    usuario_direccion TEXT,
    usuario_contrasena TEXT NOT NULL,
    usuario_rol INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_rol) REFERENCES rol(id_rol)
  )
`);

// Crear tabla bitacora_equipo
db.exec(`
  CREATE TABLE IF NOT EXISTS bitacora_equipo (
    id_bitacora INTEGER PRIMARY KEY AUTOINCREMENT,
    id_equipo INTEGER NOT NULL,
    id_solicitud_equipo INTEGER NOT NULL,
    numero_solicitud_equipo TEXT,
    cantidad_equipo INTEGER NOT NULL,
    fecha_inicio DATE,
    fecha_devolucion DATE,
    estado_bitacora INTEGER DEFAULT 1,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (id_equipo) REFERENCES equipo(id_equipo),
    FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo(id_solicitud_equipo)
  )
`);

// Crear tabla anulacion_contrato
db.exec(`
  CREATE TABLE IF NOT EXISTS anulacion_contrato (
    id_anulacion INTEGER PRIMARY KEY AUTOINCREMENT,
    id_contrato INTEGER NOT NULL,
    numero_contrato TEXT,
    id_solicitud_equipo INTEGER NOT NULL,
    fecha_anulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo_anulacion TEXT NOT NULL,
    usuario_anulacion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_contrato) REFERENCES contrato(id_contrato),
    FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo(id_solicitud_equipo)
  )
`);

// Tabla de pagos de contratos
db.exec(`
  CREATE TABLE IF NOT EXISTS pago_contrato (
    id_pago_contrato INTEGER PRIMARY KEY AUTOINCREMENT,
    id_contrato INTEGER NOT NULL,
    tipo_pago TEXT NOT NULL CHECK(tipo_pago IN ('efectivo', 'simpe', 'transferencia')),
    monto REAL NOT NULL,
    fecha_pago DATE NOT NULL,
    numero_comprobante TEXT,
    banco TEXT,
    numero_transferencia TEXT,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_contrato) REFERENCES contrato(id_contrato) ON DELETE CASCADE
  )
`);

// Tabla de empleados para control de vacaciones
db.exec(`
  CREATE TABLE IF NOT EXISTS empleado (
    id_empleado INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT,
    fecha_ingreso DATE NOT NULL,
    fecha_salida DATE,
    estado INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Tabla de solicitudes de vacaciones
db.exec(`
  CREATE TABLE IF NOT EXISTS solicitud_vacaciones (
    id_solicitud_vacaciones INTEGER PRIMARY KEY AUTOINCREMENT,
    id_empleado INTEGER NOT NULL,
    fecha_solicitud DATE NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cantidad_dias INTEGER NOT NULL,
    dias_disponibles INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobada', 'rechazada')),
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
  )
`);

// Base de datos inicializada correctamente

export default db;
