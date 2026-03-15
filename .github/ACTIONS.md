# 🚀 GitHub Actions - Configuración (Podman)

Este proyecto utiliza GitHub Actions para CI/CD automático con **Podman** en lugar de Docker.

## 📋 Workflows Disponibles

### 1. CI - Build and Test (`.github/workflows/ci.yml`)

**Triggers:**
- Push a branches: `main`, `develop`, `dockerfile`, `detalles`, `gitactions`
- Pull requests a: `main`, `develop`

**Pasos:**
- ✅ Checkout del código
- ✅ Configuración de Node.js 20.x
- ✅ Instalación de dependencias
- ✅ Type checking con TypeScript
- ✅ Build de Next.js

**Estado:** [![CI](https://github.com/USUARIO/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USUARIO/REPO/actions/workflows/ci.yml)

---

### 2. Podman Build and Push (`.github/workflows/docker.yml`)

**Triggers:**
- Push a branches: `main`, `dockerfile`
- Tags: `v*.*.*`
- Pull requests a `main`

**Pasos:**
- ✅ Instalación de Podman en Ubuntu
- ✅ Build de imagen con Podman
- ✅ Push a GitHub Container Registry (ghcr.io)
- ✅ Tagging automático por versión

**Imagen:** `ghcr.io/USUARIO/rentall:latest`

**Estado:** [![Docker](https://github.com/USUARIO/REPO/actions/workflows/docker.yml/badge.svg)](https://github.com/USUARIO/REPO/actions/workflows/docker.yml)

---

### 3. Code Quality (`.github/workflows/quality.yml`)

**Triggers:**
- Push a branches: `main`, `develop`
- Pull requests a: `main`, `develop`

**Pasos:**
- ✅ TypeScript type checking
- ✅ Análisis de código
- ✅ Conteo de archivos

**Estado:** [![Quality](https://github.com/USUARIO/REPO/actions/workflows/quality.yml/badge.svg)](https://github.com/USUARIO/REPO/actions/workflows/quality.yml)

---

### 4. Deploy to Production (`.github/workflows/deploy.yml`)

**Triggers:**
- Push a `main`
- Manual (workflow_dispatch)

**Pasos:**
- ✅ Conexión SSH al servidor
- ✅ Pull del código
- ✅ Rebuild con Podman
- ✅ Restart con podman-compose

**Estado:** [![Deploy](https://github.com/USUARIO/REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/USUARIO/REPO/actions/workflows/deploy.yml)

---

## 🔐 Secrets Requeridos

Para que los workflows funcionen correctamente, configura estos secrets en:
**Settings → Secrets and variables → Actions**

### Para Podman Build:
- `GITHUB_TOKEN` - ✅ Automático (no requiere configuración)

### Para Deploy:
- `SSH_PRIVATE_KEY` - Clave privada SSH para conectar al servidor
- `SSH_USER` - Usuario SSH (ejemplo: `ubuntu`, `root`)
- `SSH_HOST` - IP o dominio del servidor (ejemplo: `192.168.1.100`)
- `DEPLOY_PATH` - Ruta del proyecto en el servidor (ejemplo: `/opt/rentall`)

## 🖥️ Requisitos del Servidor

Tu servidor de producción debe tener instalado:

```bash
# Instalar Podman
sudo apt-get update
sudo apt-get install -y podman

# Instalar podman-compose (Ubuntu 24.04+)
sudo apt-get install -y pipx
pipx install podman-compose
pipx ensurepath

# O para Ubuntu 22.04 y anteriores:
# pip3 install --user podman-compose

# Verificar instalación
podman --version
podman-compose --version
```

## 📝 Cómo Configurar Secrets

### 1. Generar par de llaves SSH (si no tienes):

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
```

### 2. Copiar llave pública al servidor:

```bash
ssh-copy-id -i ~/.ssh/github_actions.pub usuario@servidor
```

### 3. Agregar llave privada a GitHub:

```bash
# Copiar contenido de la llave privada
cat ~/.ssh/github_actions
```

Luego ir a **GitHub → Settings → Secrets → New repository secret**:
- Name: `SSH_PRIVATE_KEY`
- Value: Pegar el contenido completo de la llave privada

### 4. Configurar otros secrets:

- `SSH_USER`: El usuario con el que te conectas al servidor
- `SSH_HOST`: La IP o dominio de tu servidor
- `DEPLOY_PATH`: La ruta donde está tu proyecto (ej: `/home/ubuntu/rentall`)

## 🎯 Uso

### Build Automático
Cada push a las ramas principales ejecuta el CI:
```bash
git push origin main  # Ejecuta CI + Docker + Deploy
git push origin develop  # Ejecuta CI + Quality
```

### Deploy Manual
Desde GitHub:
1. Ir a **Actions**
2. Seleccionar **Deploy to Production**
3. Click en **Run workflow**
4. Seleccionar branch y ejecutar

### Pull de Imagen con Podman
```bash
# Login a GitHub Container Registry
echo $GITHUB_TOKEN | podman login ghcr.io -u USERNAME --password-stdin

# Pull de la imagen
podman pull ghcr.io/USERNAME/rentall:latest

# Run
podman run -d -p 3000:3000 ghcr.io/USERNAME/rentall:latest
```

## 📊 Badges para README

Agrega estos badges a tu README principal:

```markdown
![CI](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
![Docker](https://github.com/USERNAME/REPO/actions/workflows/docker.yml/badge.svg)
![Deploy](https://github.com/USERNAME/REPO/actions/workflows/deploy.yml/badge.svg)
```

## 🔧 Personalización

### Cambiar ramas monitoreadas

Edita los workflows en `.github/workflows/`:

```yaml
on:
  push:
    branches: [ main, tu-nueva-rama ]
```

### Cambiar versión de Node.js

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]  # Probar múltiples versiones
```

### Agregar tests

Agrega en `ci.yml`:

```yaml
- name: 🧪 Ejecutar tests
  run: npm test
```

## ⚠️ Troubleshooting

### Error: "nodejs not found"
- Verificar que `node-version: '20'` esté configurado

### Error: "npm ci failed"
- Asegúrate de tener `package-lock.json` commiteado
- Verifica que las dependencias estén correctas en `package.json`

### Error: "Podman build failed"
- Revisa el Dockerfile localmente: `podman build -t test .`
- Verifica que todos los archivos necesarios existan

### Error: "SSH connection failed"
- Verifica que `SSH_PRIVATE_KEY` esté configurado correctamente
- Prueba la conexión manualmente: `ssh usuario@servidor`
- Verifica que el servidor acepte conexiones SSH

### Error: "Permission denied"
- Asegúrate de que el usuario SSH tenga permisos en `DEPLOY_PATH`
- Podman puede ejecutarse sin root (rootless mode)
- Configura podman rootless: `podman system migrate`

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Podman Documentation](https://docs.podman.io/)
- [Podman Compose](https://github.com/containers/podman-compose)
- [SSH Agent Action](https://github.com/webfactory/ssh-agent)

## 🎉 Resultado Esperado

Después de configurar todo:
- ✅ Cada commit ejecuta CI automáticamente
- ✅ Push a `main` construye y publica imagen con Podman
- ✅ Deploy automático a producción con podman-compose
- ✅ Historial completo de deployments en GitHub
