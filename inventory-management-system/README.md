# Inventory Management System — Base Setup

Base scaffolding for an Inventory Management System backend built with **Express**, **Node.js**, **TypeScript**, and **Firebase (Firestore)**.

## Project Structure

```
inventory-management-system/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin SDK initialization
│   ├── controllers/
│   │   └── inventory.controller.ts
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handling
│   │   └── validate.ts          # Zod request validation middleware
│   ├── models/
│   │   └── inventoryItem.model.ts  # Types + Zod schemas
│   ├── routes/
│   │   ├── index.ts             # Root router
│   │   └── inventory.routes.ts
│   ├── services/
│   │   └── inventory.service.ts # Firestore data access logic
│   ├── utils/
│   │   ├── ApiError.ts
│   │   └── asyncHandler.ts
│   ├── app.ts                   # Express app config (middleware, routes)
│   └── server.ts                # Entry point — boots Firebase + server
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Firebase credentials

1. In the [Firebase Console](https://console.firebase.google.com/), go to **Project Settings → Service Accounts**.
2. Click **Generate new private key** — this downloads a JSON file.
3. Place it in the project root as `serviceAccountKey.json` (already gitignored), **or** copy its values into `.env` using the inline `FIREBASE_*` variables.
4. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

## 3. Run in development

```bash
npm run dev
```

Server starts on `http://localhost:5000` (or your configured `PORT`).

## 4. Build & run in production

```bash
npm run build
npm start
```

## API Endpoints

Base path: `/api/v1`

| Method | Endpoint                        | Description                       |
|--------|----------------------------------|------------------------------------|
| GET    | `/health`                       | Health check                      |
| POST   | `/inventory`                    | Create a new inventory item       |
| GET    | `/inventory`                    | Get all inventory items           |
| GET    | `/inventory/:id`                | Get a single item by ID           |
| PATCH  | `/inventory/:id`                | Update an item                    |
| DELETE | `/inventory/:id`                | Delete an item                    |
| POST   | `/inventory/:id/adjust-stock`   | Adjust stock quantity (± delta)   |

### Example: Create an item

```bash
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "sku": "WM-1001",
    "category": "Electronics",
    "quantity": 50,
    "unitPrice": 19.99,
    "reorderLevel": 10,
    "supplier": "Logitech"
  }'
```

### Example: Adjust stock

```bash
curl -X POST http://localhost:5000/api/v1/inventory/{id}/adjust-stock \
  -H "Content-Type: application/json" \
  -d '{ "delta": -5 }'
```

## Design Notes

- **Layered architecture**: routes → controllers → services keeps HTTP concerns separate from Firestore data-access logic, making it easy to swap or test each layer independently.
- **Validation**: Zod schemas validate request bodies before they reach controllers.
- **Error handling**: A central `ApiError` class + `errorHandler` middleware ensures consistent JSON error responses.
- **Stock adjustments** use a Firestore transaction to avoid race conditions when multiple requests update the same item concurrently.

## Suggested Next Steps

- Add Firebase Authentication middleware to protect routes (verify ID tokens).
- Add pagination/filtering to `GET /inventory` (by category, low-stock, etc.).
- Add unit/integration tests (e.g., Jest + Firebase emulator).
- Add request logging/monitoring for production (e.g., Winston, Sentry).
- Add a `users`/`suppliers`/`orders` module following the same layered pattern.
