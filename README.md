# Newtonite Operations Under Pressure

This is a full-stack solution to the Newtonite Software Engineering Challenge, providing a system for teams to coordinate and manage operational work reliably.

## Technologies Used
- **Backend:** Node.js, Express, TypeScript, SQLite, Prisma ORM
- **Frontend:** React, Vite, TypeScript, Tailwind CSS v4, React Query, React Router, Lucide Icons

## Setup & Running the Application

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup
Navigate to the `server` directory, install dependencies, and start the server.
```bash
cd server
npm install
npx prisma db push
npx prisma generate
npm run dev # or npx tsx src/index.ts
```
The server will run on `http://localhost:3000`.

### 2. Frontend Setup
In a new terminal window, navigate to the `client` directory, install dependencies, and start the Vite dev server.
```bash
cd client
npm install
npm run dev
```
The frontend will typically run on `http://localhost:5173`.

### 3. Usage
When you open the frontend, it will automatically attempt to fetch initial users. If the database is empty, the client makes a request to `/api/seed` which populates the database with some sample Teams and Users to simulate identity.
You can simulate different users interacting with the system by selecting a user from the dropdown on the bottom left of the sidebar.

## Key Features & Critical Behaviours Addressed
- **Optimistic Concurrency Control:** Prevents data loss when multiple users edit the same item. If User B submits an update based on a stale version (e.g. because User A updated it in the meantime), User B gets a conflict error.
- **Audit Log / History:** Every significant action generates an immutable `WorkItemEvent`. Changes to status, priority, or assignment are logged alongside user comments.
- **Meaningful Authorization:** Operations are scoped by the `x-user-id` header (a simple simulation for this challenge).
- **Stale Data Handling:** React Query handles background polling and caching to ensure the UI stays synchronized with the server's current state.

## Limitations
- Authentication is simulated using a dropdown and a header (`x-user-id`). In a real application, proper JWT or session-based authentication would be implemented.
- Notifications and some async processing behaviors are implied by the architecture but lack external integrations (e.g. email sending).

Please see `ENGINEERING_DECISIONS.md` for architectural rationale.
