# 🎯 Nuevo Sistema de Inventario - Columnas por Estado

## 📋 Concepto

**ANTES:**
```
id_equipo: 1
nombre_equipo: "Andamios Angostos"
cantidad_equipo: 500
id_estado_equipo: 1 (DISPONIBLE) ← ❌ TODO el inventario en UN solo estado
```

**DESPUÉS:**
```
id_equipo: 1
nombre_equipo: "Andamios Angostos"
cantidad_equipo: 500 (TOTAL)
├─ cantidad_disponible: 250        ← 🟢 Listo para alquilar
├─ cantidad_alquilado: 150         ← 🔵 Con clientes
├─ cantidad_en_transito: 0         ← 🟡 Camino al cliente
├─ cantidad_en_recoleccion: 0     ← 🟠 Regresando
├─ cantidad_en_mantenimiento: 100  ← 🔴 En reparación
└─ cantidad_reservado: 0           ← 🟣 Reservados para contrato

✅ cantidad_equipo = suma de todas las columnas de cantidad
```

## 🎁 Ventajas

✅ **UN solo registro por tipo de equipo** - No se crean registros duplicados
✅ **Rastreo en tiempo real** - Sabes exactamente cuántos en cada estado
✅ **Inventario consolidado funciona** - Sumas las columnas
✅ **Consultas rápidas** - No requiere JOINS adicionales
✅ **Mantiene FK a categoria_equipo** - Precios funcionan igual

## 🔧 Estructura de la Tabla

```sql
CREATE TABLE equipo (
  id_equipo INTEGER PRIMARY KEY,
  nombre_equipo TEXT,
  cantidad_equipo INTEGER,              -- TOTAL de unidades
  id_equipo_categoria INTEGER,          -- FK para precios
  id_equipo_especifico INTEGER,
  
  -- NUEVAS COLUMNAS (después de migración)
  cantidad_disponible INTEGER DEFAULT 0,
  cantidad_alquilado INTEGER DEFAULT 0,
  cantidad_en_transito INTEGER DEFAULT 0,
  cantidad_en_recoleccion INTEGER DEFAULT 0,
  cantidad_en_mantenimiento INTEGER DEFAULT 0,
  cantidad_reservado INTEGER DEFAULT 0,
  
  -- MANTENER POR COMPATIBILIDAD (pero ya no se usa para lógica)
  id_estado_equipo INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📝 Cómo Usar en el Código

### 1. Al Crear Solicitud de Equipo (Reservar)

```typescript
// Cuando se crea una SE, reservar equipos
const cantidadReservar = 50;

// Obtener equipo actual
const equipo = await equipoModel.getById(idEquipo);

// Verificar disponibilidad
if (equipo.cantidad_disponible < cantidadReservar) {
  throw new Error('No hay suficientes equipos disponibles');
}

// Actualizar: disponible → reservado
await equipoModel.update(idEquipo, {
  cantidad_disponible: equipo.cantidad_disponible - cantidadReservar,
  cantidad_reservado: equipo.cantidad_reservado + cantidadReservar
});
```

### 2. Al Generar Contrato (Alquilar)

```typescript
// Cuando SE pasa de SOLICITUD → CONTRATO_GENERADO
const cantidadAlquilar = 50;

const equipo = await equipoModel.getById(idEquipo);

// Actualizar: reservado → alquilado
await equipoModel.update(idEquipo, {
  cantidad_reservado: equipo.cantidad_reservado - cantidadAlquilar,
  cantidad_alquilado: equipo.cantidad_alquilado + cantidadAlquilar
});
```

### 3. Al Entregar Equipo (En Tránsito)

```typescript
// Cuando hoja de ruta inicia entrega
const cantidadEntregar = 50;

const equipo = await equipoModel.getById(idEquipo);

// Actualizar: alquilado → en_transito
await equipoModel.update(idEquipo, {
  cantidad_alquilado: equipo.cantidad_alquilado - cantidadEntregar,
  cantidad_en_transito: equipo.cantidad_en_transito + cantidadEntregar
});
```

### 4. Al Completar Entrega (Donde Cliente)

```typescript
// Cuando se completa la entrega
// En este caso, vuelve a alquilado (está con el cliente)
const cantidadEntregada = 50;

const equipo = await equipoModel.getById(idEquipo);

// Actualizar: en_transito → alquilado
await equipoModel.update(idEquipo, {
  cantidad_en_transito: equipo.cantidad_en_transito - cantidadEntregada,
  cantidad_alquilado: equipo.cantidad_alquilado + cantidadEntregada
});
```

### 5. Al Recolectar Equipo

```typescript
// Cuando se inicia recolección
const cantidadRecolectar = 30;

const equipo = await equipoModel.getById(idEquipo);

// Actualizar: alquilado → en_recoleccion
await equipoModel.update(idEquipo, {
  cantidad_alquilado: equipo.cantidad_alquilado - cantidadRecolectar,
  cantidad_en_recoleccion: equipo.cantidad_en_recoleccion + cantidadRecolectar
});
```

### 6. Al Completar Recolección (A Mantenimiento)

```typescript
// Cuando se completa la recolección
const cantidadRecolectada = 30;

const equipo = await equipoModel.getById(idEquipo);

// Actualizar: en_recoleccion → en_mantenimiento
await equipoModel.update(idEquipo, {
  cantidad_en_recoleccion: equipo.cantidad_en_recoleccion - cantidadRecolectada,
  cantidad_en_mantenimiento: equipo.cantidad_en_mantenimiento + cantidadRecolectada
});
```

### 7. Al Marcar Disponible desde Mantenimiento

```typescript
// Cuando se completa el mantenimiento
const cantidadLista = 20;

const equipo = await equipoModel.getById(idEquipo);

// Actualizar: en_mantenimiento → disponible
await equipoModel.update(idEquipo, {
  cantidad_en_mantenimiento: equipo.cantidad_en_mantenimiento - cantidadLista,
  cantidad_disponible: equipo.cantidad_disponible + cantidadLista
});
```

## 🔄 Flujo Completo del Ciclo de Vida

```
┌─────────────────┐
│   DISPONIBLE    │ ← Estado inicial
│      250        │
└────────┬────────┘
         │ SE creada (reservar)
         ↓
┌─────────────────┐
│    RESERVADO    │
│       50        │
└────────┬────────┘
         │ Contrato generado
         ↓
┌─────────────────┐
│   ALQUILADO     │
│       50        │
└────────┬────────┘
         │ Hoja ruta (entrega)
         ↓
┌─────────────────┐
│  EN_TRANSITO    │
│       50        │
└────────┬────────┘
         │ Completar entrega
         ↓
┌─────────────────┐
│   ALQUILADO     │ ← Con el cliente
│       50        │
└────────┬────────┘
         │ Orden recolección
         ↓
┌─────────────────┐
│ EN_RECOLECCION  │
│       50        │
└────────┬────────┘
         │ Completar recolección
         ↓
┌─────────────────┐
│ EN_MANTENIMIENTO│
│       50        │
└────────┬────────┘
         │ Marcar disponible
         ↓
┌─────────────────┐
│   DISPONIBLE    │ ← Listo para nuevo ciclo
│      250        │
└─────────────────┘
```

## 📊 Consultas Útiles

### Ver inventario consolidado
```sql
SELECT 
  nombre_equipo,
  cantidad_equipo as total,
  cantidad_disponible,
  cantidad_alquilado,
  cantidad_en_transito,
  cantidad_en_recoleccion,
  cantidad_en_mantenimiento,
  cantidad_reservado
FROM equipo
ORDER BY nombre_equipo;
```

### Verificar integridad (suma debe = total)
```sql
SELECT 
  nombre_equipo,
  cantidad_equipo as total,
  (cantidad_disponible + cantidad_alquilado + cantidad_en_transito + 
   cantidad_en_recoleccion + cantidad_en_mantenimiento + cantidad_reservado) as suma,
  CASE 
    WHEN cantidad_equipo = (cantidad_disponible + cantidad_alquilado + cantidad_en_transito + 
                            cantidad_en_recoleccion + cantidad_en_mantenimiento + cantidad_reservado)
    THEN '✅'
    ELSE '❌'
  END as status
FROM equipo;
```

### Equipos disponibles para alquilar
```sql
SELECT 
  nombre_equipo,
  cantidad_disponible,
  precio_dia,
  precio_semana
FROM equipo e
LEFT JOIN categoria_equipo ce ON e.id_equipo_categoria = ce.id
WHERE cantidad_disponible > 0
ORDER BY nombre_equipo;
```

### Equipos que necesitan mantenimiento
```sql
SELECT 
  nombre_equipo,
  cantidad_en_mantenimiento
FROM equipo
WHERE cantidad_en_mantenimiento > 0
ORDER BY cantidad_en_mantenimiento DESC;
```

## 🚀 Migración

1. **Ejecutar script de migración:**
   ```bash
   node scripts/migrate-equipo-estados-columnas.js
   ```

2. **Verificar resultado:**
   - Todas las columnas nuevas creadas
   - Datos migrados según estado actual
   - Sumas coinciden con cantidad_equipo

3. **Actualizar código:**
   - Reemplazar actualizaciones de `id_estado_equipo`
   - Usar columnas `cantidad_*` en su lugar
   - Mantener validación: suma = cantidad_equipo

## ⚠️ Reglas Importantes

1. **NUNCA crear registros nuevos** (excepto en mantenimiento de equipos)
2. **SIEMPRE validar** que la suma de columnas = cantidad_equipo
3. **SIEMPRE verificar** disponibilidad antes de reservar/alquilar
4. **MANTENER atomicidad** - usar transacciones para actualizaciones
5. **id_estado_equipo se mantiene** por compatibilidad pero ya no controla lógica

## 🎯 Beneficios vs Solución Anterior

### ❌ Antes (dividir registros)
- Crear registro nuevo con 3 unidades → EN_MANTENIMIENTO
- Reducir registro original de 15 a 12 → DISPONIBLE
- Resultado: **2 registros** para el mismo equipo
- Problema: Registros se multiplican infinitamente

### ✅ Ahora (columnas por estado)
- UN registro con 15 unidades totales
- cantidad_en_mantenimiento: 3
- cantidad_disponible: 12
- Resultado: **1 registro** siempre
- Beneficio: Inventario consolidado real

## 📝 Ejemplo Real

```typescript
// Equipo: Andamios Angostos (ID: 75)
// Estado inicial después de migración:
{
  id_equipo: 75,
  nombre_equipo: "Andamios Angostos",
  cantidad_equipo: 500,
  cantidad_disponible: 500,
  cantidad_alquilado: 0,
  cantidad_en_transito: 0,
  cantidad_en_recoleccion: 0,
  cantidad_en_mantenimiento: 0,
  cantidad_reservado: 0
}

// Cliente crea SE solicitando 50 andamios → RESERVAR
{
  cantidad_equipo: 500,
  cantidad_disponible: 450,  // 500 - 50
  cantidad_reservado: 50     // 0 + 50
}

// SE pasa a contrato → ALQUILAR
{
  cantidad_equipo: 500,
  cantidad_disponible: 450,
  cantidad_reservado: 0,     // 50 - 50
  cantidad_alquilado: 50     // 0 + 50
}

// Entregar al cliente → EN_TRANSITO
{
  cantidad_equipo: 500,
  cantidad_disponible: 450,
  cantidad_alquilado: 0,     // 50 - 50
  cantidad_en_transito: 50   // 0 + 50
}

// Completar entrega → ALQUILADO (con cliente)
{
  cantidad_equipo: 500,
  cantidad_disponible: 450,
  cantidad_en_transito: 0,   // 50 - 50
  cantidad_alquilado: 50     // 0 + 50
}

// Recolectar 30 unidades (cliente devuelve parcial)
{
  cantidad_equipo: 500,
  cantidad_disponible: 450,
  cantidad_alquilado: 20,          // 50 - 30
  cantidad_en_recoleccion: 30      // 0 + 30
}

// Completar recolección → MANTENIMIENTO
{
  cantidad_equipo: 500,
  cantidad_disponible: 450,
  cantidad_alquilado: 20,
  cantidad_en_recoleccion: 0,      // 30 - 30
  cantidad_en_mantenimiento: 30    // 0 + 30
}

// Marcar 15 como disponibles después de mantenimiento
{
  cantidad_equipo: 500,
  cantidad_disponible: 465,        // 450 + 15
  cantidad_alquilado: 20,
  cantidad_en_mantenimiento: 15    // 30 - 15
}

// Verificación: 465 + 20 + 15 = 500 ✅
```

## 🎓 Conclusión

Este sistema te da:
- ✅ Inventario consolidado real (1 registro por equipo)
- ✅ Trazabilidad completa de estados
- ✅ No crear registros infinitos
- ✅ Mantiene compatibilidad con precios
- ✅ Consultas rápidas y eficientes
- ✅ Fácil de mantener y entender
