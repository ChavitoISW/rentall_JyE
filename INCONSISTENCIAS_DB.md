# INCONSISTENCIAS ENCONTRADAS EN DATABASE.TS

## 1. bitacora_equipo
**FALTA:** columna `updated_at DATETIME`
- DB real tiene: `updated_at DATETIME`
- database.ts NO la tiene

## 2. contrato
**PROBLEMA:** UNIQUE constraint missing
- DB real: `numero_contrato TEXT` (sin UNIQUE)
- database.ts: `numero_contrato TEXT UNIQUE` (con UNIQUE - NO coincide)

## 3. detalle_hoja_ruta
**FALTAN múltiples columnas:**
- numero_referencia TEXT
- direccion TEXT  
- nombre_cliente TEXT
- telefono_cliente TEXT
- hora_estimada TEXT
- notas TEXT
- hora_real TEXT

## 4. encabezado_solicitud_equipo
**FALTAN columnas de extensión:**
- numero_se_origen TEXT
- es_extension INTEGER DEFAULT 0
- id_contrato_origen INTEGER
- id_solicitud_origen INTEGER

## 5. hoja_ruta
**PROBLEMAS:**
- database.ts: `numero_hoja_ruta TEXT UNIQUE` 
- DB real: `numero_hoja_ruta TEXT` (sin UNIQUE - NO coincide)
- Orden de columnas conductor/vehiculo diferente (no crítico)

## 6. Console.log innecesarios
Encontrados 140+ console.log en archivos de producción en src/:
- src/componentes/*.tsx
- src/pages/api/**/*.ts
- src/contexts/*.tsx
- src/lib/database.ts (línea 437)

Los console.error son aceptables, pero hay muchos console.log de debug que deben eliminarse.

## ARCHIVOS A ACTUALIZAR:
1. src/lib/database.ts - Agregar columnas faltantes y quitar UNIQUE constraints incorrectos
2. Eliminar console.log innecesarios en producción (conservar console.error)
