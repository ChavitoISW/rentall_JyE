# SISTEMA DE ÓRDENES DE CAMBIO - DOCUMENTACIÓN

## 📋 Descripción General

Sistema completo que permite a los usuarios generar órdenes de cambio de equipos para contratos activos. Los cambios se realizan entre equipos de la misma categoría y actualizan automáticamente el inventario consolidado.

## ✅ Componentes Implementados

### 1. Base de Datos
**Tabla:** `orden_cambio_equipo`
- `id_orden_cambio` - ID único autoincremental
- `numero_orden_cambio` - Número único formato 00001, 00002, etc.
- `id_solicitud_equipo` - Referencia a la SE del contrato
- `numero_solicitud_equipo` - Número de la SE
- `id_equipo_actual` - ID del equipo a retirar
- `nombre_equipo_actual` - Nombre del equipo a retirar
- `id_equipo_nuevo` - ID del equipo a instalar
- `nombre_equipo_nuevo` - Nombre del equipo a instalar
- `motivo_cambio` - Justificación del cambio (OBLIGATORIO)
- `fecha_creacion` - Fecha de creación automática
- `fecha_programada` - Fecha programada para el cambio
- `estado` - 0=PENDIENTE, 1=EN_RUTA, 2=COMPLETADA, 3=CANCELADA
- `observaciones` - Notas adicionales
- Campos de dirección (provincia, canton, distrito, otras_senas)
- Información de contacto (nombre_cliente, telefono_cliente)

### 2. API Endpoints
**Archivo:** `src/pages/api/orden-cambio.ts`

#### GET `/api/orden-cambio`
Listar órdenes de cambio con filtros opcionales:
- `id_orden_cambio` - Filtrar por ID
- `estado` - Filtrar por estado
- `numero_solicitud_equipo` - Filtrar por SE

#### POST `/api/orden-cambio`
Crear nueva orden de cambio
**Body requerido:**
```json
{
  "id_solicitud_equipo": 1,
  "numero_solicitud_equipo": "00001",
  "id_equipo_actual": 3,
  "nombre_equipo_actual": "Mezcladora #91",
  "id_equipo_nuevo": 5,
  "nombre_equipo_nuevo": "Mezcladora #113",
  "motivo_cambio": "Equipo presenta fallas mecánicas",
  "nombre_cliente": "Juan Pérez",
  "provincia": "San José",
  "canton": "Central",
  "distrito": "Carmen"
}
```

**Proceso automático al crear:**
1. Genera número único de orden
2. Crea registro en `orden_cambio_equipo`
3. **Actualiza inventario automáticamente:**
   - Equipo actual: `cantidad_alquilado - 1`, `cantidad_en_recoleccion + 1`
   - Equipo nuevo: `cantidad_disponible - 1`, `cantidad_alquilado + 1`
4. Valida que el equipo nuevo tenga unidades disponibles

#### PUT `/api/orden-cambio?id_orden_cambio=X`
Actualizar orden (estado, fecha_programada, observaciones)

#### DELETE `/api/orden-cambio?id_orden_cambio=X`
Eliminar orden (solo si no ha sido ejecutada)

### 3. Componente UI - Listado
**Archivo:** `src/componentes/OrdenesCambio.tsx`
**Ruta:** `/ordenes-cambio`

**Funcionalidades:**
- Listado de todas las órdenes de cambio
- Búsqueda por N° orden, SE, cliente o equipo
- Filtro por estado (Pendiente, En Ruta, Completada, Cancelada)
- Ver detalle de orden
- Cancelar orden (solo si está pendiente)
- Badges de colores por estado
- Indicación visual: Equipo actual (rojo ←) | Equipo nuevo (verde →)

### 4. Integración en Contratos
**Archivo:** `src/componentes/Contratos.tsx`

**Botón "Generar Cambio":**
- Visible solo para contratos en estado GENERADO
- Carga equipos activos del contrato desde bitácora
- Si hay múltiples equipos, permite seleccionar cuál cambiar

**Modal de Generación:**
- Muestra equipo actual a retirar
- Lista equipos disponibles de la misma categoría
- Campo obligatorio: Motivo del cambio (máx 500 caracteres)
- Validaciones antes de crear:
  * Motivo no vacío
  * Equipo nuevo seleccionado
  * Equipo nuevo tiene unidades disponibles
- Confirmación con mensaje informativo
- Actualización automática de inventario tras confirmar

### 5. Integración con Hojas de Ruta
**Archivo:** `src/componentes/HojaRuta.tsx` (ya existía)

Las órdenes de cambio se pueden agregar a hojas de ruta igual que las órdenes de recolección:
- `tipo_operacion = 2` (CAMBIO)
- Se asignan a choferes junto con entregas y recolecciones
- Al completar la parada, se actualiza el estado de la orden
- Manejo de estados: Completado, Fallido, No Ejecutada

### 6. Menú de Navegación
**Archivo:** `src/componentes/Menu.tsx`

Nuevo enlace en "Rutas y Logística":
- Hojas de Ruta
- Órdenes de Recolección
- **Órdenes de Cambio** ← NUEVO

### 7. Estilos
**Archivo:** `src/styles/SolicitudEquipo.module.css`

Nuevos estilos agregados:
- `.btnInfo` - Botón color cian para "Generar Cambio"
- `.motivoText` - Estilo para texto de motivo truncado en tabla

## 🔄 Flujo de Trabajo

### Escenario 1: Crear Orden de Cambio desde Contrato Activo
1. Usuario navega a **Contratos**
2. Identifica contrato en estado GENERADO
3. Clic en botón **"Generar Cambio"**
4. Sistema carga equipos activos del contrato
5. Usuario ve modal con:
   - Equipo actual (resaltado en amarillo)
   - Selector de equipos nuevos de la misma categoría
   - Campo de motivo (obligatorio)
6. Usuario selecciona equipo nuevo y escribe motivo
7. Clic en **"Crear Orden de Cambio"**
8. Sistema:
   - Valida datos
   - Crea orden con número único
   - **Actualiza inventario:**
     * Equipo actual → Estado "En Recolección"
     * Equipo nuevo → Estado "Alquilado"
   - Muestra confirmación con número de orden
9. Orden queda en estado PENDIENTE lista para asignar a ruta

### Escenario 2: Gestionar Órdenes de Cambio
1. Usuario navega a **Rutas y Logística → Órdenes de Cambio**
2. Ve listado completo de órdenes
3. Puede:
   - Buscar por N° orden, cliente o equipo
   - Filtrar por estado
   - Ver detalle completo de cada orden
   - Cancelar órdenes pendientes

### Escenario 3: Asignar Cambio a Hoja de Ruta
1. Usuario navega a **Hojas de Ruta**
2. Crea nueva hoja o edita borrador
3. En "Órdenes Disponibles" aparecen cambios pendientes
4. Selecciona orden de cambio
5. Se agrega a la ruta junto con entregas y recolecciones
6. Chofer ejecuta la orden:
   - Recoge equipo viejo
   - Instala equipo nuevo
   - Marca parada como completada

### Escenario 4: Completar Orden en Hoja de Ruta
1. Chofer abre su hoja de ruta asignada
2. Ve parada de tipo "Cambio"
3. Al gestionar:
   - Sistema muestra equipos involucrados
   - Chofer confirma ejecución
4. Al marcar como COMPLETADA:
   - Orden cambia a estado COMPLETADA
   - Sistema actualiza bitácoras de equipos
   - Inventario ya está actualizado (se hizo al crear orden)

## ⚠️ Validaciones y Restricciones

### Al Crear Orden:
✅ Contrato debe estar en estado GENERADO
✅ Debe existir al menos un equipo activo en el contrato
✅ Equipo nuevo debe ser de la misma categoría que el actual
✅ Equipo nuevo debe tener unidades disponibles (cantidad_disponible > 0)
✅ Motivo del cambio es obligatorio (máx 500 caracteres)
✅ No se cambia estado de SE ni contrato

### Actualización de Inventario:
- Equipo actual:
  * cantidad_alquilado -= 1
  * cantidad_en_recoleccion += 1
- Equipo nuevo:
  * cantidad_disponible -= 1
  * cantidad_alquilado += 1

### Estados de Orden:
- **PENDIENTE (0):** Orden creada, esperando asignación a ruta
- **EN_RUTA (1):** Asignada a hoja de ruta activa
- **COMPLETADA (2):** Cambio ejecutado exitosamente
- **CANCELADA (3):** Orden cancelada, inventario debe revertirse manualmente

## 📊 Estados de Equipo en el Sistema

| Estado | Campo Inventario | Descripción |
|--------|------------------|-------------|
| Disponible | `cantidad_disponible` | En bodega, listo para alquilar |
| Alquilado | `cantidad_alquilado` | Activo en contrato con cliente |
| En Recolección | `cantidad_en_recoleccion` | Programado para recoger |
| En Tránsito | `cantidad_en_transito` | En proceso de entrega |
| En Mantenimiento | `cantidad_en_mantenimiento` | Devuelto, necesita revisión |
| Reservado | `cantidad_reservado` | Apartado en solicitud sin contrato |

## 🛠️ Archivos Modificados/Creados

### Nuevos Archivos:
1. `src/componentes/OrdenesCambio.tsx` - Componente de listado
2. `src/pages/ordenes-cambio.tsx` - Página Next.js
3. `scripts/verificar-sistema-cambio.js` - Script de verificación

### Archivos Modificados:
1. `src/componentes/Contratos.tsx` - Agregado botón y modal de cambio
2. `src/componentes/Menu.tsx` - Agregado enlace en navegación
3. `src/pages/api/orden-cambio.ts` - Agregada lógica de inventario
4. `src/styles/SolicitudEquipo.module.css` - Nuevos estilos

### Archivos Existentes (No Modificados):
- `src/lib/database.ts` - Tabla ya existía
- `src/types/ordenCambio.ts` - Tipos ya existían
- `src/componentes/HojaRuta.tsx` - Integración ya existía

## 🔧 Comandos Útiles

### Verificar Sistema:
```bash
node scripts/verificar-sistema-cambio.js
```

### Ver Órdenes en DB:
```sql
SELECT * FROM orden_cambio_equipo ORDER BY fecha_creacion DESC;
```

### Ver Inventario Afectado:
```sql
SELECT 
  nombre_equipo,
  cantidad_disponible,
  cantidad_alquilado,
  cantidad_en_recoleccion
FROM equipo 
WHERE id_equipo IN (
  SELECT id_equipo_actual FROM orden_cambio_equipo
  UNION
  SELECT id_equipo_nuevo FROM orden_cambio_equipo
);
```

## ✅ Testing Recomendado

1. **Crear orden de cambio:**
   - Verificar que solo permite equipos de la misma categoría
   - Verificar que valida disponibilidad del equipo nuevo
   - Verificar que actualiza inventario correctamente
   - Verificar que genera número único

2. **Ver listado:**
   - Verificar filtros funcionen correctamente
   - Verificar búsqueda por texto
   - Verificar detalle muestra toda la información

3. **Integración con rutas:**
   - Verificar que aparece en órdenes disponibles
   - Verificar que se puede asignar a ruta
   - Verificar estados se actualizan al completar

4. **Casos extremos:**
   - Intentar cambiar sin motivo (debe rechazar)
   - Intentar cambiar por equipo sin disponibilidad (debe rechazar)
   - Intentar cambiar por equipo de otra categoría (debe rechazar)
   - Cancelar orden y verificar que se puede recrear

## 🎯 Próximas Mejoras (Opcionales)

1. Revertir inventario automáticamente al cancelar orden
2. Historial de cambios por contrato
3. Reportes de equipos más cambiados
4. Notificaciones automáticas al crear orden
5. Fotografías de evidencia al completar cambio
6. Firma digital del cliente en el cambio

---

**Fecha de Implementación:** 14 de marzo de 2026
**Versión:** 1.0
**Estado:** ✅ Completado y Funcional
