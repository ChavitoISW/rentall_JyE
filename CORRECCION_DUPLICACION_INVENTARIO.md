# Corrección: Duplicación de Movimiento de Inventario en Finalización de Ruta

## Problema Identificado

Al finalizar una hoja de ruta que contiene órdenes de cambio, se estaba moviendo el inventario **dos veces**:

1. **Primera vez**: Al completar cada parada individual (handleCompletarParada en HojaRuta.tsx) ✅ CORRECTO
2. **Segunda vez**: Al finalizar la ruta completa (handlePut en hoja-ruta.ts líneas 452-477) ❌ DUPLICADO

Esto causaba que se agregara 1 unidad adicional a `en_mantenimiento` cada vez que se finalizaba la ruta.

## Solución Aplicada

### Archivo: [src/pages/api/hoja-ruta.ts](../src/pages/api/hoja-ruta.ts#L452-L477)

**Eliminado el bloque de código que movía equipos a mantenimiento al finalizar la ruta:**

```typescript
// ANTES (CÓDIGO ELIMINADO):
// Para cambios: también actualizar equipos a EN_MANTENIMIENTO
const equiposCambio = db.prepare(...).all(id_hoja_ruta);

// Mover equipos de cantidad_alquilado a cantidad_en_mantenimiento
if (equiposCambio.length > 0) {
  // ... código que movía inventario ...
}
```

**AHORA:**
- Solo se actualiza el `estado` de la orden de cambio a COMPLETADA (2)
- NO se toca el inventario
- El inventario ya fue actualizado cuando el chofer completó la parada individual

### Flujo Correcto Ahora:

1. **Crear orden de cambio** → NO actualiza inventario ✅
2. **Agregar a hoja de ruta** → NO actualiza inventario ✅  
3. **Activar hoja de ruta** → Cambia estado de orden a EN_RUTA ✅
4. **Completar parada individual** → SÍ actualiza inventario (equipo_actual → mantenimiento, equipo_nuevo → alquilado) ✅
5. **Finalizar hoja de ruta completa** → Solo actualiza estados, NO inventario ✅

## Verificación

Para probar que la corrección funciona:

1. Restaurar inventario actual:
   ```bash
   node scripts/correccion-final-inventario.js
   ```

2. Reiniciar servidor Next.js para cargar el código corregido:
   ```bash
   # Detener servidor (Ctrl+C)
   npm run dev
   ```

3. Crear orden de cambio desde Contratos
4. Agregar orden a hoja de ruta
5. Completar la parada de cambio
6. Finalizar la hoja de ruta completa
7. Verificar inventario: NO debe haber duplicación

---

**Fecha de corrección**: 14 de marzo de 2026  
**Estado**: ✅ Corregido - Eliminada duplicación de movimiento de inventario
