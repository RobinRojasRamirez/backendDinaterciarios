# Backend Ecopetrol — API de Gestión de Registros Operativos

API REST para la gestión de registros operativos de pozos petroleros. Construida con NestJS + Prisma + PostgreSQL.

## Requisitos

- Node.js 22+
- PostgreSQL 15+
- npm 10+

## Configuración

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Editar `.env` con los valores correctos:

| Variable | Descripción | Obligatoria |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | Sí |
| `JWT_SECRET` | Clave secreta para firmar JWT | Sí |
| `JWT_REFRESH_SECRET` | Clave secreta para firmar refresh tokens | Sí |
| `JWT_EXPIRATION` | Tiempo de expiración del JWT (ej: `15m`) | No (default: 15m) |
| `JWT_REFRESH_EXPIRATION` | Tiempo de expiración del refresh token (ej: `7d`) | No (default: 7d) |
| `PORT` | Puerto del servidor | No (default: 3000) |
| `NODE_ENV` | Entorno (`development`, `production`) | No (default: development) |
| `CORS_ORIGIN` | Origen permitido para CORS | No (default: http://localhost:5173) |

> **Seguridad**: `JWT_SECRET` y `JWT_REFRESH_SECRET` no tienen valores por defecto. Si no se configuran, el servidor NO arrancará.

## Instalación

```bash
npm install
```

## Migraciones (base de datos)

1. Asegurar que PostgreSQL esté corriendo y `DATABASE_URL` esté configurada.

2. Ejecutar migraciones:

```bash
npm run prisma:migrate
```

3. (Opcional) Sembrar datos de ejemplo:

```bash
npm run prisma:seed
```

4. Regenerar el cliente Prisma si se modifica el schema:

```bash
npm run prisma:generate
```

## Ejecución

### Desarrollo

```bash
npm run start:dev
```

### Producción

```bash
npm run build
npm run start:prod
```

## Pruebas

```bash
# Todas las pruebas
npm test

# Modo watch
npm run test:watch

# Cobertura
npm run test:cov

# Módulo específico
npx jest --no-coverage src/modules/auth/services/auth.service.spec.ts
```

## API

La documentación interactiva de Swagger está disponible en:

```
http://localhost:3000/api/docs
```

### Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Iniciar sesión |
| `POST` | `/api/auth/refresh` | Público | Renovar token |
| `POST` | `/api/auth/logout` | JWT | Cerrar sesión |
| `POST` | `/api/usuarios` | ADMIN | Crear usuario |
| `GET` | `/api/usuarios` | ADMIN | Listar usuarios |
| `GET` | `/api/usuarios/:id` | JWT | Obtener usuario |
| `PUT` | `/api/usuarios/:id` | ADMIN | Actualizar usuario |
| `DELETE` | `/api/usuarios/:id` | ADMIN | Eliminar usuario |
| `POST` | `/api/pozos` | ADMIN | Crear pozo |
| `GET` | `/api/pozos` | JWT | Listar pozos |
| `GET` | `/api/pozos/:id` | JWT | Obtener pozo |
| `PUT` | `/api/pozos/:id` | ADMIN | Actualizar pozo |
| `DELETE` | `/api/pozos/:id` | ADMIN | Eliminar pozo |
| `POST` | `/api/tipos-indicador` | ADMIN | Crear tipo de indicador |
| `GET` | `/api/tipos-indicador` | JWT | Listar tipos de indicador |
| `GET` | `/api/tipos-indicador/:id` | JWT | Obtener tipo de indicador |
| `PUT` | `/api/tipos-indicador/:id` | ADMIN | Actualizar tipo de indicador |
| `DELETE` | `/api/tipos-indicador/:id` | ADMIN | Eliminar tipo de indicador |
| `POST` | `/api/registros` | JWT | Crear registro operativo |
| `GET` | `/api/registros` | JWT | Listar registros (paginado) |
| `GET` | `/api/registros/charts` | JWT | Datos para gráficas |
| `GET` | `/api/registros/:id` | JWT | Obtener registro |
| `PUT` | `/api/registros/:id` | JWT | Actualizar registro |
| `DELETE` | `/api/registros/:id` | JWT | Eliminar registro |
| `GET` | `/api/health` | Público | Health check |

### Formato de respuestas

**Éxito:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Despliegue con Docker

### Requisitos
- Docker 24+
- Docker Compose v2+

### Construir y ejecutar

```bash
# Variables obligatorias
export JWT_SECRET="tu-clave-secreta"
export JWT_REFRESH_SECRET="tu-clave-refresh"

# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f api
```

La API estará disponible en `http://localhost:3000`.

### Despliegue en Hostinger (VPS)

1. Conectar por SSH al VPS.
2. Instalar Docker y Docker Compose.
3. Clonar el repositorio.
4. Configurar `.env` con los valores de producción.
5. Ejecutar:

```bash
docker compose up -d
```

6. Configurar Nginx como reverse proxy (opcional pero recomendado):

```nginx
server {
    listen 80;
    server_name api.midominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Arquitectura

```
src/
├── app.module.ts              # Módulo raíz
├── main.ts                    # Punto de entrada
├── common/                    # Código compartido
│   ├── decorators/            # @Public(), @Roles(), @CurrentUser()
│   ├── dto/                   # DTOs genéricos (PaginationDto)
│   ├── exceptions/            # Filtro global de excepciones
│   ├── interceptors/          # TransformInterceptor, LoggingInterceptor
│   └── interfaces/            # JwtPayload, ApiResponse
├── config/
│   └── env.config.ts          # Configuración por entorno
├── database/
│   ├── database.module.ts     # Módulo global de base de datos
│   ├── prisma/                # Schema Prisma y migraciones
│   │   └── schema.prisma      # Modelo de datos oficial
│   ├── prisma.service.ts      # Servicio Prisma
│   └── seed.ts                # Seed de datos de ejemplo
├── modules/
│   ├── auth/                  # Autenticación (JWT, login, refresh)
│   ├── users/                 # CRUD de usuarios
│   ├── wells/                 # CRUD de pozos
│   ├── indicator-types/       # CRUD de tipos de indicador
│   └── records/               # Registros operativos + gráficas
└── shared/
    └── health/                # Health check
```

Cada módulo sigue la estructura: `controllers/`, `services/`, `dto/`.

## Stack técnico

- **Runtime:** Node.js 22+
- **Framework:** NestJS 11
- **ORM:** Prisma 6 (PostgreSQL)
- **Auth:** Passport + JWT + Refresh Token rotation
- **Validación:** class-validator + class-transformer
- **Documentación:** Swagger/OpenAPI
- **Seguridad:** Helmet, Rate Limiting (Throttler)
- **Pruebas:** Jest (75+ tests unitarios)
