# Azuevento - Community Events Platform

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Start the complete environment

```bash
# Start all services (database + API)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v
```

### Available Services

- **PostgreSQL**: `localhost:5432`
  - Database: `community_events`
  - User: `azuevento_user`
  - Password: `azuevento_pass`

- **REST API**: `http://localhost:8080`

## 📊 Database

### Initial Structure

The database is automatically initialized with:

1. **Main Tables**:
   - `users` - User management
   - `categories` - Event categories
   - `events` - Community events
   - `participants` - Event registrations
   - `comments` - Event comments
   - `ratings` - Event ratings
   - `favorites` - Favorite events

2. **Test Data**:
   - 8 predefined categories
   - Admin user (email: `admin@azuevento.com`, password: `admin123`)
   - Sample event

### Connect to Database

```bash
# Using Docker
docker exec -it azuevento-postgres psql -U azuevento_user -d community_events

# Using local client
psql -h localhost -p 5432 -U azuevento_user -d community_events
```

## 🛠️ Desarrollo Local

### Backend (Spring Boot)

```bash
cd eventos-comunitarios-api

# Compilar
./gradlew build

# Ejecutar (requiere PostgreSQL corriendo)
./gradlew bootRun
```

### Frontend (React Native)

```bash
cd eventos-comunitarios-app

# Instalar dependencias
npm install

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios
```

## 📁 Estructura del Proyecto

```
Azuevento/
├── eventos-comunitarios-api/    # Backend Spring Boot
├── eventos-comunitarios-app/    # Frontend React Native
├── db/
│   └── init/                    # Scripts SQL de inicialización
├── plan/                        # Documentación del proyecto
├── docker-compose.yml           # Configuración Docker
└── README.md
```

## 🔧 Environment Variables

The `docker-compose.yml` file already includes the necessary variables. For local development, you can create a `.env` file in the root:

```env
POSTGRES_DB=community_events
POSTGRES_USER=azuevento_user
POSTGRES_PASSWORD=azuevento_pass
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/community_events
```

## 📝 Notas

- La primera vez que ejecutes `docker-compose up`, se descargarán las imágenes necesarias
- Los scripts SQL en `db/init/` se ejecutan automáticamente al crear el contenedor de PostgreSQL
- El API usa Hibernate con `ddl-auto=update` para sincronizar el esquema automáticamente