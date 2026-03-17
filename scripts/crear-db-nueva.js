/**
 * Script de Backup y Creación de Nueva DB
 * (Sin eliminar la actual)
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPathActual = path.join(__dirname, '..', 'rentall.db');
const dbPathNueva = path.join(__dirname, '..', 'rentall-nueva.db');
const backupDir = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

console.log('🔄 Creando nueva base de datos con datos respaldados...\n');

const tablasARespaladar = [
  'rol',
  'usuarios',
  'rompedor',
  'vibrador',
  'puntal',
  'mezcladora',
  'compactador',
  'andamio'
];

let backup = {};

try {
  // Paso 1: Respaldar datos
  console.log('📦 Respaldando datos de la DB actual...\n');
  
  const dbActual = new Database(dbPathActual, { readonly: true });
  
  for (const tabla of tablasARespaladar) {
    try {
      const datos = dbActual.prepare(`SELECT * FROM ${tabla}`).all();
      backup[tabla] = datos;
      console.log(`  ✅ ${tabla}: ${datos.length} registros`);
    } catch (error) {
      console.log(`  ⚠️  ${tabla}: tabla no existe`);
      backup[tabla] = [];
    }
  }
  
  dbActual.close();
  
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\n💾 Backup guardado: ${backupFile}\n`);

  // Paso 2: Eliminar DB nueva si existe
  if (fs.existsSync(dbPathNueva)) {
    fs.unlinkSync(dbPathNueva);
  }

  // Paso 3: Crear nueva DB
  console.log('🏗️  Creando nueva base de datos...\n');
  
  const dbNueva = new Database(dbPathNueva);
  
  const createTables = `
    -- Tabla de roles
    CREATE TABLE rol (
      id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_rol TEXT NOT NULL,
      descripcion_rol TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de usuarios
    CREATE TABLE usuarios (
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
      FOREIGN KEY (usuario_rol) REFERENCES rol (id_rol)
    );

    -- Tabla de usuario (sistema nuevo)
    CREATE TABLE usuario (
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
      estado_usuario INTEGER DEFAULT 1,
      usuario_rol INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_rol) REFERENCES rol (id_rol)
    );

    -- Tabla categoria_equipo
    CREATE TABLE categoria_equipo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio_dia INTEGER,
      precio_semana INTEGER,
      precio_quincena INTEGER,
      precio_mes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tablas de equipos específicos
    CREATE TABLE andamio (
      id_andamio INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_equipo TEXT,
      ancho_andamio TEXT,
      largo_andamio TEXT,
      estado_andamio INTEGER DEFAULT 1,
      precio_equipo INTEGER,
      precio_mes INTEGER,
      precio_quincena INTEGER,
      precio_semana INTEGER,
      precio_dia INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE mezcladora (
      id_mezcladora INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_equipo TEXT,
      capacidad_mezcladora TEXT,
      voltaje_mezcladora TEXT,
      chasis_mezcladora TEXT,
      estado_mezcladora INTEGER DEFAULT 1,
      precio_equipo INTEGER,
      precio_mes INTEGER,
      precio_quincena INTEGER,
      precio_semana INTEGER,
      precio_dia INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE compactador (
      id_compactador INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_equipo TEXT,
      descripcion_equipo TEXT,
      estado_equipo INTEGER DEFAULT 1,
      precio_equipo INTEGER,
      precio_mes INTEGER,
      precio_quincena INTEGER,
      precio_semana INTEGER,
      precio_dia INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE rompedor (
      id_rompedor INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_equipo TEXT,
      capacidad_rompedor TEXT,
      voltaje_rompedor TEXT,
      estado_rompedor INTEGER DEFAULT 1,
      precio_equipo INTEGER,
      precio_mes INTEGER,
      precio_quincena INTEGER,
      precio_semana INTEGER,
      precio_dia INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE vibrador (
      id_vibrador INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_equipo TEXT,
      descripcion_vibrador TEXT,
      voltaje_vibrador TEXT,
      estado_vibrador INTEGER DEFAULT 1,
      precio_equipo INTEGER,
      precio_mes INTEGER,
      precio_quincena INTEGER,
      precio_semana INTEGER,
      precio_dia INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE puntal (
      id_puntal INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_equipo TEXT,
      largo_puntal TEXT,
      estado_puntal INTEGER DEFAULT 1,
      precio_equipo INTEGER,
      precio_mes INTEGER,
      precio_quincena INTEGER,
      precio_semana INTEGER,
      precio_dia INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla equipo con el nuevo sistema de columnas por estado
    CREATE TABLE equipo (
      id_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
      cantidad_equipo INTEGER NOT NULL,
      nombre_equipo TEXT NOT NULL,
      id_equipo_categoria INTEGER,
      id_estado_equipo INTEGER,
      id_equipo_especifico INTEGER,
      cantidad_disponible INTEGER DEFAULT 0,
      cantidad_alquilado INTEGER DEFAULT 0,
      cantidad_en_transito INTEGER DEFAULT 0,
      cantidad_en_recoleccion INTEGER DEFAULT 0,
      cantidad_en_mantenimiento INTEGER DEFAULT 0,
      cantidad_reservado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_equipo_categoria) REFERENCES categoria_equipo (id)
    );

    -- Tabla cliente
    CREATE TABLE cliente (
      id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_cliente TEXT NOT NULL,
      apellido_cliente TEXT,
      cedula_cliente TEXT UNIQUE,
      correo_cliente TEXT,
      telefono_cliente TEXT,
      provincia_cliente TEXT,
      canton_cliente TEXT,
      distrito_cliente TEXT,
      otras_senas_cliente TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla encabezado_solicitud_equipo
    CREATE TABLE encabezado_solicitud_equipo (
      id_solicitud_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_solicitud_equipo TEXT UNIQUE NOT NULL,
      id_cliente INTEGER NOT NULL,
      fecha_elaboracion DATE,
      fecha_inicio DATE,
      fecha_vencimiento DATE,
      nombre_recibe TEXT,
      cedula_recibe TEXT,
      telefono_recibe TEXT,
      precio_total_equipos INTEGER,
      provincia_solicitud_equipo TEXT,
      canton_solicitud_equipo TEXT,
      distrito_solicitud_equipo TEXT,
      otras_senas_solicitud_equipo TEXT,
      observaciones_solicitud_equipo TEXT,
      estado_solicitud_equipo INTEGER DEFAULT 1,
      pago_envio INTEGER DEFAULT 0,
      monto_envio INTEGER DEFAULT 0,
      usa_factura INTEGER DEFAULT 0,
      subtotal_solicitud_equipo INTEGER DEFAULT 0,
      descuento_solicitud_equipo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
    );

    -- Tabla detalle_solicitud_equipo
    CREATE TABLE detalle_solicitud_equipo (
      id_detalle_solicitud_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_solicitud_equipo INTEGER,
      numero_solicitud_equipo TEXT,
      id_equipo INTEGER,
      cantidad_equipo INTEGER,
      precio_total_detalle INTEGER,
      fecha_devolucion DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo (id_solicitud_equipo),
      FOREIGN KEY (id_equipo) REFERENCES equipo (id_equipo)
    );

    -- Tabla contrato
    CREATE TABLE contrato (
      id_contrato INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_contrato TEXT UNIQUE,
      id_solicitud_equipo INTEGER,
      estado INTEGER DEFAULT 1,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo (id_solicitud_equipo)
    );

    -- Tabla factura_contrato
    CREATE TABLE factura_contrato (
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
      FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo (id_solicitud_equipo),
      FOREIGN KEY (id_contrato) REFERENCES contrato (id_contrato)
    );

    -- Tabla hoja_ruta
    CREATE TABLE hoja_ruta (
      id_hoja_ruta INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_hoja_ruta TEXT UNIQUE,
      usuario_id INTEGER,
      fecha_creacion DATE,
      estado_hoja_ruta INTEGER DEFAULT 0,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      conductor TEXT,
      vehiculo TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (usuario_id)
    );

    -- Tabla detalle_hoja_ruta
    CREATE TABLE detalle_hoja_ruta (
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
      FOREIGN KEY (id_hoja_ruta) REFERENCES hoja_ruta (id_hoja_ruta) ON DELETE CASCADE
    );

    -- Tabla orden_recoleccion
    CREATE TABLE orden_recoleccion (
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
      FOREIGN KEY (id_detalle_solicitud_equipo) REFERENCES detalle_solicitud_equipo (id_detalle_solicitud_equipo)
    );

    -- Tabla orden_cambio_equipo
    CREATE TABLE orden_cambio_equipo (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo (id_solicitud_equipo)
    );

    -- Tabla bitacora_equipo
    CREATE TABLE bitacora_equipo (
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
      FOREIGN KEY (id_equipo) REFERENCES equipo (id_equipo),
      FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo (id_solicitud_equipo)
    );

    -- Tabla anulacion_contrato
    CREATE TABLE anulacion_contrato (
      id_anulacion INTEGER PRIMARY KEY AUTOINCREMENT,
      id_contrato INTEGER NOT NULL,
      numero_contrato TEXT,
      id_solicitud_equipo INTEGER NOT NULL,
      fecha_anulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      motivo_anulacion TEXT NOT NULL,
      usuario_anulacion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_contrato) REFERENCES contrato (id_contrato),
      FOREIGN KEY (id_solicitud_equipo) REFERENCES encabezado_solicitud_equipo (id_solicitud_equipo)
    );

    -- Tabla pago_contrato
    CREATE TABLE pago_contrato (
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
      FOREIGN KEY (id_contrato) REFERENCES contrato (id_contrato) ON DELETE CASCADE
    );
  `;
  
  dbNueva.exec(createTables);
  console.log('  ✅ Todas las tablas creadas\n');

  // Paso 4: Restaurar datos
  console.log('📥 Restaurando datos...\n');
  
  for (const tabla of tablasARespaladar) {
    const datos = backup[tabla];
    
    if (!datos || datos.length === 0) {
      console.log(`  ⏭️  ${tabla}: sin datos`);
      continue;
    }
    
    const columnas = Object.keys(datos[0]);
    const placeholders = columnas.map(() => '?').join(', ');
    const columnasStr = columnas.join(', ');
    
    const stmt = dbNueva.prepare(`
      INSERT INTO ${tabla} (${columnasStr}) VALUES (${placeholders})
    `);
    
    const insertMany = dbNueva.transaction((rows) => {
      for (const row of rows) {
        const valores = columnas.map((col) => row[col]);
        stmt.run(...valores);
      }
    });
    
    insertMany(datos);
    console.log(`  ✅ ${tabla}: ${datos.length} registros restaurados`);
  }
  
  dbNueva.close();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ PROCESO COMPLETADO');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📂 Archivos:');
  console.log(`   • DB actual: rentall.db (sin modificar)`);
  console.log(`   • DB nueva: rentall-nueva.db`);
  console.log(`   • Backup: ${backupFile}\n`);
  
  console.log('📝 Próximos pasos:');
  console.log('   1. Detén el servidor (npm run dev)');
  console.log('   2. Renombra rentall.db a rentall-old.db');
  console.log('   3. Renombra rentall-nueva.db a rentall.db');
  console.log('   4. Inicia el servidor\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
}
