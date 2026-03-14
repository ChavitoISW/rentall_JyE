# Corrección de Inconsistencias en Sistema de Extensiones

## ✅ Problemas Identificados y Corregidos

### 1. **Doble Reserva de Equipos**
**Problema:**
- Al extender un contrato, el sistema reservaba equipos adicionales
- Esto causaba que `cantidad_reservado` aumentara incorrectamente
- Los equipos ya estaban con el cliente, no necesitaban re-reservarse

**Solución Aplicada:**
```typescript
// ANTES (Incorrecto):
db.prepare(`UPDATE equipo SET cantidad_reservado = cantidad_reservado + ?`).run(cantidad);

// AHORA (Correcto):
// NO actualizar inventario: los equipos ya están con el cliente
// Solo se está extendiendo el periodo de uso
```

### 2. **Bitácoras Duplicadas**
**Problema:**
- Al extender, se creaban nuevas bitácoras activas
- Esto causaba múltiples bitácoras activas para el mismo equipo
- Sistema mostraba equipos "en uso" múltiples veces

**Solución Aplicada:**
```typescript
// ANTES (Incorrecto):
INSERT INTO bitacora_equipo (nueva bitácora para extensión)

// AHORA (Correcto):
UPDATE bitacora_equipo 
SET observaciones = observaciones || ' | Extendido: nueva SE X hasta Y'
WHERE id_solicitud_equipo = ? AND estado_bitacora = 1
```

### 3. **Estado de SE de Extensión**
**Problema:**
- SE de extensión se creaba con estado 1 (SOLICITUD)
- No reflejaba que es un contrato activo inmediatamente

**Solución Aplicada:**
```typescript
// ANTES:
estado_solicitud_equipo = 1  // SOLICITUD

// AHORA:
estado_solicitud_equipo = 4  // DONDE_CLIENTE (Contrato Activo)
```

## 📊 Cambios en el Código

### Archivo: `src/pages/api/contrato/extender/[id].ts`

#### Cambio 1: Eliminada actualización de inventario
```diff
-        // Actualizar inventario: reservar equipos
-        const equipoActual = db.prepare(`
-          SELECT cantidad_disponible, cantidad_reservado
-          FROM equipo WHERE id_equipo = ?
-        `).get(equipo.id_equipo);
-
-        db.prepare(`
-          UPDATE equipo
-          SET cantidad_disponible = cantidad_disponible - ?,
-              cantidad_reservado = cantidad_reservado + ?
-          WHERE id_equipo = ?
-        `).run(cantidad, cantidad, equipo.id_equipo);

+        // NO actualizar inventario: los equipos ya están con el cliente
+        // Solo se está extendiendo el periodo de uso, no reservando equipos adicionales
```

#### Cambio 2: Actualizar bitácoras existentes en lugar de crear nuevas
```diff
-      // Crear registros en bitácora para la NUEVA SE
-      for (const equipo of equipos) {
-        db.prepare(`
-          INSERT INTO bitacora_equipo (
-            id_equipo, id_solicitud_equipo, numero_solicitud_equipo,
-            cantidad_equipo, fecha_inicio, estado_bitacora, observaciones
-          ) VALUES (?, ?, ?, ?, ?, 1, ?)
-        `).run(equipo.id_equipo, nuevaSolicitudId, nuevoNumeroSE, ...);
-      }

+      // Actualizar bitácoras del contrato original (NO crear nuevas)
+      for (const equipo of equipos) {
+        db.prepare(`
+          UPDATE bitacora_equipo
+          SET observaciones = observaciones || ' | Extendido: nueva SE ${nuevoNumeroSE} hasta ${fechaVencimientoStr}'
+          WHERE id_solicitud_equipo = ? AND id_equipo = ? AND estado_bitacora = 1
+        `).run(contratoOriginal.id_solicitud_equipo, equipo.id_equipo);
+      }
```

#### Cambio 3: Estado correcto para SE de extensión
```diff
-        1, // estado_solicitud_equipo: PROCESADA
+        4, // estado_solicitud_equipo: DONDE_CLIENTE (Contrato Activo)
```

## 🔧 Scripts de Limpieza Creados

### `scripts/analizar-inconsistencias-extension.js`
- Identifica problemas potenciales
- Detecta equipos con múltiples bitácoras activas
- Proporciona recomendaciones

### `scripts/limpiar-inconsistencias-extension.js`
- Elimina bitácoras duplicadas de extensiones existentes
- Ejecutado exitosamente: eliminó 1 bitácora duplicada

## 📈 Estado Actual del Sistema

### Antes de la Corrección:
```
❌ Mezcladora #91: 3 bitácoras activas (00007, 00008, 00008-EXT1)
❌ Inventario: cantidad_reservado incrementado incorrectamente
❌ SE Extensión: estado = 1 (SOLICITUD)
```

### Después de la Corrección:
```
✅ Extensiones NO crean bitácoras nuevas (actualizan existentes)
✅ Inventario NO se modifica (equipos ya reservados)
✅ SE Extensión: estado = 4 (Contrato Activo)
✅ Bitácoras duplicadas eliminadas
```

## 🎯 Comportamiento Correcto al Extender

1. **SE Original:**
   - `estado_solicitud_equipo = 9` (EXTENDIDO)
   

2. **SE de Extensión:**
   - Nueva SE: `00007-EXT1, 00007-EXT2`, etc.
   - `estado_solicitud_equipo = 4` (Contrato Activo)
   - `es_extension = 1`
   - `numero_se_origen = 00007`

3. **Contrato Original:**
   - `estado = 3` (EXTENDIDO)

4. **Nuevo Contrato:**
   - Apunta a SE de extensión
   - `estado = 1` (GENERADO)

5. **Inventario:**
   - **NO se modifica** (equipos ya reservados)

6. **Bitácoras:**
   - **NO se crean nuevas**
   - Se actualizan las existentes con nota de extensión
   - Mantienen `estado_bitacora = 1` (ACTIVO)

## ✅ Validación

Ejecutar para verificar:
```bash
node scripts/analizar-inconsistencias-extension.js
```

Debe mostrar:
```
✅ No hay equipos con múltiples bitácoras activas.
```

## 🔮 Próximos Pasos

1. ✅ Probar extensión con el código corregido
2. ✅ Verificar que no se creen bitácoras duplicadas
3. ✅ Confirmar que inventario permanece correcto
4. ✅ Validar estado de SE de extensión (debe ser "Contrato Activo")
