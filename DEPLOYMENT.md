# Configuración de Ambientes

Este proyecto soporta múltiples ambientes de despliegue independientes.

## 🌍 Ambientes Disponibles

### 🟢 Producción (main)
- **Rama:** `main`
- **Puerto:** `3000`
- **Contenedor:** `rentall-jyb-container`
- **Base de datos:** `./database/rentall.db` ⚠️ **BASE DE DATOS ACTUAL - NO SE MODIFICA**
- **Backups:** `./backups/`
- **URL:** `http://tu-servidor:3000`

### 🟡 Pruebas (testqa)
- **Rama:** `testqa`
- **Puerto:** `3002`
- **Contenedor:** `rentall-test-container`
- **Base de datos:** `./database/test/rentall.db`
- **Backups:** `./backups/test/`
- **URL:** `http://tu-servidor:3002`
- **⚡ IMPORTANTE:** Cada deployment copia automáticamente la DB de producción actual

## 🚀 Deployment Automático

El pipeline CI/CD detecta automáticamente la rama y despliega al ambiente correspondiente:

```bash
# Deploy a producción
git checkout main
git push origin main

# Deploy a pruebas
git checkout testqa
git push origin testqa
```

## 📁 Estructura de Directorios

```
rentall/
├── database/
│   ├── rentall.db     # Base de datos de producción ACTUAL (NO SE MODIFICA)
│   └── test/          # Base de datos de pruebas (nueva)
│       └── rentall.db
├── backups/           # Backups de producción (actuales)
│   └── test/          # Backups de pruebas
├── .env.production    # Configuración de producción
└── .env.testqa        # Configuración de pruebas
```

## 🔧 Configuración Manual

Si necesitas levantar un ambiente manualmente:

### Producción
```bash
cd ~/rentall
podman run -d \
  --name rentall-jyb-container \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/backups:/app/backups \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -e TZ=America/Costa_Rica \
  -e DB_PATH=/app/database/rentall.db \
  --restart unless-stopped \
  rentall:prod
```

### Pruebas
```bash
cd ~/rentall
podman run -d \
  --name rentall-test-container \
  -p 3002:3000 \
  -v $(pwd)/database/test:/app/database \
  -v $(pwd)/backups/test:/app/backups \
  -e NODE_ENV=test \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -e TZ=America/Costa_Rica \
  -e DB_PATH=/app/database/rentall.db \
  --restart unless-stopped \
  rentall:test
```

## ⚠️ Importante

- **NO** modificar la base de datos de producción (`database/rentall.db`) - **ES LA BASE DE DATOS ACTUAL EN USO**
- Producción mantiene su estructura actual: `database/` y `backups/`
- **Cada deployment a testqa copia automáticamente la DB de producción** - Siempre tendrás datos reales para probar
- Antes de copiar, se crea un backup automático de la DB de pruebas actual
- Cada ambiente tiene sus propias tablas y datos
- Los contenedores se ejecutan de forma independiente
- Ambos ambientes pueden correr simultáneamente en el mismo servidor

## 🔄 Flujo de Base de Datos

### Push a `testqa`:
1. ✅ Crea backup de DB actual de pruebas (si existe)
2. 📋 Copia `database/rentall.db` → `database/test/rentall.db`
3. 🚀 Inicia contenedor con datos actuales de producción
4. 🧪 Puedes probar con datos reales sin afectar producción

### Push a `main`:
1. ✅ Mantiene `database/rentall.db` intacta
2. 🚀 Solo actualiza código y reinicia contenedor
3. 🔒 Base de datos de producción nunca se toca

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollar** en rama `dev` o `testqa`
2. **Push** a `testqa` para probar en ambiente de pruebas
   - 🔄 Se copia automáticamente la DB de producción actual
   - 🧪 Tienes datos reales para validar cambios
3. **Verificar** que todo funcione correctamente en puerto 3002
4. **Merge** a `main` cuando esté listo
5. **Deploy automático** a producción en puerto 3000

**Ventaja:** Siempre pruebas con datos reales sin riesgo de dañar producción

## 🐛 Troubleshooting

### Ver logs de un ambiente específico
```bash
# Producción
podman logs -f rentall-jyb-container

# Pruebas
podman logs -f rentall-test-container
```

### Reiniciar un ambiente
```bash
# Producción
podman restart rentall-jyb-container

# Pruebas
podman restart rentall-test-container
```

### Ver ambientes activos
```bash
podman ps | grep rentall
```

### Copiar manualmente DB de prod a test
```bash
# En el servidor
cd ~/rentall
cp database/rentall.db database/test/rentall.db
echo "✅ Base de datos copiada"
podman restart rentall-test-container
```
