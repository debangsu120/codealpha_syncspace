# SyncSpace

Real-time collaboration platform with video calls, whiteboard, chat, and file sharing.

## Tech Stack

**Frontend:** React 19, TanStack Router, TanStack Query, Tailwind CSS 4, Framer Motion, Socket.IO Client, WebRTC

**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT Auth, Multer (file uploads)

**Deployment:** Vercel (frontend), Render (backend)

## Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas cluster (or local MongoDB)

## Getting Started

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Set up environment variables

**Server** — copy `server/.env.example` to `server/.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/syncspace
JWT_SECRET=<your-secret-key>
CLIENT_URL=http://localhost:5173
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run development servers

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173) concurrently.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both servers in development mode |
| `npm run dev:server` | Start only the backend |
| `npm run dev:client` | Start only the frontend |
| `npm run build` | Build frontend for production |
| `npm run start` | Start the production server |
| `npm run install:all` | Install all dependencies |
| `npm run lint` | Lint frontend code |
| `npm run typecheck` | Type-check frontend code |

## Project Structure

```
SyncSpace/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── routes/           # TanStack Router file-based routes
│   │   ├── components/       # UI components
│   │   ├── lib/
│   │   │   ├── api.ts        # REST API client
│   │   │   ├── auth.tsx      # Auth context & provider
│   │   │   ├── room.tsx      # Room context & provider
│   │   │   ├── socket.ts     # Socket.IO client
│   │   │   └── webrtc.ts     # WebRTC hook (video/audio/screenshare)
│   │   ├── spa-entry.tsx     # SPA entry point (production)
│   │   └── styles.css        # Global styles & CSS variables
│   ├── vite.config.prod.ts   # Production Vite config (SPA mode)
│   └── vercel.json           # Vercel SPA routing config
├── server/                   # Express API server
│   ├── config/               # DB connection, env config
│   ├── controllers/          # Auth, user, room, file controllers
│   ├── middlewares/           # Auth middleware, upload handler, error handler
│   ├── models/               # Mongoose models (User, Room, Message, File)
│   ├── routes/               # Express routes
│   ├── sockets/              # Socket.IO event handlers
│   ├── uploads/              # User-uploaded files (gitignored)
│   ├── app.js                # Express app setup
│   └── server.js             # HTTP + Socket.IO server entry
├── render.yaml               # Render deployment blueprint
└── package.json              # Root scripts (concurrently for dev)
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (requires auth) |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update user profile |
| PUT | `/api/users/:id/password` | Change password |
| POST | `/api/rooms` | Create a room |
| GET | `/api/rooms` | List user's rooms |
| GET | `/api/rooms/:id` | Get room details |
| POST | `/api/rooms/:id/join` | Join a room |
| DELETE | `/api/rooms/:id` | Delete a room |
| GET | `/api/rooms/:id/messages` | Get room chat history |
| POST | `/api/rooms/:id/files` | Upload a file |
| GET | `/api/rooms/:id/files` | List room files |
| GET | `/api/files/download/:fileId` | Download a file |
| GET | `/api/health` | Health check |

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a room |
| `leave_room` | Client → Server | Leave a room |
| `room_participants` | Server → Client | Current participants on join |
| `user_joined` | Server → Client | New user joined |
| `user_left` | Server → Client | User left |
| `chat_message` | Bidirectional | Send/receive chat messages |
| `drawing_event` | Bidirectional | Whiteboard drawing sync |
| `clear_board` | Bidirectional | Clear whiteboard |
| `offer` | Client → Server | WebRTC SDP offer |
| `answer` | Client → Server | WebRTC SDP answer |
| `ice_candidate` | Client → Server | ICE candidate |
| `screen_share_started` | Client → Server | Screen share began |
| `screen_share_ended` | Client → Server | Screen share ended |
| `file_shared` | Bidirectional | Notify file upload |

## Features

- **Auth:** Register/login with JWT, protected routes
- **Rooms:** Create public/private rooms, join via 6-char code
- **Video Calls:** WebRTC peer-to-peer (mesh topology), mic/camera toggle, screen sharing
- **Chat:** Real-time messaging with MongoDB persistence
- **Whiteboard:** Collaborative canvas with pen, eraser, shapes, colors, undo/redo
- **File Sharing:** Upload/download files per room
- **Theme:** Dark/light mode toggle with system preference support

## Deployment

### Frontend (Vercel)

1. Import repo on [vercel.com](https://vercel.com)
2. Settings:
   - **Root Directory:** *(empty)*
   - **Build Command:** `cd frontend && npm run build:prod`
   - **Output Directory:** `frontend/dist/client`
3. Environment variable:
   - `VITE_API_URL` = `https://<your-render-url>`
4. Deploy

### Backend (Render)

1. Create a Web Service on [render.com](https://render.com)
2. Settings:
   - **Build Command:** `cd server && npm install && cd ../frontend && npm install && npm run build:prod`
   - **Start Command:** `cd server && node server.js`
3. Environment variables:
   - `PORT` = `5000`
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SECRET` = a long random string
   - `CLIENT_URL` = `https://<your-vercel-url>`
   - `NODE_ENV` = `production`
4. Deploy

### After deploying both

Set `CLIENT_URL` on Render to your exact Vercel URL and redeploy. This enables CORS for the frontend origin.

## License

Private
