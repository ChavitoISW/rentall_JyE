# Etapa 1: Construcción
FROM node:20-alpine 

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

# Construir la aplicación Next.js
RUN npm run build

# Establecer variables de entorno
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=America/Costa_Rica \
    DB_PATH=/app/database/rentall.db

VOLUME ["/app/database"]

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]