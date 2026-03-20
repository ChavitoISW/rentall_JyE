# Configuración de Ambientes

Este proyecto soporta múltiples ambientes de despliegue independientes.

## 🌍 Ambientes Disponibles

### 🟢 Producción (main)
- **Rama:** `main`
- **Puerto:** `3000`
- **Contenedor:** `rentall-prod-container`
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
cp .env.production .env
docker-compose up -d
```

### Pruebas
```bash
cp .env.testqa .env
docker-compose up -d
```

## ⚠️ Importante

- **NO** modificar la base de datos de producción (`database/rentall.db`) - **ES LA BASE DE DATOS ACTUAL EN USO**
- Producción mantiene su estructura actual: `database/` y `backups/`
- Cada ambiente tiene sus propias tablas y datos
- Los contenedores se ejecutan de forma independiente
- Ambos ambientes pueden correr simultáneamente en el mismo servidor

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollar** en rama `dev` o `testqa`
2. **Push** a `testqa` para probar en ambiente de pruebas
3. **Verificar** que todo funcione correctamente en puerto 3002
4. **Merge** a `main` cuando esté listo
5. **Deploy automático** a producción en puerto 3000

## 🐛 Troubleshooting

### Ver logs de un ambiente específico
```bash
# Producción
podman logs -f rentall-prod-container

# Pruebas
podman logs -f rentall-test-container
```

### Reiniciar un ambiente
```bash
# Producción
podman restart rentall-prod-container

# Pruebas
podman restart rentall-test-container
```

### Ver ambientes activos
```bash
podman ps | grep rentall
```
