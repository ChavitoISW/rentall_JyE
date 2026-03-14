# FIX: ÓRDENES NO_EJECUTADAS DISPONIBLES PARA REASIGNACIÓN

**Fecha:** 13 de marzo de 2026

## 🎯 Problema Identificado

Las órdenes de entrega y recolección que fueron marcadas como NO_EJECUTADAS o FALLIDAS en una hoja de ruta NO estaban volviendo a aparecer en la lista de órdenes disponibles para asignar a nuevas rutas.

## 🔍 Causa Raíz

El endpoint `/api/hoja-ruta/pendientes.ts` no tenía filtros específicos para excluir únicamente las órdenes que están actualmente en rutas ACTIVAS (estados PENDIENTE o EN_RUTA), por lo que todas las órdenes con cualquier registro en `detalle_hoja_ruta` quedaban excluidas, incluyendo las NO_EJECUTADAS/FALLIDAS que deberían estar disponibles para reasignación.

## ✅ Solución Implementada

### 1. Actualización del Endpoint `/api/hoja-ruta/pendientes.ts`

Se modificaron los queries para las tres tipos de órdenes:

#### **Entregas (Contratos):**
```sql
-- ANTES: Sin filtro por estado de detalle de ruta
WHERE se.estado_solicitud_equipo = 2
  AND se.estado_solicitud_equipo NOT IN (7, 8)
  AND co.estado NOT IN (0, 2)

-- DESPUÉS: Excluye solo las que están en rutas activas
WHERE se.estado_solicitud_equipo = 2
  AND se.estado_solicitud_equipo NOT IN (7, 8)
  AND co.estado NOT IN (0, 2)
  AND se.id_solicitud_equipo NOT IN (
    SELECT id_referencia
    FROM detalle_hoja_ruta
    WHERE tipo_operacion = 0
      AND estado_detalle IN (0, 1)  -- Solo PENDIENTE y EN_RUTA
  )
```

#### **Recolecciones:**
```sql
-- ANTES: Sin filtro por estado de detalle de ruta
WHERE estado = 0

-- DESPUÉS: Excluye solo las que están en rutas activas
WHERE estado = 0
  AND id_orden_recoleccion NOT IN (
    SELECT id_referencia
    FROM detalle_hoja_ruta
    WHERE tipo_operacion = 1
      AND estado_detalle IN (0, 1)  -- Solo PENDIENTE y EN_RUTA
  )
```

#### **Cambios de Equipo:**
```sql
-- ANTES: Sin filtro por estado de detalle de ruta
WHERE estado = 0

-- DESPUÉS: Excluye solo las que están en rutas activas
WHERE estado = 0
  AND id_orden_cambio NOT IN (
    SELECT id_referencia
    FROM detalle_hoja_ruta
    WHERE tipo_operacion = 2
      AND estado_detalle IN (0, 1)  -- Solo PENDIENTE y EN_RUTA
  )
```

### 2. Corrección de Estados Inconsistentes

Se creó el script `corregir-estados-ordenes-no-ejecutadas.js` que:

- **Entregas NO_EJECUTADAS/FALLIDAS:** Asegura que tengan `estado_solicitud_equipo = 2` (CONTRATO_GENERADO)
- **Recolecciones NO_EJECUTADAS/FALLIDAS:** Asegura que tengan `estado = 0` (PENDIENTE)
- **Cambios NO_EJECUTADOS/FALLIDOS:** Asegura que tengan `estado = 0` (PENDIENTE)

**Resultados de la ejecución:**
- ✅ 1 entrega corregida (SE #00008: estado 4 → 2)
- ✅ 1 recolección corregida (Orden #00003: estado 2 → 0)
- ✅ 0 cambios corregidos

## 🧪 Scripts de Verificación Creados

1. **`verificar-ordenes-no-ejecutadas.js`**
   - Muestra todas las órdenes NO_EJECUTADAS/FALLIDAS
   - Verifica qué órdenes están disponibles según el nuevo filtro
   - Muestra el historial de rutas de cada orden

2. **`corregir-estados-ordenes-no-ejecutadas.js`**
   - Corrige estados inconsistentes en la base de datos
   - Se ejecuta en transacción (todo o nada)
   - Muestra un reporte detallado de las correcciones

## 📊 Resultados Finales

**Después de aplicar el fix:**

✅ **1 entrega disponible:**
- Contrato #00008 - SE #00002 (Rosalinda Del Prado)
- Estado: FALLIDA → Disponible para reasignación

✅ **1 recolección disponible:**
- Orden #00003 (10x Andamios Normales)
- Estado: FALLIDA → Disponible para reasignación

## 🎯 Estados de Detalle de Ruta

| Estado | Valor | Incluido en Disponibles |
|--------|-------|-------------------------|
| PENDIENTE | 0 | ❌ No (está en una ruta activa) |
| EN_RUTA | 1 | ❌ No (está en una ruta activa) |
| COMPLETADA | 2 | ✅ N/A (ya se completó) |
| NO_EJECUTADA | 3 | ✅ Sí (puede reasignarse) |
| FALLIDA | 4 | ✅ Sí (puede reasignarse) |

## 🔄 Flujo Correcto

### Entrega NO_EJECUTADA/FALLIDA:
1. Usuario marca parada como NO_EJECUTADA/FALLIDA
2. `estado_detalle` en `detalle_hoja_ruta` → 3 o 4
3. `estado_solicitud_equipo` → 2 (CONTRATO_GENERADO)
4. Inventario permanece en `cantidad_alquilado`
5. **La entrega vuelve a aparecer en órdenes disponibles**
6. Puede asignarse a una nueva hoja de ruta

### Recolección NO_EJECUTADA/FALLIDA:
1. Usuario marca parada como NO_EJECUTADA/FALLIDA
2. `estado_detalle` en `detalle_hoja_ruta` → 3 o 4
3. `estado` en `orden_recoleccion` → 0 (PENDIENTE)
4. Inventario permanece en `cantidad_alquilado` o `cantidad_en_recoleccion`
5. **La recolección vuelve a aparecer en órdenes disponibles**
6. Puede asignarse a una nueva hoja de ruta

## ✨ Beneficios

1. **Flexibilidad operativa:** Las entregas/recolecciones que no se pudieron completar se pueden reprogramar fácilmente
2. **No se pierden órdenes:** Las órdenes NO_EJECUTADAS no quedan "atrapadas" en el sistema
3. **Visibilidad completa:** Los operadores pueden ver todas las órdenes pendientes, incluyendo las que fallaron anteriormente
4. **Historial completo:** Se mantiene el registro de intentos anteriores en `detalle_hoja_ruta`

## 🚀 Archivos Modificados

- ✅ `src/pages/api/hoja-ruta/pendientes.ts` - Lógica principal del fix
- ✅ `scripts/verificar-ordenes-no-ejecutadas.js` - Script de verificación
- ✅ `scripts/corregir-estados-ordenes-no-ejecutadas.js` - Script de corrección

## 📝 Notas Adicionales

- El fix es completamente retroactivo: órdenes NO_EJECUTADAS existentes vuelven a estar disponibles
- Los datos corregidos manualmente se mantienen consistentes con el nuevo flujo
- Los scripts de verificación pueden ejecutarse en cualquier momento para validar el estado del sistema

---

**✅ FIX COMPLETADO Y VERIFICADO**
