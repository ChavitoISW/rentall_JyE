# RentAll - Sistema de Alquiler

## Base de Datos SQLite

El proyecto utiliza SQLite como base de datos. Para instalar las dependencias necesarias:

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### Estructura de la Base de Datos

El sistema incluye las siguientes tablas:

1. **users** - Usuarios del sistema
2. **categories** - Categorías de artículos
3. **items** - Artículos disponibles para rentar
4. **rentals** - Registros de rentas

### API Endpoints

#### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `POST /api/users` - Crear un nuevo usuario
- `GET /api/users/[id]` - Obtener usuario por ID
- `PUT /api/users/[id]` - Actualizar usuario
- `DELETE /api/users/[id]` - Eliminar usuario

#### Artículos
- `GET /api/items` - Obtener todos los artículos
- `GET /api/items?status=available` - Filtrar por estado
- `POST /api/items` - Crear un nuevo artículo
- `GET /api/items/[id]` - Obtener artículo por ID
- `PUT /api/items/[id]` - Actualizar artículo
- `DELETE /api/items/[id]` - Eliminar artículo

#### Rentas
- `GET /api/rentals` - Obtener todas las rentas
- `POST /api/rentals` - Crear una nueva renta
- `GET /api/rentals/[id]` - Obtener renta por ID
- `PATCH /api/rentals/[id]` - Actualizar estado de renta
- `DELETE /api/rentals/[id]` - Eliminar renta

#### Categorías
- `GET /api/categories` - Obtener todas las categorías
- `POST /api/categories` - Crear nueva categoría

### Ejemplos de Uso

#### Crear un usuario
```bash
curl -X POST http://localhost:3005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Juan Pérez", "email": "juan@example.com", "phone": "1234567890"}'
```

#### Crear un artículo
```bash
curl -X POST http://localhost:3005/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Taladro Eléctrico",
    "description": "Taladro profesional 800W",
    "price_per_day": 15.50,
    "owner_id": 1,
    "category_id": 1
  }'
```

#### Crear una renta
```bash
curl -X POST http://localhost:3005/api/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "renter_id": 2,
    "start_date": "2026-02-20",
    "end_date": "2026-02-25",
    "total_price": 77.50
  }'
```

### Comandos

```bash
# Desarrollo
npm run dev

# Compilar
npm run build

# Producción
npm start
```
