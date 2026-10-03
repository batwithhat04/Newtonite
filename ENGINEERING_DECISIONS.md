# Engineering Decisions

## 1. Monolithic Repository with Separate Client/Server
I chose a simple dual-project structure (client and server folders) rather than a complex monorepo tooling like Nx or Turborepo. This minimizes setup time and configuration complexity while still cleanly separating the frontend and backend concerns. The backend is an Express Node.js app using TypeScript, and the frontend is a React application built with Vite and TypeScript.

## 2. SQLite and Prisma for Data Persistence
For the backend data store, I selected SQLite paired with Prisma ORM. SQLite is ideal for a one-day challenge as it requires no separate database server to configure or run, significantly simplifying the setup. Prisma provides type safety, easy schema migrations, and a clean query API, which accelerates development and ensures correctness compared to raw SQL queries.

## 3. Optimistic Concurrency Control (OCC)
To handle situations where "one user viewing information that another user has just changed," I implemented Optimistic Concurrency Control using a `version` field on the WorkItem entity. When an update occurs, the client sends the version it knows about. If the server's version is newer, the request is rejected with a 409 Conflict status. This prevents users from accidentally overwriting changes they haven't seen.

## 4. Frontend State Management with React Query
I chose `@tanstack/react-query` for frontend data fetching and caching. This library excels at handling stale data, optimistic updates, and background refetching. It allows the UI to remain responsive and accurately reflect the server state, mitigating issues where multiple updates happen simultaneously.

## 5. Event Sourcing for History (Audit Log)
To fulfill the requirement that "users need to collaborate around work items and understand how an item has evolved over time," I designed an append-only `WorkItemEvent` table. Every significant action (creation, status change, priority change, responsibility change) generates an event. This ensures important actions do not silently disappear and provides a reliable, ordered history for each work item.

## 6. Meaningful Authorization via Role-Based Access Control (RBAC)
I implemented a straightforward RBAC system where users belong to `Team`s and have `Role`s (e.g., ADMIN, MEMBER, VIEWER). The backend strictly enforces authorization at the resource level (e.g., only a team member can take responsibility for a work item assigned to that team).

## 7. Asynchronous Operations for Secondary Tasks
Instead of making every operation synchronous, the architecture allows for secondary tasks (like logging complex analytics or sending notifications, though simulated here) to happen asynchronously or out-of-band. For instance, when a work item's priority is elevated to "URGENT", the main update resolves quickly, but an asynchronous job might be scheduled to handle external integrations without blocking the user response.
