# File Transformer API

Backend API for converting files between supported formats.

The application is built with **NestJS**, uses **Fastify** as the HTTP server, **PostgreSQL** as the database, and **Prisma** as the ORM. The project is fully containerized with Docker Compose to simplify local development and setup.

# Tech Stack

- Node.js 20
- NestJS 11
- Fastify
- TypeScript
- PostgreSQL 16
- Prisma 6.15.0
- Zod
- Swagger
- Docker / Docker Compose
- pnpm

# Prerequisites

Before starting the project, make sure the following tools are installed

- Node.js 20 or later
- pnpm 10 or later
- Docker
- Docker Compose

You can verify the installations:

```
node --version
pnpm --version
docker --version
docker compose version
```

The recommended way to run the application locally is with **Docker Compose**. The backend and PostgreSQL database run inside Docker and communicate through the Docker network. 

## Project Structure

The project follows a **modular monolithic NestJS architecture**:

```
src/
├── common/
│   |── config/
│       |── swagger.config.ts
│
│── core/
│   │── app/
│   │── config/
│   │── database/
│
│── modules/
│   │── admin/
│   │── auth/
│   │── users/
│
│── database
│   │── prisma/
│       │── generated/
│       │── migrations/
│       │── schema.prisma
│
│── main.ts
```
``common/``

Contains functionality shared across different parts of the application, such as common configuration and reusable infrastructure.

``core/``

Contains core application infrastructure and services required by the application as a whole.
For example:
- application-level functionality
- configuration
- database integration

``modules/``

Contains the application's business modules.
Each module encapsulates its own:
- controllers
- services
- schemas
- business logic
- Swagger documentation
- module configuration

``main.ts``

The application's entry point.
It creates and configures the NestJS application using the **Fastify adapter** and starts the single backend application.

## Code Style

- Use `@` aliases for imports (e.g., `@config/config.service`)
- Run `npm run format` before committing
- Follow NestJS module pattern
