# EcoCampus Backend

Backend para EcoCampus, un sistema de control inteligente de aulas donde usuarios con rol `TEACHER` o `STUDENT` escanean el QR de un salón, consultan dispositivos disponibles y controlan luces, ventiladores y proyector según sus permisos.

El proyecto está construido con NestJS, Prisma 7, PostgreSQL, JWT y Socket.IO.

## Características

- Autenticación con JWT.
- Registro y login de usuarios.
- Roles básicos: `TEACHER` y `STUDENT`.
- CRUD básico de salones.
- CRUD básico de dispositivos.
- Escaneo de QR para acceder a dispositivos de un aula.
- Registro de sesiones QR.
- Permisos calculados por rol al escanear QR.
- Eventos en tiempo real con Socket.IO.
- Dashboard con métricas simuladas de consumo, ahorro y actividad.
- PostgreSQL con Docker Compose.

## Stack

- Node.js
- NestJS 11
- Prisma 7
- PostgreSQL 16
- Socket.IO
- Passport JWT
- bcrypt
- class-validator
- Docker Compose

## Requisitos

Instala antes de correr el proyecto:

- Node.js 20 o superior
- npm
- Docker Desktop
- Docker Compose

## Instalación

Clona el repositorio e instala dependencias:

```bash
npm install
```

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto.

Ejemplo:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecocampus"
JWT_SECRET="super-secret-dev-key"
PORT=3000
```

Notas:

- `DATABASE_URL` debe coincidir con los valores de `docker-compose.yml`.
- `JWT_SECRET` se usa para firmar y validar tokens JWT.
- `PORT` es opcional. Si no se define, Nest usa `3000`.

## Base de Datos con Docker

Levanta PostgreSQL:

```bash
docker compose up -d
```

Verifica que el contenedor esté corriendo:

```bash
docker ps
```

El servicio incluido usa:

```txt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=ecocampus
PORT=5432
```

## Prisma

Genera el cliente de Prisma:

```bash
npx prisma generate
```

Ejecuta migraciones:

```bash
npx prisma migrate dev
```

Abrir Prisma Studio:

```bash
npx prisma studio
```

Nota sobre Prisma 7:

Este proyecto usa `@prisma/adapter-pg` para PostgreSQL. El `PrismaService` construye el cliente con el adapter requerido por Prisma 7.

## Correr el Proyecto

Modo desarrollo con watch:

```bash
npm run start:dev
```

Modo normal:

```bash
npm run start
```

Modo producción:

```bash
npm run build
npm run start:prod
```

Servidor por defecto:

```txt
http://localhost:3000
```

Si el puerto está ocupado:

```bash
PORT=3001 npm run start:dev
```

## Scripts Disponibles

```bash
npm run build
npm run format
npm run start
npm run start:dev
npm run start:prod
npm run test
npm run test:e2e
npm run test:cov
```

## Modelos Principales

### User

- `id`
- `name`
- `email`
- `password`
- `role`
- `createdAt`

### Classroom

- `id`
- `name`
- `qrCode`

### Device

- `id`
- `name`
- `type`
- `status`
- `classroomId`

### QRSession

- `id`
- `userId`
- `classroomId`
- `entryTime`

## Enums

```ts
Role = 'TEACHER' | 'STUDENT'
DeviceType = 'LIGHT' | 'PROJECTOR' | 'FAN'
DeviceStatus = 'ON' | 'OFF'
```

## Autenticación

### Registrar Usuario

```txt
POST /auth/register
```

Body:

```json
{
  "name": "Ana Profesora",
  "email": "ana@ecocampus.com",
  "password": "123456",
  "role": "TEACHER"
}
```

Respuesta:

```json
{
  "id": 1,
  "name": "Ana Profesora",
  "email": "ana@ecocampus.com",
  "role": "TEACHER",
  "createdAt": "2026-05-20T00:00:00.000Z"
}
```

Errores:

- `409 Conflict`: email ya registrado.
- `400 Bad Request`: body inválido.

### Login

```txt
POST /auth/login
```

Body:

```json
{
  "email": "ana@ecocampus.com",
  "password": "123456"
}
```

Respuesta:

```json
{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": 1,
    "name": "Ana Profesora",
    "email": "ana@ecocampus.com",
    "role": "TEACHER"
  }
}
```

El payload del JWT incluye:

```json
{
  "sub": 1,
  "email": "ana@ecocampus.com",
  "role": "TEACHER"
}
```

## Headers para Endpoints Protegidos

```txt
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

## Salones

### Crear Salón

```txt
POST /classrooms
```

Body:

```json
{
  "name": "A-201",
  "qrCode": "ROOM_A201"
}
```

Errores:

- `409 Conflict`: QR duplicado.

### Listar Salones

```txt
GET /classrooms
```

### Obtener Salón con Dispositivos

```txt
GET /classrooms/:id
```

Ejemplo:

```txt
GET /classrooms/1
```

Errores:

- `404 Not Found`: salón no encontrado.

## Dispositivos

### Crear Dispositivo

```txt
POST /devices
```

Body:

```json
{
  "name": "Luces",
  "type": "LIGHT",
  "classroomId": 1
}
```

Tipos válidos:

```txt
LIGHT
PROJECTOR
FAN
```

Errores:

- `404 Not Found`: salón no encontrado.

### Listar Dispositivos

```txt
GET /devices
```

### Obtener Dispositivo

```txt
GET /devices/:id
```

### Encender o Apagar Dispositivo

```txt
PATCH /devices/:id/toggle
```

Ejemplo:

```txt
PATCH /devices/1/toggle
```

No requiere body.

Respuesta:

```json
{
  "id": 1,
  "name": "Luces",
  "type": "LIGHT",
  "status": "ON",
  "classroomId": 1
}
```

Al ejecutar este endpoint se emite el evento WebSocket `device.updated`.

Nota actual:

El backend todavía no aplica permisos por rol en este endpoint. La restricción por rol se calcula en el flujo QR mediante la propiedad `allowed`.

## QR

### Escanear QR

```txt
POST /qr/scan
```

Requiere JWT.

Body:

```json
{
  "qrCode": "ROOM_A201"
}
```

Respuesta para `TEACHER`:

```json
{
  "classroom": {
    "id": 1,
    "name": "A-201"
  },
  "devices": [
    {
      "id": 1,
      "name": "Luces",
      "type": "LIGHT",
      "status": "OFF",
      "allowed": true
    },
    {
      "id": 2,
      "name": "Proyector",
      "type": "PROJECTOR",
      "status": "OFF",
      "allowed": true
    }
  ]
}
```

Respuesta para `STUDENT`:

```json
{
  "classroom": {
    "id": 1,
    "name": "A-201"
  },
  "devices": [
    {
      "id": 1,
      "name": "Luces",
      "type": "LIGHT",
      "status": "OFF",
      "allowed": true
    },
    {
      "id": 2,
      "name": "Proyector",
      "type": "PROJECTOR",
      "status": "OFF",
      "allowed": false
    }
  ]
}
```

Reglas:

- `TEACHER`: puede controlar `LIGHT`, `PROJECTOR` y `FAN`.
- `STUDENT`: solo puede controlar `LIGHT`.

Al escanear QR:

- Se busca el salón por `qrCode`.
- Se registra una nueva `QRSession`.
- Se devuelven dispositivos con `allowed`.
- Se emite el evento WebSocket `qr.scanned`.

Errores:

- `401 Unauthorized`: token ausente o inválido.
- `404 Not Found`: QR inválido o salón no encontrado.

## Dashboard y Analytics

### Resumen

```txt
GET /dashboard/summary
```

Respuesta:

```json
{
  "activeClassrooms": 3,
  "devicesOn": 8,
  "totalDevices": 15,
  "activeSessions": 5,
  "estimatedConsumption": 24.5,
  "estimatedSavings": 12.2
}
```

Reglas de consumo simulado:

```txt
LIGHT ON = 0.3 kWh
FAN ON = 0.5 kWh
PROJECTOR ON = 0.8 kWh
```

### Salones para Dashboard

```txt
GET /dashboard/classrooms
```

Respuesta:

```json
[
  {
    "id": 1,
    "name": "A-201",
    "devicesOn": 2,
    "totalDevices": 3,
    "status": "ACTIVE"
  }
]
```

### Dispositivos Agrupados por Salón

```txt
GET /dashboard/devices
```

Respuesta:

```json
[
  {
    "classroom": {
      "id": 1,
      "name": "A-201",
      "qrCode": "ROOM_A201"
    },
    "devices": [
      {
        "id": 1,
        "name": "Luces",
        "type": "LIGHT",
        "status": "ON",
        "estimatedConsumption": 0.3
      }
    ]
  }
]
```

### Actividad Reciente

```txt
GET /dashboard/activity
```

Respuesta:

```json
{
  "latestQrSessions": [
    {
      "id": 1,
      "entryTime": "2026-05-20T00:00:00.000Z",
      "user": {
        "id": 1,
        "name": "Ana",
        "email": "ana@ecocampus.com",
        "role": "TEACHER"
      },
      "classroom": {
        "id": 1,
        "name": "A-201"
      }
    }
  ],
  "latestDevicesModified": [
    {
      "id": 1,
      "name": "Luces",
      "type": "LIGHT",
      "status": "ON",
      "classroom": {
        "id": 1,
        "name": "A-201"
      }
    }
  ]
}
```

Nota:

`Device` todavía no tiene `updatedAt`, por lo que `latestDevicesModified` se ordena por `id` descendente.

## WebSocket con Socket.IO

El backend expone Socket.IO en el mismo host y puerto de Nest.

```txt
http://localhost:3000
```

CORS está abierto para desarrollo.

### Eventos Emitidos

#### device.updated

Se emite cuando se ejecuta:

```txt
PATCH /devices/:id/toggle
```

Payload:

```json
{
  "deviceId": 1,
  "name": "Luces",
  "type": "LIGHT",
  "status": "ON",
  "classroomId": 1
}
```

#### qr.scanned

Se emite cuando se ejecuta:

```txt
POST /qr/scan
```

Payload:

```json
{
  "classroomId": 1,
  "classroomName": "A-201",
  "userRole": "TEACHER"
}
```

### Cliente Socket.IO

Instala en frontend:

```bash
npm install socket.io-client
```

Ejemplo:

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('device.updated', (payload) => {
  console.log('device.updated', payload);
});

socket.on('qr.scanned', (payload) => {
  console.log('qr.scanned', payload);
});
```

## Flujo de Prueba Recomendado

1. Levantar PostgreSQL:

```bash
docker compose up -d
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar `.env`.

4. Ejecutar migraciones:

```bash
npx prisma migrate dev
```

5. Generar Prisma Client:

```bash
npx prisma generate
```

6. Levantar backend:

```bash
npm run start:dev
```

7. Crear usuario:

```txt
POST /auth/register
```

8. Iniciar sesión:

```txt
POST /auth/login
```

9. Crear salón:

```txt
POST /classrooms
```

10. Crear dispositivos:

```txt
POST /devices
```

11. Escanear QR con token:

```txt
POST /qr/scan
```

12. Encender o apagar dispositivo:

```txt
PATCH /devices/:id/toggle
```

13. Consultar dashboard:

```txt
GET /dashboard/summary
GET /dashboard/classrooms
GET /dashboard/devices
GET /dashboard/activity
```

## Probar con Postman o Thunder Client

### Login

```txt
POST http://localhost:3000/auth/login
```

Body:

```json
{
  "email": "ana@ecocampus.com",
  "password": "123456"
}
```

Copia `accessToken`.

### Escanear QR

```txt
POST http://localhost:3000/qr/scan
```

Headers:

```txt
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "qrCode": "ROOM_A201"
}
```

### Socket.IO en Postman

1. Crear request de tipo `Socket.IO`.
2. Conectar a:

```txt
http://localhost:3000
```

3. Escuchar eventos:

```txt
device.updated
qr.scanned
```

4. Ejecutar `PATCH /devices/:id/toggle` o `POST /qr/scan` desde otra request HTTP.

## Validaciones y Errores Comunes

- `400 Bad Request`: DTO inválido.
- `401 Unauthorized`: JWT ausente, inválido o expirado.
- `404 Not Found`: salón, dispositivo o QR no encontrado.
- `409 Conflict`: email o QR duplicado.
- `EADDRINUSE`: el puerto ya está ocupado. Usa otro puerto con `PORT=3001 npm run start:dev`.
- Error de conexión a DB: revisa que Docker esté corriendo y que `DATABASE_URL` coincida.

## Estructura del Proyecto

```txt
src/
  auth/
    decorators/
    dto/
    guards/
    strategies/
    types/
  classrooms/
    dto/
  dashboard/
  devices/
    dto/
  prisma/
  qr/
    dto/
  websocket/
```

## Estado Actual de Seguridad

Implementado:

- JWT.
- Guard JWT para `/qr/scan`.
- Password hashing con bcrypt.
- Validación de DTOs.

Pendiente recomendado:

- Proteger endpoints administrativos.
- Aplicar permisos por rol en `PATCH /devices/:id/toggle`.
- Agregar refresh tokens.
- Agregar rate limiting.
- Agregar historial real de cambios de dispositivos.
- Agregar `updatedAt` a `Device`.

## Desarrollo Frontend

Existe un documento con instrucciones para implementar la app móvil:

```txt
REACT_NATIVE_IMPLEMENTATION.md
```

Ese archivo describe pantallas, modelos TypeScript, endpoints, Socket.IO y criterios de aceptación para una app React Native.

## Comandos Rápidos

```bash
docker compose up -d
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

## Licencia

Proyecto académico/hackathon. Ajustar licencia según las necesidades del equipo.
