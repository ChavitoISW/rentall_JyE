# Etapa 1: Construcción
FROM node:20-alpine 

# Argumentos de build
ARG NEXT_PUBLIC_ENV=production
ARG PORT=3005
# Para rama testqa usar: docker build --build-arg PORT=3002
# Para producción: docker build (usa PORT=3005 por defecto)

# Instalar dependencias del sistema necesarias para better-sqlite3 y healthcheck
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    wget

# Crear directorio para la base de datos
RUN mkdir -p /app/database    

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY next.config.js ./

# Instala las dependencias. Esta capa solo se reconstruirá si cambian los archivos .json
RUN npm install && \
    npm cache clean --force

# Copiar código fuente
COPY src/ ./src/
COPY tsconfig.json ./
# Copiar carpeta public con todo su contenido
COPY public/ ./public
# Copiar scripts de migración
COPY scripts/ ./scripts/

# Establecer variable de entorno para el build
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}

# Construir la aplicación Next.js
RUN npm run build

# Establecer variables de entorno
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${PORT} \
    HOSTNAME=0.0.0.0 \
    TZ=America/Costa_Rica \
    DB_PATH=/app/database/rentall.db

VOLUME ["/app/database"]

# Exponer puertos (3005 para producción, 3002 para testqa)
EXPOSE 3005 3002

# Comando para ejecutar la aplicación
CMD ["npm", "start"]