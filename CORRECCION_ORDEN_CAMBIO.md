# Corrección del Sistema de Orden de Cambio - Inventario

## Problema Identificado

El sistema estaba actualizando el inventario **al crear** la orden de cambio, cuando debería actualizarse **al ejecutar** la orden en la hoja de ruta.

### Síntomas:
- Al crear una orden de cambio, ambos equipos se movían incorrectamente a `en_mantenimiento`
- El equipo actual tenía valores negativos en `cantidad_alquilado`
- Descuadre del inventario

## Solución Implementada

### 1. **Archivo: [`src/pages/api/orden-cambio.ts`](../src/pages/api/orden-cambio.ts)**

#### POST Handler (Líneas ~59-120)
**ANTES**: Actualizaba inventario en transacción al crear la orden
```typescript
// 3. Actualizar inventario: Equipo actual (alquilado → en_recoleccion)
// 4. Actualizar inventario: Equipo nuevo (disponible → alquilado)
```

**DESPUÉS**: Solo crea el registro, NO toca inventario
```typescript
// 3. Obtener la orden creada (NO se actualiza inventario aquí, 
//    solo cuando el chofer ejecuta la orden de cambio en la hoja de ruta)
```

#### PUT Handler (Líneas ~132-198)
**AGREGADO**: Lógica de inventario cuando `actualizar_inventario: true` y `estado: 2` (COMPLETADA)
```typescript
if (actualizar_inventario === true && estado === 2) {
  // 1. Equipo actual: alquilado → en_mantenimiento
  // 2. Equipo nuevo: disponible → alquilado
}
```

### 2. **Archivo: [`src/componentes/HojaRuta.tsx`](../src/componentes/HojaRuta.tsx)**

#### Línea ~736-756
**MODIFICADO**: Al completar orden de cambio, envía flag `actualizar_inventario: true` y estado correcto (2)
```typescript
await fetch(`/api/orden-cambio?id_orden_cambio=${paradaActual.id_referencia}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    estado: 2, // COMPLETADA (corregido de 1 a 2)
    actualizar_inventario: true // Flag para mover inventario
  })
});
```

## Flujo Corregido

### Al Crear Orden de Cambio:
1. ✅ Se crea registro en `orden_cambio_equipo`
2. ✅ Estado = 0 (PENDIENTE)
3. ✅ **Inventario NO cambia**

### Al Ejecutar en Hoja de Ruta (Completada):
1. ✅ Equipo actual: `cantidad_alquilado` - 1, `cantidad_en_mantenimiento` + 1
2. ✅ Equipo nuevo: `cantidad_disponible` - 1, `cantidad_alquilado` + 1
3. ✅ Estado orden = 2 (COMPLETADA)

## Corrección del Inventario Descuadrado

Se ejecutó el script [`scripts/corregir-inventario-cambio.js`](../scripts/corregir-inventario-cambio.js) para restaurar el inventario:

**ANTES de corrección**:
- Mezcladora #91: alquilado = -1 ❌, en_mantenimiento = 1 ❌
- Mezcladora #113: alquilado = 0 ❌, en_mantenimiento = 1 ❌

**DESPUÉS de corrección**:
- Mezcladora #91: alquilado = 0 ✅, en_recoleccion = 1 ✅
- Mezcladora #113: alquilado = 1 ✅, en_mantenimiento = 0 ✅

## Prueba de Verificación

Script: [`scripts/probar-orden-cambio-sin-inventario.js`](../scripts/probar-orden-cambio-sin-inventario.js)

**Resultado**: ✅ PERFECTO
- Creó orden #00002
- Inventario permaneció sin cambios
- Confirmación: "El inventario NO se afectó al crear la orden"

## Estados de Orden de Cambio

- **0** = PENDIENTE (recién creada, sin hoja de ruta)
- **1** = EN_RUTA (asignada a hoja de ruta, no ejecutada)
- **2** = COMPLETADA (chofer ejecutó el cambio, inventario movido)
- **3** = CANCELADA (orden eliminada o fallida)

## Archivos Modificados

1. [`src/pages/api/orden-cambio.ts`](../src/pages/api/orden-cambio.ts)
   - Eliminadas líneas 116-150 del POST handler
   - Agregada lógica de inventario en PUT handler (líneas 145-190)

2. [`src/componentes/HojaRuta.tsx`](../src/componentes/HojaRuta.tsx)
   - Modificadas líneas 753-756 para enviar `actualizar_inventario: true`
   - Corregido estado de 1 a 2 (COMPLETADA)

## Scripts de Utilidad

1. [`scripts/diagnosticar-descuadre-cambio.js`](../scripts/diagnosticar-descuadre-cambio.js) - Diagnostica descuadres
2. [`scripts/corregir-inventario-cambio.js`](../scripts/corregir-inventario-cambio.js) - Corrige inventario
3. [`scripts/probar-orden-cambio-sin-inventario.js`](../scripts/probar-orden-cambio-sin-inventario.js) - Prueba sistema corregido

---

**Fecha de corrección**: 14 de marzo de 2026  
**Estado**: ✅ Corregido y probado
