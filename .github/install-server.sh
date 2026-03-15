#!/bin/bash

# Script de Instalación Automática de RentAll en Servidor
# Para Ubuntu 20.04+ / Debian 11+

set -e

echo "╔════════════════════════════════════════╗"
echo "║   RentAll - Instalación de Servidor   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "→ $1"
}

# Verificar que se ejecuta como usuario normal (no root)
if [ "$EUID" -eq 0 ]; then 
    print_error "No ejecutes este script como root. Usa un usuario normal con sudo."
    exit 1
fi

# Verificar sudo
if ! sudo -v; then
    print_error "Este script requiere permisos sudo"
    exit 1
fi

echo ""
print_info "Este script instalará:"
echo "  • Podman"
echo "  • Python 3 y pip"
echo "  • podman-compose"
echo "  • Git"
echo "  • UFW (Firewall)"
echo "  • Nginx"
echo "  • Certificado SSL (Let's Encrypt)"
echo ""

read -p "¿Continuar con la instalación? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    print_warning "Instalación cancelada"
    exit 0
fi

# 1. Actualizar sistema
echo ""
echo "═══════════════════════════════════════"
echo " Paso 1: Actualizando sistema"
echo "═══════════════════════════════════════"
sudo apt-get update
sudo apt-get upgrade -y
print_success "Sistema actualizado"

# 2. Instalar herramientas básicas
echo ""
echo "═══════════════════════════════════════"
echo " Paso 2: Instalando herramientas básicas"
echo "═══════════════════════════════════════"
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common
print_success "Herramientas básicas instaladas"

# 3. Instalar Podman
echo ""
echo "═══════════════════════════════════════"
echo " Paso 3: Instalando Podman"
echo "═══════════════════════════════════════"
if command -v podman &> /dev/null; then
    print_warning "Podman ya está instalado ($(podman --version))"
else
    sudo apt-get install -y podman
    print_success "Podman instalado ($(podman --version))"
fi

# 4. Instalar Python 3 y pip
echo ""
echo "═══════════════════════════════════════"
echo " Paso 4: Instalando Python 3 y pip"
echo "═══════════════════════════════════════"
sudo apt-get install -y python3 python3-pip
print_success "Python $(python3 --version) instalado"
print_success "pip $(pip3 --version | cut -d' ' -f2) instalado"

# 5. Instalar podman-compose
echo ""
echo "═══════════════════════════════════════"
echo " Paso 5: Instalando podman-compose"
echo "═══════════════════════════════════════"

# Detectar versión de Ubuntu
UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null || echo "0")

# Para Ubuntu 24.04+ usar pipx (evita error externally-managed)
if [ ! -z "$UBUNTU_VERSION" ] && [ "$(echo "$UBUNTU_VERSION >= 24.04" | bc)" -eq 1 ]; then
    print_info "Detectado Ubuntu 24.04+, usando pipx..."
    sudo apt-get install -y pipx
    pipx install podman-compose
    pipx ensurepath
    export PATH="$HOME/.local/bin:$PATH"
    print_success "podman-compose instalado con pipx"
else
    # Para versiones anteriores, usar pip3 con --user
    pip3 install --user podman-compose 2>/dev/null || {
        print_warning "pip3 con --user falló, intentando con --break-system-packages..."
        pip3 install podman-compose --break-system-packages
    }
    export PATH="$HOME/.local/bin:$PATH"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    print_success "podman-compose instalado"
fi

# 6. Configurar Firewall
echo ""
echo "═══════════════════════════════════════"
echo " Paso 6: Configurando Firewall (UFW)"
echo "═══════════════════════════════════════"
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 3000/tcp # Aplicación
echo "y" | sudo ufw enable
print_success "Firewall configurado"

# 7. Instalar Nginx
echo ""
echo "═══════════════════════════════════════"
echo " Paso 7: Instalando Nginx"
echo "═══════════════════════════════════════"
read -p "¿Instalar Nginx como proxy inverso? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_success "Nginx instalado y en ejecución"
    
    # Configurar Nginx para RentAll
    read -p "Ingresa tu dominio (ej: tudominio.com) o presiona Enter para omitir: " DOMAIN
    if [ ! -z "$DOMAIN" ]; then
        sudo tee /etc/nginx/sites-available/rentall > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        sudo ln -sf /etc/nginx/sites-available/rentall /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl restart nginx
        print_success "Nginx configurado para $DOMAIN"
        
        # SSL con Let's Encrypt
        read -p "¿Instalar certificado SSL con Let's Encrypt? (s/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[SsYy]$ ]]; then
            sudo apt-get install -y certbot python3-certbot-nginx
            sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email
            print_success "Certificado SSL instalado"
        fi
    fi
else
    print_warning "Nginx no instalado"
fi

# 8. Crear estructura de directorios
echo ""
echo "═══════════════════════════════════════"
echo " Paso 8: Configurando directorios"
echo "═══════════════════════════════════════"
read -p "Ruta de instalación (por defecto: /opt/rentall): " INSTALL_PATH
INSTALL_PATH=${INSTALL_PATH:-/opt/rentall}

if [ -d "$INSTALL_PATH" ]; then
    print_warning "El directorio $INSTALL_PATH ya existe"
else
    sudo mkdir -p $INSTALL_PATH
    sudo chown $USER:$USER $INSTALL_PATH
    print_success "Directorio $INSTALL_PATH creado"
fi

# 9. Clonar repositorio
echo ""
echo "═══════════════════════════════════════"
echo " Paso 9: Clonando repositorio"
echo "═══════════════════════════════════════"
read -p "URL del repositorio Git: " REPO_URL
if [ ! -z "$REPO_URL" ]; then
    cd $INSTALL_PATH
    git clone $REPO_URL .
    mkdir -p database backups
    chmod 755 database backups
    print_success "Repositorio clonado en $INSTALL_PATH"
else
    print_warning "Repositorio no clonado. Hazlo manualmente después."
fi

# 10. Instalar fail2ban (opcional)
echo ""
echo "═══════════════════════════════════════"
echo " Paso 10: Fail2ban (Protección SSH)"
echo "═══════════════════════════════════════"
read -p "¿Instalar fail2ban para protección contra fuerza bruta? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    sudo apt-get install -y fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    print_success "Fail2ban instalado y activado"
fi

# Resumen
echo ""
echo "╔════════════════════════════════════════╗"
echo "║       ✓ Instalación Completada        ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📦 Software instalado:"
echo "  • Podman: $(podman --version)"
echo "  • Python: $(python3 --version)"
echo "  • podman-compose: instalado"
echo "  • Git: $(git --version)"
echo "  • UFW: configurado"
if command -v nginx &> /dev/null; then
    echo "  • Nginx: instalado"
fi
echo ""
echo "📁 Ruta de instalación: $INSTALL_PATH"
echo ""
echo "🚀 Próximos pasos:"
echo ""
echo "  1. Ir al directorio:"
echo "     cd $INSTALL_PATH"
echo ""
echo "  2. Iniciar aplicación:"
echo "     podman-compose up -d"
echo ""
echo "  3. Ver logs:"
echo "     podman logs -f rentall-app"
echo ""
echo "  4. Verificar estado:"
echo "     podman ps"
echo ""
if [ ! -z "$DOMAIN" ]; then
    echo "  5. Acceder a la aplicación:"
    echo "     https://$DOMAIN"
else
    echo "  5. Acceder a la aplicación:"
    echo "     http://$(hostname -I | awk '{print $1}'):3000"
fi
echo ""
echo "📚 Documentación completa:"
echo "   $INSTALL_PATH/.github/SERVER_SETUP.md"
echo ""
