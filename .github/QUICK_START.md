# ⚡ Instalación Rápida - Resumen Ejecutivo

Solo lo esencial para poner RentAll en producción.

---

## 🎯 Requisitos Mínimos

| Software | Versión Mínima | Comando de verificación |
|----------|----------------|-------------------------|
| Ubuntu | 20.04+ | `lsb_release -a` |
| Podman | 3.0+ | `podman --version` |
| Python 3 | 3.8+ | `python3 --version` |
| podman-compose | 1.0+ | `podman-compose --version` |
| Git | 2.25+ | `git --version` |

---

## 🚀 Instalación en 5 Minutos

### Opción 1: Script Automático

```bash
# Descargar y ejecutar script de instalación
wget https://raw.githubusercontent.com/TU-USUARIO/rentall/main/.github/install-server.sh
chmod +x install-server.sh
./install-server.sh
```

### Opción 2: Comandos Manuales

```bash
# 1. Instalar dependencias
sudo apt-get update && sudo apt-get install -y podman python3-pip git

# 2. Instalar podman-compose
# Para Ubuntu 24.04+ (recomendado):
sudo apt-get install -y pipx
pipx install podman-compose
pipx ensurepath

# O para Ubuntu 22.04 y anteriores:
# pip3 install --user podman-compose

# Agregar al PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 3. Clonar proyecto
sudo mkdir -p /opt/rentall
sudo chown $USER:$USER /opt/rentall
cd /opt/rentall
git clone https://github.com/TU-USUARIO/rentall.git .

# 4. Crear directorios
mkdir -p database backups

# 5. Iniciar aplicación
podman-compose up -d

# 6. Verificar
podman ps
```

---

## 🔥 Solo 3 Comandos (Mínimo absoluto)

Si ya tienes Podman y podman-compose:

```bash
git clone https://github.com/TU-USUARIO/rentall.git && cd rentall
mkdir -p database backups
podman-compose up -d
```

**¡Listo!** Aplicación corriendo en `http://tu-servidor:3000`

---

## 🔐 Seguridad Básica (Opcional pero Recomendado)

```bash
# Firewall
sudo apt-get install -y ufw
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw enable

# SSL con Nginx y Let's Encrypt
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

---

## 📦 Software REQUERIDO

### 1. **Podman** (Contenedores)
```bash
sudo apt-get install -y podman
```

### 2. **Python 3 + pip** (Para podman-compose)
```bash
sudo apt-get install -y python3 python3-pip
```

### 3. **podman-compose** (Orquestación)
```bash
# Ubuntu 24.04+:
sudo apt-get install -y pipx
pipx install podman-compose
pipx ensurepath

# Ubuntu 22.04 y anteriores:
# pip3 install --user podman-compose
```

### 4. **Git** (Clonar repositorio)
```bash
sudo apt-get install -y git
```

---

## 🚫 Software NO Requerido

❌ **Node.js** - Ya incluido en la imagen Docker  
❌ **npm** - Ya incluido en la imagen Docker  
❌ **better-sqlite3** - Ya incluido en la imagen Docker  
❌ **MySQL/PostgreSQL** - Usa SQLite embebido  

---

## 🌐 Puertos Necesarios

| Puerto | Uso | Abrir en Firewall |
|--------|-----|-------------------|
| 22 | SSH | ✅ Sí |
| 80 | HTTP | ✅ Sí (si usas Nginx) |
| 443 | HTTPS | ✅ Sí (si usas SSL) |
| 3000 | App | Solo si accedes directo |

```bash
# Configurar firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔄 Comandos de Mantenimiento

### Actualizar aplicación:
```bash
cd /opt/rentall
git pull origin main
podman-compose down
podman-compose up -d --build
```

### Ver logs:
```bash
podman logs -f rentall-app
```

### Reiniciar:
```bash
podman-compose restart
```

### Backup manual:
```bash
cp database/rentall.db backups/backup-$(date +%Y%m%d).db
```

---

## ⚠️ Troubleshooting Rápido

### Puerto 3000 ocupado:
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Podman no encuentra comando:
```bash
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc
```

### Permisos de base de datos:
```bash
chmod 755 database
chmod 666 database/rentall.db
```

---

## 📋 Checklist Mínimo

- [ ] Servidor con Ubuntu 20.04+
- [ ] Podman instalado
- [ ] podman-compose instalado
- [ ] Repositorio clonado
- [ ] Directorios `database` y `backups` creados
- [ ] `podman-compose up -d` ejecutado
- [ ] Aplicación accesible en puerto 3000

---

## 🎉 ¡Listo para Producción!

Con esto tienes RentAll funcionando. Para configuración avanzada (Nginx, SSL, monitoreo), consulta [SERVER_SETUP.md](SERVER_SETUP.md).

**Acceder:** `http://TU-IP-SERVIDOR:3000`

**Usuario Admin:**
- Identificación: `Admin`
- Contraseña: `casa9876`
