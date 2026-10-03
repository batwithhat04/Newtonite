<div align="center">

# 🚀 Newtonite — Operations Center

**A real-time collaborative work item management system built for teams under pressure.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-newtonite.plum.vercel.app-blue?style=for-the-badge&logo=vercel)](https://newtonite.plum.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-newtonite.onrender.com-green?style=for-the-badge&logo=render)](https://newtonite.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat-square&logo=Prisma&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
- [API Reference](#-api-reference)
- [Engineering Decisions](#-engineering-decisions)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## 🌟 Overview

Newtonite is a full-stack operational work item management application designed for teams that need to coordinate, track, and resolve issues reliably and at speed.

Built as part of the **Newtonite Software Engineering Challenge**, the system addresses three critical requirements:

1. **Concurrent Collaboration** — Multiple users can view and update work items simultaneously without silently overwriting each other's changes.
2. **Immutable Audit History** — Every action (creation, update, comment) is permanently recorded with attribution.
3. **Real-time Awareness** — The UI stays in sync with the latest server state through intelligent polling and cache management.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📋 **Work Item Management** | Create, view, update, and filter work items by status and priority |
| 🔒 **Optimistic Concurrency Control** | Version-based conflict detection prevents silent data overwrites |
| 📜 **Full Audit Log** | Every change and comment is recorded in an immutable event log |
| 👥 **User Simulation** | Switch between multiple simulated users to test collaboration flows |
| ⚡ **Real-time Updates** | Automatic background polling keeps all clients in sync |
| 🎯 **Priority Management** | LOW / NORMAL / URGENT priority levels with visual indicators |
| 📊 **Status Workflow** | OPEN → IN_PROGRESS → REVIEW → RESOLVED pipeline |
| 🌐 **Production Ready** | Deployed on Vercel (frontend) + Render (backend) + Neon (PostgreSQL) |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + Vite** | UI framework and build tooling |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS v4** | Utility-first styling with dark mode design |
| **React Query (TanStack)** | Server state management, caching & polling |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with auth interceptors |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type-safe server code |
| **Prisma ORM** | Database access layer with migrations |
| **PostgreSQL** | Production database (via Neon) |
| **tsx** | TypeScript execution for development |

### Infrastructure
| Service | Role |
|---|---|
| **Vercel** | Frontend hosting + CDN |
| **Render** | Backend server hosting |
| **Neon** | Serverless PostgreSQL database |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Vercel CDN                        │
│              React + Vite Frontend                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │Dashboard │  │ Details  │  │  New Request   │   │
│  └────┬─────┘  └────┬─────┘  └───────┬────────┘   │
│       └─────────────┼─────────────────┘            │
│              React Query + Axios                    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                  Render.com                         │
│             Node.js / Express API                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Auth Middleware → Route Handlers             │  │
│  │  Optimistic Concurrency Control (versioning)  │  │
│  │  Prisma ORM → Transaction support             │  │
│  └─────────────────────┬─────────────────────────┘  │
└────────────────────────┼────────────────────────────┘
                         │ Connection Pool
┌────────────────────────▼────────────────────────────┐
│                   Neon (PostgreSQL)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │  User    │  │ WorkItem │  │  WorkItemEvent    │ │
│  │  Team    │  │ version  │  │  (Audit Log)      │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Database Schema

```prisma
model WorkItem {
  id          String          @id @default(uuid())
  title       String
  description String
  status      String          // OPEN | IN_PROGRESS | REVIEW | RESOLVED
  priority    String          // LOW | NORMAL | URGENT
  version     Int             @default(1)  // For OCC
  assignedTo  User?
  events      WorkItemEvent[] // Audit log
}

model WorkItemEvent {
  id         String    @id @default(uuid())
  type       String    // CREATED | UPDATED | COMMENTED
  payload    String    // JSON of changes
  user       User?
  createdAt  DateTime  @default(now())
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git**

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/batwithhat04/Newtonite.git
cd Newtonite
```

**2. Set up the Backend**
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

> **Note:** For local dev, SQLite is used. For production, switch to a PostgreSQL connection string.

Push the database schema and start the server:
```bash
npx prisma db push
npx prisma generate
npx tsx src/index.ts
```

The API will be running at `http://localhost:3000`

**3. Set up the Frontend**

In a new terminal:
```bash
cd client
npm install
npm run dev
```

The app will open at `http://localhost:5173`

**4. Seed Initial Data**

On first load, the app will automatically call `/api/seed` to populate the database with sample teams and users. You can also trigger it manually:
```bash
curl -X POST http://localhost:3000/api/seed
```

---

## 📡 API Reference

All endpoints (except `/api/users` and `/api/seed`) require the `x-user-id` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/work-items` | ✅ | Get all work items |
| `GET` | `/api/work-items/:id` | ✅ | Get item with full audit history |
| `POST` | `/api/work-items` | ✅ | Create a new work item |
| `PUT` | `/api/work-items/:id` | ✅ | Update item (requires `version` for OCC) |
| `POST` | `/api/work-items/:id/comments` | ✅ | Add a comment to an item |
| `GET` | `/api/users` | ❌ | Get all users (public for bootstrapping) |
| `POST` | `/api/seed` | ❌ | Populate DB with initial data |

### Optimistic Concurrency Control Example

```bash
# Successful update
PUT /api/work-items/:id
{ "status": "IN_PROGRESS", "version": 1 }  # → 200 OK, version becomes 2

# Conflict (stale version)
PUT /api/work-items/:id
{ "status": "RESOLVED", "version": 1 }     # → 409 Conflict
```

---

## 🧠 Engineering Decisions

See the full rationale in [`ENGINEERING_DECISIONS.md`](./ENGINEERING_DECISIONS.md).

### Key Decisions at a Glance

| Decision | Rationale |
|---|---|
| **Optimistic Concurrency Control** | Prevents lost updates when two users edit simultaneously using a `version` field |
| **Event Sourcing / Audit Log** | Append-only `WorkItemEvent` table gives a complete, attributed history per item |
| **React Query for State** | Handles caching, background polling, and stale-data detection without custom code |
| **SQLite → PostgreSQL** | SQLite for frictionless local dev; PostgreSQL for reliable production persistence |
| **Express + Prisma** | Minimal framework overhead with type-safe, transaction-capable database access |

---

## ☁️ Deployment

### Frontend (Vercel)

```
Framework:       Vite
Root Directory:  client
Build Command:   npm run build
Output Dir:      dist
```

### Backend (Render)

```
Runtime:         Node
Root Directory:  server
Build Command:   npm install && npx prisma generate && npm run build
Start Command:   node dist/index.js
```

### Environment Variables (Render)

| Key | Value |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `PORT` | `3000` |

---

## 📁 Project Structure

```
Newtonite/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx   # Work item list + filtering
│       │   ├── WorkItemDetails.tsx # Detail view + audit log
│       │   └── NewWorkItem.tsx # Creation form
│       ├── App.tsx             # Routing + user simulation
│       ├── api.ts              # Axios instance + interceptors
│       └── index.css           # Global styles + Tailwind
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   └── index.ts            # All routes + middleware
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── tests/
│       └── concurrency.test.ts # OCC behaviour tests
│
├── ENGINEERING_DECISIONS.md    # Architectural rationale
├── .gitignore
└── README.md
```

---

## 🧪 Running Tests

```bash
cd server
npm test
```

The test suite validates **Optimistic Concurrency Control** behaviour:
- ✅ User A can successfully update a work item
- ✅ User B's stale update is correctly rejected with a CONFLICT error
- ✅ Final item state reflects only the valid, non-conflicting update

---

<div align="center">

Built with ❤️ for the Newtonite Engineering Challenge

</div>
