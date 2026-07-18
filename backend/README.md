# CSEA Event Management System — Backend API

Backend REST API for the Computer Science and Engineering Association (CSEA), CEG to manage technical symposiums (SYNC, ABACUS etc..) and student registrations.

---

## Tech Stack

| Layer | Technology |

| Runtime | Node.js ≥ 18 |
| Framework | Express.js 4.x |
| Database | MongoDB (Atlas cloud / local) |
| ODM | Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator 7 |

---

## Database

**Primary:** MongoDB Atlas (cloud) — zero local install, accessible anywhere.  
**Fallback:** Local MongoDB — update `MONGO_URI` in `.env` to `mongodb://localhost:27017/csea_events`.

### Collections & Relationships

Users  ──(1:N)──  Events     (admin creates events)
Users  ──(M:N)──  Events     via  Registrations  collection

### Schema Overview

**User**
name, email (unique), password (bcrypt), rollNumber (unique),
department, year (1–4), role (student|admin), timestamps

**Event**
title, description, category (enum), symposium (SYNC|ABACUS|standalone),
venue, eventDate, registrationDeadline, maxParticipants, entryFee,
createdBy (→ User), isActive (soft-delete flag), tags[], timestamps

**Registration**
event (→ Event), student (→ User), status (confirmed|cancelled),
registeredAt
Compound unique index: { event, student }

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection (Atlas + local fallback)
│   ├── models/
│   │   ├── User.js                # Student/Admin schema
│   │   ├── Event.js               # Event schema + virtual populate + indexes
│   │   └── Registration.js        # Compound unique index
│   ├── middleware/
│   │   ├── auth.js                # protect() + authorize() middleware
│   │   └── errorHandler.js        # Central error handler
│   ├── validators/
│   │   ├── authValidator.js       # Register & Login rules
│   │   └── eventValidator.js      # Create & Update rules
│   ├── controllers/
│   │   ├── authController.js      # register, login
│   │   ├── eventController.js     # CRUD + listing with pagination
│   │   └── registrationController.js  # registerForEvent, getParticipants
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── registrationRoutes.js  # Sub-resource: /events/:id/registrations
│   └── app.js                     # Express app config
├── server.js                      # Entry point
├── .env.example                   # Environment variable template
├── package.json
└── README.md
```

---

## Setup & Execution

### Prerequisites
- Node.js ≥ 18
- A MongoDB Atlas account **or** local MongoDB installed

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

cp .env.example .env

Edit `.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas (recommended)
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/csea_events?retryWrites=true&w=majority

# OR local MongoDB fallback
# MONGO_URI=mongodb://localhost:27017/csea_events

JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=1d
```

### 3. Run

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`  

### 4. Create an Admin User

By default all registered users are `student`. To create an admin:
1. Register a user via `POST /api/auth/register`
2. Update their role directly in MongoDB Atlas dashboard or mongosh:
   ```js
   db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
   ```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Response Format
All responses follow:
```json
{
  "success": true | false,
  "message": "...",       // on error
  "data": { ... }         // on success
}
```

### Authentication
Protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth Routes

#### `POST /api/auth/register` — Register Student
**Body:**
```json
{
  "name": "Jeeva S",
  "email": "jeeva@example.com",
  "password": "secret123",
  "rollNumber": "2021502001",
  "department": "CSE",
  "year": 3
}
```
**Response `201`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jeeva S", "role": "student", ... }
}
```

---

#### `POST /api/auth/login` — Login
**Body:**
```json
{
  "email": "jeeva@example.com",
  "password": "secret123"
}
```
**Response `200`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { ... }
}
```

---

### Event Routes

#### `GET /api/events` — Get All Events
Public. Supports query params:

| Param | Example | Description |
|---|---|---|
| `symposium` | `ABACUS` | Filter by symposium |
| `category` | `hackathon` | Filter by category |
| `page` | `1` | Page number (default: 1) |
| `limit` | `10` | Results per page (default: 10) |

**Response `200`:**
```json
{
  "success": true,
  "total": 12,
  "page": 1,
  "pages": 2,
  "data": [ { ... } ]
}
```

---

#### `GET /api/events/:id` — Get Event by ID
Public.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Hackathon 2025",
    "registrationCount": 45,
    ...
  }
}
```

---

#### `POST /api/events` — Create Event
**Auth: Admin**

**Body:**
```json
{
  "title": "HackNight 2025",
  "description": "An all-night coding competition for CSE students.",
  "category": "hackathon",
  "symposium": "ABACUS",
  "venue": "CS Block, CEG",
  "eventDate": "2025-09-20T18:00:00.000Z",
  "registrationDeadline": "2025-09-15T23:59:59.000Z",
  "maxParticipants": 100,
  "entryFee": 50,
  "tags": ["coding", "competitive", "overnight"]
}
```

**Response `201`:** Event object

---

#### `PUT /api/events/:id` — Update Event
**Auth: Admin**  
Body: any subset of event fields (partial update supported).

**Response `200`:** Updated event object

---

#### `DELETE /api/events/:id` — Soft Delete Event
**Auth: Admin**  
Sets `isActive: false` (data preserved, registrations intact).

**Response `200`:**
```json
{ "success": true, "message": "Event deactivated successfully." }
```

---

### Registration Routes

#### `POST /api/events/:id/registrations` — Register for Event
**Auth: Student or Admin**

No body required. The student is identified from the JWT.

**Response `201`:**
```json
{
  "success": true,
  "message": "Registered successfully.",
  "data": { "event": "...", "student": "...", "status": "confirmed", ... }
}
```

**Error cases:**
| Code | Reason |
|---|---|
| 400 | Registration deadline passed |
| 409 | Already registered (compound index) |
| 409 | Event fully booked |
| 404 | Event not found or inactive |

---

#### `GET /api/events/:id/registrations` — View Participants
**Auth: Admin**

**Response `200`:**
```json
{
  "success": true,
  "event": "HackNight 2025",
  "totalParticipants": 12,
  "data": [
    {
      "student": {
        "name": "Jeeva S",
        "email": "jeeva@example.com",
        "rollNumber": "2021502001",
        "department": "CSE",
        "year": 3
      },
      "status": "confirmed",
      "registeredAt": "2025-09-10T10:00:00.000Z"
    }
  ]
}
```

---

## Error Handling

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing/invalid/expired token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate registration, duplicate email/roll) |
| 422 | Unprocessable entity (input validation failed) |
| 500 | Internal server error |

---

## Development Practices

- **Single Responsibility**: Each file has one clear purpose (config / model / middleware / validator / controller / route).
- **DRY**: `validate()` is a shared pipeline terminator reused across all validators. Update rules reuse create rules via `.optional()`.
- **Fail fast**: DB connection exits process on failure; bad routes return 404 before reaching error handler.
- **Security**: Passwords excluded from all queries via `select: false`; only re-selected explicitly during login.
- **Soft Delete**: Events are deactivated, not destroyed — registration history remains consistent.
- **No magic numbers**: All enums and constraints live in the schema, not scattered in controllers.
