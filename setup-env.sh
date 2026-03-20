#!/bin/bash

# Script para cambiar entre ambientes de forma fácil
# Uso: ./setup-env.sh [production|test]

if [ "$#" -ne 1 ]; then
    echo "❌ Error: Debes especificar un ambiente"
    echo ""
    echo "Uso: ./setup-env.sh [production|test]"
    echo ""
    echo "Ejemplos:"
    echo "  ./setup-env.sh production  # Configurar ambiente de producción"
    echo "  ./setup-env.sh test        # Configurar ambiente de pruebas"
    exit 1
fi

AMBIENTE=$1

case $AMBIENTE in
    production|prod)
        echo "🟢 Configurando ambiente de PRODUCCIÓN..."
        cp .env.production .env
        echo "✅ Ambiente configurado:"
        echo "   - Puerto: 3000"
        echo "   - Contenedor: rentall-jyb-container"
        echo "   - Base de datos: ./database/rentall.db (ACTUAL - NO SE MODIFICA)"
        ;;
    test|testqa|pruebas)
        echo "🟡 Configurando ambiente de PRUEBAS..."
        cp .env.testqa .env
        echo "✅ Ambiente configurado:"
        echo "   - Puerto: 3002"
        echo "   - Contenedor: rentall-test-container"
        echo "   - Base de datos: ./database/test/rentall.db"
        ;;
    *)
        echo "❌ Ambiente no válido: $AMBIENTE"
        echo ""
        echo "Ambientes disponibles:"
        echo "  - production (prod)"
        echo "  - test (testqa, pruebas)"
        exit 1
        ;;
esac

echo ""
echo "📦 Ahora puedes ejecutar:"
echo "   podman stop rentall-prod-container || true"
echo "   podman rm rentall-prod-container || true"
echo "   podman build -t rentall:prod ."
echo "   # Luego ejecutar el comando 'podman run' del DEPLOYMENT.md"
