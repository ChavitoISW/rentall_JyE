import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'rentall.db');
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

console.log('✅ Base de datos inicializada correctamente');

export default db;
