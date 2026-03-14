# Funcionalidad de Extensión de Contratos

## ✅ Implementación Completada

### **1. Backend API**
**Archivo:** `src/pages/api/contrato/extender/[id].ts`

**Endpoint:** `POST /api/contrato/extender/{id_contrato}`

**Funcionalidad:**
- Valida que el contrato esté en estado GENERADO
- Obtiene la SE original completa
- Calcula fecha de inicio automáticamente (fecha_vencimiento + 1 día)
- Crea nueva SE con:
  - Mismo cliente
  - Mismos equipos pero con parámetros editables
  - Estado: CONTRATO_GENERADO (4)
- Crea nuevo contrato en estado GENERADO (1)
- Calcula precios según tarifas actuales del sistema
- Actualiza inventario (reserva equipos)
- Crea registro en `pago_contrato` con:
  - total_contrato
  - iva_contrato
  - monto_pendiente = total
  - estado_pago = 0 (PENDIENTE)
- Crea registros en bitácora_equipo

**Request Body:**
```json
{
  "equipos": [
    {
      "id_equipo": 1,
      "cantidad": 1,
      "periodicidad": "Mensual",
      "cantidad_periodos": 2,
      "fecha_devolucion": "2026-05-13"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_contrato": 12,
    "id_solicitud_equipo": 8,
    "numero_solicitud_equipo": "00008",
    "fecha_inicio": "2026-03-21",
    "fecha_vencimiento": "2026-05-13",
    "total": 150000
  }
}
```

### **2. Frontend UI**
**Archivo:** `src/componentes/Contratos.tsx`

**Cambios:**
1. Nuevas interfaces y estados:
   - `DetalleEquipo` interface
   - `showExtenderModal`, `contratoToExtender`, `equiposExtension`, `fechaInicioExtension`

2. Nuevas funciones:
   - `handleExtender()`: Abre modal y carga detalles
   - `handleUpdateEquipo()`: Actualiza parámetros de equipos
   - `confirmarExtension()`: Envía request al backend

3. Nuevo botón en acciones:
   - Label: "Extender"
   - Clase: `btnContrato` (verde)
   - Condición: `estado === GENERADO && (estadoVencimiento === 'vencido' || estadoVencimiento === 'porVencer')`
   - Tooltip: "Extender contrato"

4. Modal de extensión:
 - Muestra fecha de inicio (no editable)
   - Tabla con equipos actuales
   - Inputs editables: Periodicidad, Cantidad de Períodos, Fecha de Devolución
   - Validaciones: fecha_devolucion >= fecha_inicio
   - Nota informativa sobre precios actuales

### **3. Integración con Control de Pagos**
✅ **Automática** - El endpoint crea el registro en `pago_contrato` con:
- ID del nuevo contrato
- Total calculado según precios actuales
- IVA (si aplica)
- Estado PENDIENTE

### **4. Reglas de Negocio Implementadas**

#### **Validaciones:**
- ✅ Solo contratos en estado GENERADO pueden extenderse
- ✅ Solo aplica a contratos vencidos o por vencer (≤ 3 días)
- ✅ Múltiples extensiones permitidas del mismo contrato
- ✅ Contrato original NO cambia de estado
- ✅ Cada extensión es un contrato independiente

#### **Cálculos:**
- ✅ Fecha inicio = fecha_vencimiento_original + 1 día (automática)
- ✅ Precios = tarifas actuales del sistema (no del contrato original)
- ✅ Fecha vencimiento = máxima fecha_devolucion de los equipos
- ✅ IVA calculado si usa_factura está activo

#### **Flujo de Datos:**
```
Contrato Original (GENERADO, vencido/por vencer)
    ↓
Usuario click "Extender"
    ↓
Modal carga detalles de SE original
    ↓
Usuario edita: Periodicidad, Períodos, F. Devolución
    ↓
Sistema calcula:
- Nueva fecha inicio (+1 día)
- Nuevos precios (actuales)
- Nuevo vencimiento
    ↓
Crea: Nueva SE + Nuevo Contrato + Pago + Bitácora
    ↓
Actualiza: Inventario (reserva equipos)
```

## 📋 Testing Checklist

### **Verificar:**
- [ ] Botón "Extender" solo aparece en contratos GENERADOS vencidos/por vencer
- [ ] Modal se abre con datos correctos
- [ ] Fecha de inicio se calcula correctamente (vencimiento + 1 día)
- [ ] Todos los campos son editables (periodicidad, períodos, fecha)
- [ ] Validación de fecha_devolucion >= fecha_inicio
- [ ] Crear extensión genera nuevo contrato
- [ ] Nuevo contrato aparece en lista de contratos
- [ ] Nuevo contrato aparece en Control de Pagos con monto correcto
- [ ] Inventario se actualiza (equipos reservados)
- [ ] Bitácora se crea con registros correctos
- [ ] Múltiples extensiones del mismo contrato funcionan
- [ ] Precios se calculan según tarifas actuales

### **Casos de Prueba:**
1. Extender contrato vencido con 1 equipo, periodicidad mensual, 2 períodos
2. Extender contrato por vencer con múltiples equipos, diferentes periodicidades
3. Intentar extender contrato FINALIZADO (debe fallar)
4. Intentar extender contrato ANULADO (debe fallar)
5. Crear extensión de una extensión (debe funcionar)

## 🚀 Despliegue

**Branch:** `extencion`

**Archivos Modificados:**
- `src/pages/api/contrato/extender/[id].ts` (nuevo)
- `src/componentes/Contratos.tsx` (modificado)

**Base de Datos:**
- No requiere migraciones
- Utiliza tablas existentes

## 📝 Notas Importantes

1. **Precios Actuales:** El sistema usa los precios vigentes, no los del contrato original. Esto permite ajustar tarifas sin afectar extensiones futuras.

2. **Independencia:** Cada extensión es un contrato completamente independiente. No hay vínculo en base de datos entre original y extensión (aunque se registra en observaciones de bitácora).

3. **Inventario:** Los equipos se RESERVAN en la nueva SE, no se mueven físicamente. El flujo normal de inventario aplica cuando se genera el contrato.

4. **Pagos:** Cada extensión genera su propio registro de pago, permitiendo pagos independientes.

5. **Sin Notificaciones:** El sistema NO envía notificaciones automáticas. El usuario debe comunicar la extensión al cliente.

## 🔍 Próximas Mejoras (Opcional)

- [ ] Agregar campo en DB para vincular extensiones (contrato_origen_id)
- [ ] Dashboard con indicador de contratos extendidos
- [ ] Reporte de extensiones por cliente
- [ ] Descuentos automáticos para extensiones
- [ ] Límite de extensiones por contrato
- [ ] Notificación por email al cliente
