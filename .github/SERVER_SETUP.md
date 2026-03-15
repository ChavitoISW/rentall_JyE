# 🖥️ Requisitos del Servidor para RentAll

Guía completa de instalación y configuración del servidor de producción.

---

## 📋 Requisitos Mínimos del Servidor

### Hardware Recomendado:
- **CPU**: 2 cores mínimo (4+ recomendado)
- **RAM**: 2GB mínimo (4GB+ recomendado)
- **Disco**: 20GB mínimo (SSD recomendado)
- **Red**: Conexión estable a internet

### Sistema Operativo:
- **Ubuntu 22.04 LTS** (recomendado)
- Ubuntu 20.04 LTS
- Debian 11/12
- CentOS/Rocky Linux 8+

---

## 🔧 Software Necesario

### 1. Sistema Base Actualizado

```bash
# Actualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar herramientas básicas
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  software-properties-common
```

### 2. Podman (REQUERIDO)

```bash
# Ubuntu 22.04+
sudo apt-get install -y podman

# Ubuntu 20.04 (repositorio adicional)
. /etc/os-release
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libpod:/stable/xUbuntu_${VERSION_ID}/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libpod:stable.list
curl -L "https://download.opensuse.org/repositories/devel:/kubic:/libpod:/stable/xUbuntu_${VERSION_ID}/Release.key" | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y podman

# Verificar instalación
podman --version
```

### 3. Python 3 y pip (REQUERIDO para podman-compose)

```bash
# Instalar Python 3
sudo apt-get install -y python3 python3-pip

# Verificar instalación
python3 --version
pip3 --version
```

### 4. podman-compose (REQUERIDO)

```bash
# Opción 1: Usar pipx (RECOMENDADO en Ubuntu 24.04+)
sudo apt-get install -y pipx
pipx install podman-compose
pipx ensurepath

# Opción 2: pip3 con usuario (Ubuntu 22.04 y anteriores)
pip3 install --user podman-compose
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Opción 3: Con break-system-packages (NO RECOMENDADO)
pip3 install podman-compose --break-system-packages

# Verificar instalación
podman-compose --version
```

### 5. Git (REQUERIDO)

```bash
# Ya debería estar instalado, verificar:
git --version

# Si no está instalado:
sudo apt-get install -y git

# Configurar Git
git config --global user.name "Nombre del Servidor"
git config --global user.email "servidor@tudominio.com"
```

---

## 🔐 Configuración de Seguridad

### 1. Firewall (UFW)

```bash
# Instalar UFW
sudo apt-get install -y ufw

# Configurar reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (IMPORTANTE antes de habilitar)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir puerto de la aplicación (si accedes directamente)
sudo ufw allow 3000/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status verbose
```

### 2. Fail2ban (Protección contra fuerza bruta)

```bash
# Instalar
sudo apt-get install -y fail2ban

# Configurar
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar configuración
sudo nano /etc/fail2ban/jail.local
# Buscar [sshd] y asegurarse que enabled = true

# Iniciar servicio
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verificar estado
sudo fail2ban-client status
```

### 3. Configurar SSH (Seguridad adicional)

```bash
# Editar configuración SSH
sudo nano /etc/ssh/sshd_config

# Recomendaciones:
# PermitRootLogin no
# PasswordAuthentication no (si usas llaves SSH)
# Port 22 (o cambiar a otro puerto)

# Reiniciar SSH
sudo systemctl restart sshd
```

---

## 🌐 Servidor Web Reverso (Nginx) - RECOMENDADO

### 1. Instalar Nginx

```bash
# Instalar
sudo apt-get install -y nginx

# Iniciar y habilitar
sudo systemctl enable nginx
sudo systemctl start nginx

# Verificar estado
sudo systemctl status nginx
```

### 2. Configurar Nginx para RentAll

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/rentall
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir a HTTPS (después de configurar SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar configuración:

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/rentall /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 3. Configurar SSL con Let's Encrypt (RECOMENDADO)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática (ya configurado por defecto)
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates
```

---

## 📁 Estructura de Directorios

```bash
# Crear estructura recomendada
sudo mkdir -p /opt/rentall
sudo chown $USER:$USER /opt/rentall

# Clonar repositorio
cd /opt/rentall
git clone https://github.com/tu-usuario/rentall.git .

# O si usas SSH
git clone git@github.com:tu-usuario/rentall.git .

# Crear directorios de datos
mkdir -p database backups

# Configurar permisos
chmod 755 database backups
```

---

## 🔄 Servicios Systemd (Opcional pero Recomendado)

### Crear servicio para auto-inicio

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/rentall.service
```

Contenido:

```ini
[Unit]
Description=RentAll Application
After=network.target podman.service

[Service]
Type=forking
User=ubuntu
WorkingDirectory=/opt/rentall
ExecStart=/usr/local/bin/podman-compose up -d
ExecStop=/usr/local/bin/podman-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activar servicio:

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar auto-inicio
sudo systemctl enable rentall

# Iniciar servicio
sudo systemctl start rentall

# Ver estado
sudo systemctl status rentall

# Ver logs
sudo journalctl -u rentall -f
```

---

## 📊 Monitoreo (Opcional)

### 1. Htop (Monitor de recursos)

```bash
sudo apt-get install -y htop

# Ejecutar
htop
```

### 2. Podman Stats

```bash
# Ver uso de recursos de contenedores
podman stats

# Con formato personalizado
podman stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### 3. Logs de sistema

```bash
# Ver logs de sistema
sudo journalctl -xe

# Ver logs de Podman
podman logs -f rentall-app

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🗄️ Base de Datos

### SQLite (Ya incluido)

✅ La base de datos SQLite está incluida en el proyecto
✅ Se guarda en `database/rentall.db`
✅ Backups automáticos en carpeta `backups/`

**No requiere instalación adicional** (better-sqlite3 ya está en la imagen)

---

## 🔧 Variables de Entorno (Opcional)

Si necesitas configuraciones adicionales:

```bash
# Crear archivo .env en el servidor
cd /opt/rentall
nano .env
```

Ejemplo:

```env
NODE_ENV=production
PORT=3000
DB_PATH=/app/database/rentall.db
ENABLE_BACKUPS=true
TZ=America/Costa_Rica
```

---

## ✅ Checklist de Instalación

### Paso 1: Sistema Base
- [ ] Ubuntu/Debian instalado y actualizado
- [ ] Usuario no-root creado
- [ ] SSH configurado

### Paso 2: Software Requerido
- [ ] Podman instalado
- [ ] Python 3 y pip instalados
- [ ] podman-compose instalado
- [ ] Git instalado

### Paso 3: Seguridad
- [ ] Firewall (UFW) configurado
- [ ] Fail2ban instalado
- [ ] SSH asegurado

### Paso 4: Servidor Web (Opcional)
- [ ] Nginx instalado
- [ ] Configuración de proxy inverso
- [ ] SSL/TLS con Let's Encrypt

### Paso 5: Aplicación
- [ ] Repositorio clonado en `/opt/rentall`
- [ ] Directorios `database` y `backups` creados
- [ ] docker-compose.yml presente

### Paso 6: Despliegue
- [ ] `podman-compose up -d` ejecutado
- [ ] Aplicación accesible en puerto 3000
- [ ] Nginx sirviendo en puerto 80/443

### Paso 7: Monitoreo
- [ ] Verificar logs: `podman logs -f rentall-app`
- [ ] Verificar recursos: `podman stats`
- [ ] Verificar backups automáticos

---

## 🚀 Comandos de Inicio Rápido

### Primera vez:

```bash
# 1. Clonar repositorio
cd /opt
sudo git clone https://github.com/tu-usuario/rentall.git
sudo chown -R $USER:$USER /opt/rentall
cd /opt/rentall

# 2. Crear directorios
mkdir -p database backups

# 3. Iniciar aplicación
podman-compose up -d

# 4. Verificar
podman ps
curl http://localhost:3000
```

### Actualizar aplicación:

```bash
cd /opt/rentall
git pull origin main
podman-compose down
podman-compose build --no-cache
podman-compose up -d
```

---

## 🆘 Troubleshooting

### Puerto 3000 ya en uso:
```bash
# Ver qué está usando el puerto
sudo lsof -i :3000
# O
sudo netstat -tulpn | grep 3000

# Matar proceso
sudo kill -9 <PID>
```

### Nginx no inicia:
```bash
# Ver error
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### Podman no encuentra imagen:
```bash
# Rebuild
cd /opt/rentall
podman build -t rentall:latest .

# Verificar
podman images
```

### Base de datos no se crea:
```bash
# Verificar permisos
ls -la database/

# Dar permisos
chmod 755 database
touch database/rentall.db
chmod 666 database/rentall.db
```

---

## 📞 Soporte Adicional

Si encuentras problemas:

1. **Logs de la aplicación**: `podman logs -f rentall-app`
2. **Logs del sistema**: `sudo journalctl -xe`
3. **Estado de servicios**: `sudo systemctl status nginx podman`
4. **Recursos del sistema**: `htop` o `podman stats`

---

## 🎉 ¡Listo!

Con esta configuración, tu servidor está preparado para ejecutar RentAll en producción de manera segura y eficiente.
