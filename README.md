# CollabBoard

A real-time collaborative kanban board for teams — built with a full TypeScript stack.
Create boards, invite teammates by email, and drag tasks across columns with changes
reflected instantly for everyone viewing the board (powered by Socket.io).

## Features

- **Authentication** — JWT-based register/login with hashed passwords (bcrypt)
- **Boards & roles** — create boards, invite members, admin vs. member permissions
- **Kanban workflow** — default To Do / In Progress / Done columns, drag-and-drop reordering
- **Real-time sync** — task creation, movement, and deletion broadcast live via WebSockets
- **Activity log** — every board action is recorded (backend model, ready to surface in UI)
- **Dark mode ready** — Tailwind `dark:` classes throughout
- **Type-safe end to end** — TypeScript on both frontend and backend, Zod request validation

## Tech Stack

| Layer      | Technology                                      |
|------------|--------------------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript, Tailwind CSS   |
| Backend    | Node.js, Express, TypeScript, Socket.io          |
| Database   | PostgreSQL + Prisma ORM                          |
| Auth       | JWT, bcrypt                                       |
| Drag & Drop| @hello-pangea/dnd                                |

## Project Structure

```
collabboard/
├── backend/
│   ├── prisma/schema.prisma      # Data models: User, Board, Column, Task, Activity
│   └── src/
│       ├── controllers/          # Business logic
│       ├── routes/                # Express routers
│       ├── middleware/auth.ts    # JWT verification middleware
│       ├── sockets/               # Socket.io server + auth handshake
│       └── index.ts               # App entry point
└── frontend/
    ├── pages/                     # Next.js pages (login, register, dashboard, board/[id])
    ├── components/                # TaskCard, BoardColumn
    └── lib/                       # API client, socket client
```

## Getting Started

### 1. Database
Create a local PostgreSQL database (or use a free hosted instance from Neon/Supabase/Railway).

### 2. Backend
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev                # runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # runs on http://localhost:3000
```

Open `http://localhost:3000`, register an account, and create your first board.

## Deployment Notes

- **Frontend**: deploy to Vercel (zero-config for Next.js). Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
- **Backend**: deploy to Railway/Render, and provision PostgreSQL there or point `DATABASE_URL` at a hosted Postgres instance.
- Update `CLIENT_URL` in the backend `.env` to your deployed frontend origin for CORS + Socket.io.

## Possible Extensions

- Surface the `Activity` log in a sidebar for a live team feed
- Add file attachments to tasks
- Add board-level filtering/search
- Add email notifications for invites and due dates

## License

MIT
