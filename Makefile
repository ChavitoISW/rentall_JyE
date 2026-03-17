.PHONY: help build up down logs restart clean rebuild shell status stats

help: ## Mostrar esta ayuda
	@echo "Comandos disponibles para RentAll Docker:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

build: ## Construir la imagen Docker
	docker-compose build

up: ## Iniciar los contenedores
	@mkdir -p database backups
	docker-compose up -d
	@echo ""
	@echo "✅ Contenedor iniciado!"
	@echo "   http://localhost:3000"

down: ## Detener los contenedores
	docker-compose down

logs: ## Ver logs en tiempo real
	docker-compose logs -f

restart: ## Reiniciar los contenedores
	docker-compose restart
	@echo "✅ Contenedor reiniciado"

clean: ## Detener y eliminar contenedores, redes e imágenes
	docker-compose down -v
	docker rmi rentall:latest 2>/dev/null || true
	@echo "✅ Limpieza completada"

rebuild: ## Reconstruir y reiniciar desde cero
	docker-compose down
	docker-compose build --no-cache
	@mkdir -p database backups
	docker-compose up -d
	@echo "✅ Reconstrucción completada"

shell: ## Acceder al shell del contenedor
	docker exec -it rentall-app sh

status: ## Ver estado de los contenedores
	docker-compose ps

stats: ## Ver uso de recursos
	docker stats rentall-app
