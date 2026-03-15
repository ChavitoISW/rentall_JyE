# 🐳 Diferencias Clave: Docker vs Podman en GitHub Actions

## 📊 Comparación

| Característica | Docker | Podman |
|----------------|--------|--------|
| **Daemon** | Requiere daemon corriendo | Sin daemon (daemonless) |
| **Root** | Requiere privilegios root | Puede ejecutarse sin root |
| **Compatibilidad** | - | Compatible con Docker CLI |
| **Seguridad** | Menor aislamiento | Mayor seguridad (rootless) |
| **Registries** | Docker Hub por defecto | Múltiples registries |

## 🔄 Comandos Equivalentes

### Build
```bash
# Docker
docker build -t myimage:latest .

# Podman (mismo comando)
podman build -t myimage:latest .
```

### Run
```bash
# Docker
docker run -d -p 3000:3000 myimage

# Podman (mismo comando)
podman run -d -p 3000:3000 myimage
```

### Push
```bash
# Docker
docker push ghcr.io/user/image:latest

# Podman (mismo comando)
podman push ghcr.io/user/image:latest
```

### Compose
```bash
# Docker Compose
docker-compose up -d

# Podman Compose
podman-compose up -d
```

## ⚙️ Configuración en CI/CD

### GitHub Actions con Podman

**Ventajas:**
- ✅ No requiere servicios adicionales
- ✅ Instalación directa en Ubuntu runner
- ✅ Mayor seguridad (rootless)
- ✅ Mismo Dockerfile funciona para ambos

**Instalación en el runner:**
```yaml
- name: 🐳 Instalar Podman
  run: |
    sudo apt-get update
    sudo apt-get -y install podman
    podman --version
```

## 🖥️ Configuración del Servidor de Producción

### Instalar Podman (Ubuntu/Debian)
```bash
# Actualizar repositorios
sudo apt-get update

# Instalar Podman
sudo apt-get install -y podman

# Verificar instalación
podman --version
```

### Instalar podman-compose
```bash
# Opción 1: Con pipx (recomendado para Ubuntu 24.04+)
sudo apt-get install -y pipx
pipx install podman-compose
pipx ensurepath

# Opción 2: Con pip (Ubuntu 22.04 y anteriores)
sudo apt-get install -y python3-pip
pip3 install --user podman-compose

# Verificar
podman-compose --version
```

### Configurar Podman Rootless (Recomendado)
```bash
# Habilitar podman sin root
podman system migrate

# Configurar subuids/subgids
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $(whoami)

# Reiniciar sesión
exit
# Volver a conectar

# Verificar
podman info
```

## 🔐 Login a GitHub Container Registry

### Con Docker
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Con Podman (mismo comando)
```bash
echo $GITHUB_TOKEN | podman login ghcr.io -u USERNAME --password-stdin
```

## 📦 docker-compose.yml → Totalmente Compatible

Tu `docker-compose.yml` actual funciona sin cambios con `podman-compose`:

```yaml
version: '3.8'
services:
  rentall:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./database:/app/database
```

## 🚀 Deploy con Podman

### En el servidor (SSH):
```bash
cd /opt/rentall

# Pull de cambios
git pull origin main

# Detener contenedores
podman-compose down

# Rebuild
podman build -t rentall:latest .

# Iniciar
podman-compose up -d

# Ver logs
podman logs -f rentall-app
```

## ⚠️ Consideraciones Importantes

### 1. Redes
Podman crea redes diferentes a Docker:
```bash
# Listar redes
podman network ls

# Crear red personalizada
podman network create mynet
```

### 2. Volúmenes
Ubicación diferente:
- **Docker**: `/var/lib/docker/volumes/`
- **Podman (rootless)**: `~/.local/share/containers/storage/volumes/`
- **Podman (root)**: `/var/lib/containers/storage/volumes/`

### 3. Socket
- **Docker**: `/var/run/docker.sock`
- **Podman (rootless)**: `$XDG_RUNTIME_DIR/podman/podman.sock`

### 4. Compatibilidad
Para scripts que usan `docker` puedes crear un alias:
```bash
alias docker=podman
# O crear symlink
sudo ln -s $(which podman) /usr/local/bin/docker
```

## 🔍 Troubleshooting

### Problema: "Cannot connect to Podman socket"
```bash
# Solución: Iniciar Podman socket
systemctl --user enable --now podman.socket
systemctl --user status podman.socket
```

### Problema: "Permission denied"
```bash
# Solución: Verificar subuids/subgids
grep $(whoami) /etc/subuid /etc/subgid

# Si no existen, agregarlos:
sudo usermod --add-subuids 100000-165535 $(whoami)
sudo usermod --add-subgids 100000-165535 $(whoami)
```

### Problema: "Image not found"
```bash
# Verificar registries configurados
podman info | grep -A 5 registries

# Especificar registry completo:
podman pull docker.io/library/nginx
# O
podman pull ghcr.io/user/image
```

## 📚 Recursos Adicionales

- [Podman Official Docs](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/)
- [Rootless Containers](https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md)
- [Podman Compose](https://github.com/containers/podman-compose)

## ✅ Ventajas de Usar Podman

1. **Seguridad**: Ejecución rootless por defecto
2. **Sin daemon**: Menos recursos, más estable
3. **Compatible**: Mismos comandos que Docker
4. **OCI Standard**: Cumple estándares abiertos
5. **Pods**: Soporte nativo de Kubernetes pods
6. **Múltiples registries**: Búsqueda en varios registries simultáneamente
