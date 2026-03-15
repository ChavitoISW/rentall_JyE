/**
 * Sistema de Backups Automáticos
 * Ejecuta backups programados de la base de datos
 */

import cron from 'node-cron';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database', 'rentall.db');
const backupDir = path.join(process.cwd(), 'backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Ejecuta un backup completo de la base de datos
 */
function ejecutarBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
  
  try {
    console.log(`📦 [${new Date().toLocaleString('es-CR')}] Iniciando backup automático...`);
    
    // Copiar archivo de base de datos
    fs.copyFileSync(dbPath, backupFile);
    
    // Verificar el backup
    const stats = fs.statSync(backupFile);
    console.log(`✅ Backup completado: ${backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);
    
    // Limpiar backups antiguos (mantener últimos 30)
    limpiarBackupsAntiguos();
    
    return true;
  } catch (error) {
    console.error(`❌ Error al crear backup: ${error}`);
    return false;
  }
}

/**
 * Elimina backups antiguos, manteniendo solo los últimos 30
 */
function limpiarBackupsAntiguos() {
  try {
    const archivos = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .map(file => ({
        nombre: file,
        ruta: path.join(backupDir, file),
        fecha: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    // Mantener solo los últimos 30 backups
    if (archivos.length > 30) {
      const backupsAEliminar = archivos.slice(30);
      backupsAEliminar.forEach(archivo => {
        fs.unlinkSync(archivo.ruta);
        console.log(`🗑️  Backup antiguo eliminado: ${archivo.nombre}`);
      });
    }
  } catch (error) {
    console.error(`⚠️  Error al limpiar backups antiguos: ${error}`);
  }
}

/**
 * Inicia los backups programados
 */
export function iniciarBackupsAutomaticos() {
  console.log('⏰ Sistema de backups automáticos iniciado');
  console.log('   - Backup diario a las 12:30 PM');
  console.log('   - Backup diario a las 8:00 PM');
  
  // Backup a las 12:30 PM (todos los días)
  cron.schedule('30 12 * * *', () => {
    console.log('\n🕐 Ejecutando backup programado (12:30 PM)...');
    ejecutarBackup();
  }, {
    timezone: 'America/Costa_Rica'
  });

  // Backup a las 8:00 PM (todos los días)
  cron.schedule('0 20 * * *', () => {
    console.log('\n🕗 Ejecutando backup programado (8:00 PM)...');
    ejecutarBackup();
  }, {
    timezone: 'America/Costa_Rica'
  });

  // Backup inicial al iniciar la aplicación
  console.log('\n📦 Ejecutando backup inicial al iniciar...');
  ejecutarBackup();
}

/**
 * Ejecuta un backup manual (puede ser llamado desde una API)
 */
export function backupManual() {
  return ejecutarBackup();
}
