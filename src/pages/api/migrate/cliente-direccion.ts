import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Iniciando migración de columnas de dirección...');

    // Verificar si las columnas ya existen
    const tableInfo = db.prepare("PRAGMA table_info(cliente)").all() as any[];
    const columnNames = tableInfo.map((col: any) => col.name);

    const columnsToAdd = [
      { name: 'provincia', exists: columnNames.includes('provincia') },
      { name: 'canton', exists: columnNames.includes('canton') },
      { name: 'distrito', exists: columnNames.includes('distrito') },
      { name: 'otras_senas', exists: columnNames.includes('otras_senas') }
    ];

    const messages: string[] = [];
    let addedColumns = 0;

    for (const column of columnsToAdd) {
      if (!column.exists) {
        const message = `Agregando columna: ${column.name}`;
        console.log(`➕ ${message}`);
        db.exec(`ALTER TABLE cliente ADD COLUMN ${column.name} TEXT`);
        messages.push(message);
        addedColumns++;
      } else {
        const message = `La columna ${column.name} ya existe`;
        console.log(`✓ ${message}`);
        messages.push(message);
      }
    }

    const finalMessage = addedColumns > 0 
      ? `Migración completada. Se agregaron ${addedColumns} columnas.`
      : 'Todas las columnas ya existen. No se requieren cambios.';
    
    console.log(`✅ ${finalMessage}`);

    return res.status(200).json({
      success: true,
      message: finalMessage,
      details: messages,
      addedColumns
    });

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error durante la migración'
    });
  }
}
