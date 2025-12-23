# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based API for Stripe payment processing with webhook handling, built as a Fiverr demo project. It demonstrates clean architecture principles, JWT authentication with HTTP-only cookies, and webhook idempotency.

**Tech Stack:** NestJS, TypeScript, MongoDB (Mongoose), Stripe, Passport JWT, pnpm

## Development Commands

### Running the Application
```bash
pnpm install              # Install dependencies
pnpm start:dev            # Development with hot reload
pnpm start:debug          # Debug mode with watch
pnpm build                # Build for production
pnpm start:prod           # Run production build
```

### Testing
```bash
pnpm test                 # Run unit tests
pnpm test:watch           # Unit tests in watch mode
pnpm test:e2e             # Run all E2E tests
pnpm test:e2e -- auth.e2e-spec.ts  # Run specific E2E test
pnpm test:cov             # Generate coverage report
```

### Code Quality
```bash
pnpm lint                 # ESLint with auto-fix
pnpm format               # Prettier format
```

### Docker
```bash
docker build -t stripe-payments-api .
docker run -p 3000:3000 --env-file .env stripe-payments-api
```

## Architecture & Code Organization

### Clean Architecture Layers

The codebase follows Clean Architecture with these layers (from outside to inside):

1. **Controllers** (`controllers/`) - HTTP request/response handling, validation
2. **Use Cases** (`use-cases/`) - Business logic, orchestration
3. **Repository** (`repository/`) - Data access abstraction
4. **Providers** (`providers/`) - External service integrations (Stripe, JWT, Hash)
5. **Domain** (`domain/`) - Pure entities and interfaces

**IMPORTANT:** Avoid using "services" terminology - this codebase uses "use-cases" for business logic and "providers" for external dependencies.

### Module Structure

Each feature module (`src/modules/*`) contains:
```
module-name/
├── controllers/         # HTTP endpoints
├── use-cases/          # Business logic (NOT services)
├── repository/         # Database abstraction
├── providers/          # External integrations
├── domain/             # Entities, interfaces
├── schemas/            # Mongoose schemas
└── module-name.module.ts
```

### Authentication Architecture

**Cookie-based JWT Authentication:**
- Access tokens (15m) and refresh tokens (30d) stored in HTTP-only cookies
- `@CurrentUser()` decorator extracts authenticated user from request
- `CookieExtractor` utility provides type-safe cookie extraction
- JWT strategy validates tokens from cookies (NOT Authorization headers)

**Key Files:**
- `src/modules/auth/decorators/current-user.decorator.ts` - Extract user from request
- `src/modules/auth/strategies/cookie-extractor.ts` - Type-safe cookie extraction
- `src/modules/auth/config/cookie.config.ts` - Centralized cookie configuration

**Usage in Controllers:**
```typescript
@UseGuards(JwtAuthGuard)
async myEndpoint(@CurrentUser('userId') userId: string) {
  // userId extracted from JWT in cookie
}
```

### Stripe Webhook Handling

**Idempotency Pattern:**
- Uses MongoDB unique constraint on `eventId` as distributed lock
- `tryAcquire()` pattern: insert first, catch duplicate key error (code 11000)
- Prevents race conditions in concurrent webhook processing
- TTL index auto-deletes events after 3 days

**Handler Pattern (Strategy):**
- `WebhookEventHandler` interface for extensibility
- Separate handlers: `SuccessPaymentHandler`, `FailedPaymentHandler`, `CancelledPaymentHandler`
- Handler map in `HandleStripeWebhookUseCase`
- Custom business logic (emails, inventory) goes in handler implementations

**Key Files:**
- `src/modules/orders/use-cases/integrations/handle-stripe-webhook.use-case.ts`
- `src/modules/orders/repository/webhook-events.repository.ts`
- `src/modules/orders/use-cases/integrations/handlers/*`

### Products Module

- **Read-only** - No create/update endpoints
- Uses seeder (`ProductsSeeder`) with `OnModuleInit` to populate mock data
- 6 mock products auto-seed if database is empty
- Products auto-cleanup after 3 days (TTL index)

## Important Patterns & Conventions

### Import Paths
**CRITICAL:** Always use relative imports, NOT absolute `src/...` paths. Jest E2E tests will fail with absolute imports.

```typescript
// ❌ Wrong
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

// ✅ Correct
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
```

### Mongoose Enum Types
When using TypeScript enums in Mongoose schemas, explicitly specify `type: String`:

```typescript
@Prop({
  required: true,
  type: String,        // ← Required for enums
  enum: OrderStatus,
  default: OrderStatus.PENDING,
})
status: OrderStatus;
```

### Cookie-Parser Import
Use default import for cookie-parser (not namespace import):

```typescript
// ✅ Correct
import cookieParser from 'cookie-parser';

// ❌ Wrong
import * as cookieParser from 'cookie-parser';
```

## Environment Configuration

Required environment variables (see `.env.example`):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Access token secret
- `JWT_EXPIRES_IN` - Access token expiration (e.g., "15m")
- `JWT_REFRESH_SECRET` - Refresh token secret
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (e.g., "30d")
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `PORT` - Server port (default: 3000)

Test environment uses `.env.test` with separate database.

## API Documentation

Swagger available at `/api` when running the application. All endpoints documented with:
- Request/response DTOs
- Status codes
- Error responses
- Authentication requirements

## Docker Build Notes

The Dockerfile is optimized for NestJS with bcrypt:
- Multi-stage build (deps → build → runner)
- Native build dependencies (python3, make, g++) for bcrypt compilation
- Pinned pnpm version (10.24.0) via corepack
- BuildKit cache mounts for faster builds
- Non-root user (nestjs) for security
- Health check included

## Testing Strategy

### E2E Tests
- Located in `test/*.e2e-spec.ts`
- Use real MongoDB connection (test database)
- Bootstrap full NestJS application
- Clean database after each test
- Test environment loaded via `test/setup-e2e.ts`

**Example:** `test/auth.e2e-spec.ts` - 17 comprehensive authentication tests covering registration, login, refresh, logout, and protected routes with cookie validation.

## Common Gotchas

1. **HTTP Status Codes:** Login, refresh, and logout endpoints return `201 Created`, not `200 OK`
2. **Passport Strategy:** Extracts JWT from cookies, not Authorization header
3. **Webhook Raw Body:** NestJS app created with `rawBody: true` for Stripe signature verification
4. **CORS:** Enabled with `credentials: true` for cookie support
5. **Order Schema:** Items are embedded documents, not references
6. **Product Validation:** `findByIds()` validates all products exist before order creation
