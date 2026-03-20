/**
 * Script de Validación y Sincronización Automática del Esquema de Base de Datos
 * 
 * Este script:
 * 1. Lee la estructura actual de la base de datos
 * 2. Lee la estructura esperada desde el esquema definido
 * 3. Detecta diferencias (columnas faltantes, tipos incorrectos, etc.)
 * 4. Aplica automáticamente las migraciones necesarias
 * 
 * Uso: node scripts/validate-and-sync-db-schema.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuración
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'rentall.db');
const backupDir = path.join(process.cwd(), 'backups');

console.log('🔍 Iniciando validación del esquema de base de datos...\n');
console.log(`📂 Base de datos: ${dbPath}\n`);

// Asegurar que existe el directorio de backups
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Schema esperado - Define la estructura correcta de cada tabla
const EXPECTED_SCHEMA = {
  vibrador: {
    columns: {
      id_vibrador: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre_equipo: { type: 'TEXT', notnull: false },
      descripcion_vibrador: { type: 'TEXT', notnull: false },
      voltaje_vibrador: { type: 'TEXT', notnull: false },
      estado_vibrador: { type: 'INTEGER', default: 1 },
      precio_equipo: { type: 'INTEGER', notnull: false },
      precio_mes: { type: 'INTEGER', notnull: false },
      precio_quincena: { type: 'INTEGER', notnull: false },
      precio_semana: { type: 'INTEGER', notnull: false },
      precio_dia: { type: 'INTEGER', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  puntal: {
    columns: {
      id_puntal: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre_equipo: { type: 'TEXT', notnull: false },
      largo_puntal: { type: 'TEXT', notnull: false },
      estado_puntal: { type: 'INTEGER', default: 1 },
      precio_equipo: { type: 'INTEGER', notnull: false },
      precio_mes: { type: 'INTEGER', notnull: false },
      precio_quincena: { type: 'INTEGER', notnull: false },
      precio_semana: { type: 'INTEGER', notnull: false },
      precio_dia: { type: 'INTEGER', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  mezcladora: {
    columns: {
      id_mezcladora: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre_equipo: { type: 'TEXT', notnull: false },
      capacidad_mezcladora: { type: 'TEXT', notnull: false },
      voltaje_mezcladora: { type: 'TEXT', notnull: false },
      chasis_mezcladora: { type: 'TEXT', notnull: false },
      estado_mezcladora: { type: 'INTEGER', default: 1 },
      precio_equipo: { type: 'INTEGER', notnull: false },
      precio_mes: { type: 'INTEGER', notnull: false },
      precio_quincena: { type: 'INTEGER', notnull: false },
      precio_semana: { type: 'INTEGER', notnull: false },
      precio_dia: { type: 'INTEGER', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  andamio: {
    columns: {
      id_andamio: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre_equipo: { type: 'TEXT', notnull: false },
      ancho_andamio: { type: 'TEXT', notnull: false },
      largo_andamio: { type: 'TEXT', notnull: false },
      estado_andamio: { type: 'INTEGER', default: 1 },
      precio_equipo: { type: 'INTEGER', notnull: false },
      precio_mes: { type: 'INTEGER', notnull: false },
      precio_quincena: { type: 'INTEGER', notnull: false },
      precio_semana: { type: 'INTEGER', notnull: false },
      precio_dia: { type: 'INTEGER', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  compactador: {
    columns: {
      id_compactador: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre_equipo: { type: 'TEXT', notnull: true },
      descripcion_equipo: { type: 'TEXT', notnull: false },
      estado_equipo: { type: 'INTEGER', default: 1 },
      precio_equipo: { type: 'INTEGER', notnull: false },
      precio_mes: { type: 'INTEGER', notnull: false },
      precio_quincena: { type: 'INTEGER', notnull: false },
      precio_semana: { type: 'INTEGER', notnull: false },
      precio_dia: { type: 'INTEGER', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  rompedor: {
    columns: {
      id_rompedor: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre_equipo: { type: 'TEXT', notnull: false },
      capacidad_rompedor: { type: 'TEXT', notnull: false },
      voltaje_rompedor: { type: 'TEXT', notnull: false },
      estado_rompedor: { type: 'INTEGER', default: 1 },
      precio_equipo: { type: 'INTEGER', notnull: false },
      precio_mes: { type: 'INTEGER', notnull: false },
      precio_quincena: { type: 'INTEGER', notnull: false },
      precio_semana: { type: 'INTEGER', notnull: false },
      precio_dia: { type: 'INTEGER', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  equipo: {
    columns: {
      id_equipo: { type: 'INTEGER', pk: true, autoincrement: true },
      cantidad_equipo: { type: 'INTEGER', notnull: true },
      nombre_equipo: { type: 'TEXT', notnull: true },
      id_equipo_categoria: { type: 'INTEGER', notnull: false },
      id_estado_equipo: { type: 'INTEGER', notnull: false },
      id_equipo_especifico: { type: 'INTEGER', notnull: false },
      cantidad_disponible: { type: 'INTEGER', default: 0 },
      cantidad_alquilado: { type: 'INTEGER', default: 0 },
      cantidad_en_transito: { type: 'INTEGER', default: 0 },
      cantidad_en_recoleccion: { type: 'INTEGER', default: 0 },
      cantidad_en_mantenimiento: { type: 'INTEGER', default: 0 },
      cantidad_reservado: { type: 'INTEGER', default: 0 },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  cliente: {
    columns: {
      id_cliente: { type: 'INTEGER', pk: true, autoincrement: true },
      documento_identidad_cliente: { type: 'TEXT', notnull: true },
      nombre_cliente: { type: 'TEXT', notnull: true },
      apellidos_cliente: { type: 'TEXT', notnull: true },
      telefono_cliente: { type: 'TEXT', notnull: false },
      email_cliente: { type: 'TEXT', notnull: false },
      provincia: { type: 'TEXT', notnull: false },
      canton: { type: 'TEXT', notnull: false },
      distrito: { type: 'TEXT', notnull: false },
      otras_senas: { type: 'TEXT', notnull: false },
      estado_cliente: { type: 'INTEGER', default: 1 },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  empleado: {
    columns: {
      id_empleado: { type: 'INTEGER', pk: true, autoincrement: true },
      nombre: { type: 'TEXT', notnull: true },
      apellidos: { type: 'TEXT', notnull: true },
      telefono: { type: 'TEXT', notnull: false },
      fecha_ingreso: { type: 'DATE', notnull: true },
      fecha_salida: { type: 'DATE', notnull: false },
      estado: { type: 'INTEGER', default: 1 },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  },
  solicitud_vacaciones: {
    columns: {
      id_solicitud_vacaciones: { type: 'INTEGER', pk: true, autoincrement: true },
      id_empleado: { type: 'INTEGER', notnull: true },
      fecha_solicitud: { type: 'DATE', notnull: true },
      fecha_inicio: { type: 'DATE', notnull: true },
      fecha_fin: { type: 'DATE', notnull: true },
      cantidad_dias: { type: 'INTEGER', notnull: true },
      dias_disponibles: { type: 'INTEGER', notnull: true },
      estado: { type: 'TEXT', default: 'pendiente' },
      observaciones: { type: 'TEXT', notnull: false },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    }
  }
};

/**
 * Obtiene la información de las columnas de una tabla
 */
function getTableSchema(db, tableName) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const schema = {};
    
    columns.forEach(col => {
      schema[col.name] = {
        type: col.type,
        notnull: col.notnull === 1,
        default: col.dflt_value,
        pk: col.pk === 1
      };
    });
    
    return schema;
  } catch (error) {
    return null; // Tabla no existe
  }
}

/**
 * Compara el esquema actual con el esperado
 */
function compareSchemas(currentSchema, expectedSchema) {
  const differences = {
    missingColumns: [],
    typeChanges: [],
    extraColumns: []
  };

  // Buscar columnas faltantes o con tipo incorrecto
  for (const [colName, expectedCol] of Object.entries(expectedSchema.columns)) {
    if (!currentSchema[colName]) {
      differences.missingColumns.push({
        name: colName,
        definition: expectedCol
      });
    } else {
      const currentCol = currentSchema[colName];
      // Comparar tipos (normalizar para comparación)
      const currentType = currentCol.type.toUpperCase();
      const expectedType = expectedCol.type.toUpperCase();
      
      if (currentType !== expectedType) {
        differences.typeChanges.push({
          name: colName,
          current: currentType,
          expected: expectedType
        });
      }
    }
  }

  // Buscar columnas extra (que están en DB pero no en esquema esperado)
  for (const colName of Object.keys(currentSchema)) {
    if (!expectedSchema.columns[colName]) {
      differences.extraColumns.push(colName);
    }
  }

  return differences;
}

/**
 * Aplica migración para agregar columnas faltantes
 */
function applyMigration(db, tableName, differences) {
  const migrations = [];
  
  // Solo agregamos columnas faltantes (no eliminamos columnas extra por seguridad)
  for (const missing of differences.missingColumns) {
    const colDef = missing.definition;
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${missing.name} ${colDef.type}`;
    
    if (colDef.notnull && !colDef.default) {
      // Si es NOT NULL sin default, usar un default temporal
      sql += ` DEFAULT ''`;
    } else if (colDef.default) {
      if (colDef.default === 'CURRENT_TIMESTAMP') {
        sql += ` DEFAULT CURRENT_TIMESTAMP`;
      } else if (typeof colDef.default === 'number') {
        sql += ` DEFAULT ${colDef.default}`;
      } else {
        sql += ` DEFAULT '${colDef.default}'`;
      }
    }
    
    migrations.push(sql);
  }
  
  return migrations;
}

/**
 * Crea una nueva tabla desde el esquema esperado
 */
function createTableFromSchema(db, tableName, expectedSchema) {
  console.log(`   🆕 Creando tabla ${tableName}...`);
  
  const columnDefs = [];
  for (const [colName, colDef] of Object.entries(expectedSchema.columns)) {
    let def = `${colName} ${colDef.type}`;
    
    if (colDef.pk) {
      def += ' PRIMARY KEY';
      if (colDef.autoincrement) {
        def += ' AUTOINCREMENT';
      }
    }
    
    if (colDef.notnull && !colDef.pk) {
      def += ' NOT NULL';
    }
    
    if (colDef.default !== undefined && !colDef.pk) {
      if (colDef.default === 'CURRENT_TIMESTAMP') {
        def += ' DEFAULT CURRENT_TIMESTAMP';
      } else if (typeof colDef.default === 'number') {
        def += ` DEFAULT ${colDef.default}`;
      } else {
        def += ` DEFAULT '${colDef.default}'`;
      }
    }
    
    columnDefs.push(def);
  }
  
  const createTableSQL = `CREATE TABLE ${tableName} (${columnDefs.join(', ')})`;
  
  try {
    console.log(`   🔧 Ejecutando: ${createTableSQL}`);
    db.exec(createTableSQL);
    console.log(`   ✅ Tabla ${tableName} creada exitosamente`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error creando tabla ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Migra una tabla completa (usado cuando hay cambios de tipo)
 */
function migrateTableStructure(db, tableName, expectedSchema, currentSchema) {
  console.log(`   🔄 Migrando estructura completa de ${tableName}...`);
  
  // Crear nombre de tabla temporal
  const tempTableName = `${tableName}_new`;
  
  // Construir CREATE TABLE para nueva estructura
  const columnDefs = [];
  for (const [colName, colDef] of Object.entries(expectedSchema.columns)) {
    let def = `${colName} ${colDef.type}`;
    
    if (colDef.pk) {
      def += ' PRIMARY KEY';
      if (colDef.autoincrement) {
        def += ' AUTOINCREMENT';
      }
    }
    
    if (colDef.notnull && !colDef.pk) {
      def += ' NOT NULL';
    }
    
    if (colDef.default !== undefined && !colDef.pk) {
      if (colDef.default === 'CURRENT_TIMESTAMP') {
        def += ' DEFAULT CURRENT_TIMESTAMP';
      } else if (typeof colDef.default === 'number') {
        def += ` DEFAULT ${colDef.default}`;
      } else {
        def += ` DEFAULT '${colDef.default}'`;
      }
    }
    
    columnDefs.push(def);
  }
  
  const createTableSQL = `CREATE TABLE ${tempTableName} (${columnDefs.join(', ')})`;
  
  try {
    // Crear nueva tabla
    db.exec(createTableSQL);
    
    // Copiar datos - solo columnas que existen en ambas
    const commonColumns = Object.keys(expectedSchema.columns).filter(col => 
      currentSchema[col] !== undefined
    );
    
    if (commonColumns.length > 0) {
      const copySQL = `INSERT INTO ${tempTableName} (${commonColumns.join(', ')}) 
                       SELECT ${commonColumns.join(', ')} FROM ${tableName}`;
      db.exec(copySQL);
    }
    
    // Eliminar tabla vieja
    db.exec(`DROP TABLE ${tableName}`);
    
    // Renombrar nueva tabla
    db.exec(`ALTER TABLE ${tempTableName} RENAME TO ${tableName}`);
    
    console.log(`   ✅ Migración de ${tableName} completada`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error migrando ${tableName}:`, error.message);
    // Intentar limpiar tabla temporal si existe
    try {
      db.exec(`DROP TABLE IF EXISTS ${tempTableName}`);
    } catch (e) {
      // Ignorar error de limpieza
    }
    return false;
  }
}

/**
 * Función principal
 */
function validateAndSyncSchema() {
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Base de datos no encontrada: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath);
  let changesApplied = false;
  let hasErrors = false;

  console.log('📊 Analizando esquema de base de datos...\n');

  // Verificar cada tabla en el esquema esperado
  for (const [tableName, expectedSchema] of Object.entries(EXPECTED_SCHEMA)) {
    console.log(`🔍 Verificando tabla: ${tableName}`);
    
    const currentSchema = getTableSchema(db, tableName);
    
    if (!currentSchema) {
      console.log(`   ⚠️  Tabla ${tableName} no existe en la base de datos`);
      const success = createTableFromSchema(db, tableName, expectedSchema);
      if (success) {
        changesApplied = true;
      } else {
        hasErrors = true;
      }
      console.log('');
      continue;
    }
    
    const differences = compareSchemas(currentSchema, expectedSchema);
    
    // Si hay cambios de tipo, necesitamos migración completa
    if (differences.typeChanges.length > 0) {
      console.log(`   ⚠️  Cambios de tipo detectados:`);
      differences.typeChanges.forEach(change => {
        console.log(`      • ${change.name}: ${change.current} → ${change.expected}`);
      });
      
      // Hacer backup antes de migración completa
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFile = path.join(backupDir, `backup-${tableName}-${timestamp}.json`);
      
      const data = db.prepare(`SELECT * FROM ${tableName}`).all();
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      console.log(`   💾 Backup guardado: ${backupFile}`);
      
      const success = migrateTableStructure(db, tableName, expectedSchema, currentSchema);
      if (success) {
        changesApplied = true;
      } else {
        hasErrors = true;
      }
      console.log('');
      continue;
    }
    
    // Si solo faltan columnas, usar ALTER TABLE
    if (differences.missingColumns.length > 0) {
      console.log(`   ⚠️  Columnas faltantes detectadas:`);
      differences.missingColumns.forEach(col => {
        console.log(`      • ${col.name} (${col.definition.type})`);
      });
      
      const migrations = applyMigration(db, tableName, differences);
      
      try {
        migrations.forEach(sql => {
          console.log(`   🔧 Ejecutando: ${sql}`);
          db.exec(sql);
        });
        console.log(`   ✅ Columnas agregadas a ${tableName}`);
        changesApplied = true;
      } catch (error) {
        console.error(`   ❌ Error aplicando migración: ${error.message}`);
        hasErrors = true;
      }
    }
    
    // Reportar columnas extra (pero no las eliminamos)
    if (differences.extraColumns.length > 0) {
      console.log(`   ℹ️  Columnas extra (no se eliminarán): ${differences.extraColumns.join(', ')}`);
    }
    
    if (differences.missingColumns.length === 0 && 
        differences.typeChanges.length === 0 && 
        differences.extraColumns.length === 0) {
      console.log(`   ✅ Esquema correcto`);
    }
    
    console.log('');
  }

  db.close();

  console.log('\n═══════════════════════════════════════════════════════════');
  if (hasErrors) {
    console.log('❌ VALIDACIÓN COMPLETADA CON ERRORES');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  } else if (changesApplied) {
    console.log('✅ VALIDACIÓN Y SINCRONIZACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Se aplicaron cambios al esquema de la base de datos\n');
  } else {
    console.log('✅ VALIDACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('El esquema está sincronizado correctamente\n');
  }
}

// Ejecutar validación
try {
  validateAndSyncSchema();
} catch (error) {
  console.error('\n❌ Error fatal:', error.message);
  console.error(error.stack);
  process.exit(1);
}
