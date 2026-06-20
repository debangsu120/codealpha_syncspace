# SyncSpace: Implementation Plan

## Project Overview

SyncSpace is a real-time collaboration platform for remote teams, combining video calling, screen sharing, whiteboard, chat, and file sharing in a single web application.

### Tech Stack

**Frontend (Existing UI Skeleton):**
- React 19 + Vite
- TanStack Start (SSR) + TanStack Router (file-based routing)
- TanStack React Query
- Tailwind CSS v4
- Framer Motion (animations)
- Lucide React (icons)
- shadcn/ui components

**Backend (To Be Built):**
- Node.js + Express.js
- MongoDB (Mongoose ODM)
- Socket.IO (real-time events)
- WebRTC (video/audio calling)
- JWT authentication (bcrypt for password hashing)
- Multer (file uploads)

### Frontend Structure (Existing Pages)

| Route | File | Status |
|-------|------|--------|
| `/` | `index.tsx` | UI Complete |
| `/login` | `login.tsx` | UI Complete |
| `/register` | `register.tsx` | UI Complete |
| `/dashboard` | `dashboard.tsx` | UI Complete |
| `/room` | `room.tsx` | UI Complete |
| `/meetings/create` | `meetings.create.tsx` | UI Complete |
| `/meetings/join` | `meetings.join.tsx` | UI Complete |
| `/whiteboard` | `whiteboard.tsx` | UI Complete |
| `/files` | `files.tsx` | UI Complete |
| `/profile` | `profile.tsx` | UI Complete |
| `/settings` | `settings.tsx` | UI Complete |

---

## Phase 1: Backend Foundation & Authentication (Days 1-3)

### 1.1 Project Scaffolding

**Create server directory structure:**
```
/server
  ├── config/
  │   └── db.js              # MongoDB connection
  │   └── env.js             # Environment variables
  ├── controllers/
  │   ├── authController.js  # Register, login, me
  │   ├── userController.js  # Profile CRUD
  │   ├── roomController.js  # Room CRUD
  │   └── fileController.js  # File upload/download
  ├── models/
  │   ├── User.js
  │   ├── Room.js
  │   ├── Message.js
  │   └── File.js
  ├── routes/
  │   ├── authRoutes.js
  │   ├── userRoutes.js
  │   ├── roomRoutes.js
  │   └── fileRoutes.js
  ├── middlewares/
  │   ├── auth.js            # JWT verification
  │   ├── errorHandler.js    # Centralized error handling
  │   └── upload.js          # Multer config
  ├── sockets/
  │   └── index.js           # Socket.IO event handlers
  ├── utils/
  │   └── generateToken.js   # JWT signing
  ├── app.js                 # Express app setup
  ├── server.js              # HTTP + Socket.IO server
  └── package.json
```

**Dependencies to install:**
```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv helmet express-rate-limit multer socket.io
npm install -D nodemon
```

### 1.2 MongoDB Models

**User Model (`models/User.js`):**
```javascript
// Fields: name, email (unique), passwordHash, role, createdAt
// Methods: comparePassword(candidatePassword)
```

**Room Model (`models/Room.js`):**
```javascript
// Fields: name, ownerId (ref: User), participants [ObjectId], 
//         isPrivate, passwordHash, createdAt
```

**Message Model (`models/Message.js`):**
```javascript
// Fields: roomId (ref: Room), senderId (ref: User), content, timestamp
```

**File Model (`models/File.js`):**
```javascript
// Fields: roomId (ref: Room), uploaderId (ref: User), 
//         fileName, fileURL, uploadedAt
```

### 1.3 Authentication API

**Endpoints:**
- `POST /api/auth/register` - Create user, return JWT
- `POST /api/auth/login` - Validate credentials, return JWT
- `GET /api/auth/me` - Get current user from JWT

**Implementation:**
- Password hashing with bcrypt (saltRounds: 10)
- JWT tokens with 15-minute expiry
- Auth middleware extracts token from `Authorization: Bearer` header

### 1.4 Frontend-Backend Integration Points

**Connect existing login/register pages:**
- Update `login.tsx` form submission to call `POST /api/auth/login`
- Update `register.tsx` form submission to call `POST /api/auth/register`
- Store JWT in localStorage or memory
- Create `AuthContext` for global auth state
- Add Axios instance with base URL and JWT interceptor

---

## Phase 2: Room Management (Days 4-5)

### 2.1 Room API

**Endpoints:**
- `GET /api/rooms` - List user's rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details (with password check if private)
- `DELETE /api/rooms/:id` - End meeting (owner only)

### 2.2 Frontend Room Flow

**Update existing pages:**
- `meetings.create.tsx` - Submit form to `POST /api/rooms`, redirect to room
- `meetings.join.tsx` - Validate room code via `GET /api/rooms/:id`, connect
- `dashboard.tsx` - Fetch rooms from `GET /api/rooms`, display in table
- `room.tsx` - Connect to Socket.IO on mount, emit `join_room`

### 2.3 Socket.IO Setup

**Server-side (`sockets/index.js`):**
```javascript
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('leave_room', (roomId) => socket.leave(roomId));
  socket.on('disconnect', () => { /* broadcast user_left */ });
});
```

**Client-side updates to `room.tsx`:**
- Connect to Socket.IO server on page load
- Emit `join_room` with room ID
- Listen for `user_joined`, `user_left` events
- Update participant list in real-time

---

## Phase 3: Real-time Chat (Days 5-6)

### 3.1 Chat API & Socket Events

**Optional persistence:**
- `GET /api/rooms/:id/messages` - Fetch chat history
- Messages stored via Socket.IO broadcast, persisted to MongoDB

**Socket events:**
- `chat_message` - Broadcast to room
- `typing` - Show typing indicator

### 3.2 Frontend Chat Integration

**Update `room.tsx` ChatPanel:**
- Replace hardcoded messages with dynamic state
- On send: emit `chat_message` via Socket.IO
- Listen for incoming `chat_message` events
- Display messages with sender name, timestamp
- Auto-scroll to latest message

---

## Phase 4: WebRTC Video Calling (Days 6-8)

### 4.1 WebRTC Signaling

**Socket events for signaling:**
- `offer` - SDP offer from initiator
- `answer` - SDP answer from responder
- `ice_candidate` - ICE candidate exchange

**Server relay (`sockets/index.js`):**
```javascript
socket.on('offer', (data) => {
  socket.to(data.to).emit('offer', { offer: data.offer, from: socket.id });
});
// Similar for answer, ice_candidate
```

### 4.2 Frontend WebRTC Integration

**Update `room.tsx` Tile component:**
- Request camera/mic via `navigator.mediaDevices.getUserMedia()`
- Create `RTCPeerConnection` for each participant
- Exchange SDP offers/answers via Socket.IO
- Handle ICE candidates
- Display remote video streams in tiles
- Implement mute/camera toggle (enable/disable tracks)

**STUN server configuration:**
```javascript
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});
```

### 4.3 Multi-user Handling

- Use mesh topology (each peer connects to all others)
- On `user_joined`: create peer connection, send offer
- On `offer`: create answer
- On `user_left`: remove video tile, close peer connection
- Limit: 4-6 participants for mesh (note in UI)

---

## Phase 5: Screen Sharing (Days 8-9)

### 5.1 Implementation

**Client-side:**
```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia();
// Replace video track in existing peer connections
```

**Socket events:**
- `screen_share_started` - Notify participants
- `screen_share_ended` - Revert to camera

### 5.2 Frontend Updates

**Update `room.tsx` FloatingToolbar:**
- Add screen share toggle button
- When active: replace camera track with screen track
- Show indicator when sharing
- Stop sharing: revert to camera stream

---

## Phase 6: Whiteboard (Days 9-10)

### 6.1 Canvas Implementation

**Update `whiteboard.tsx`:**
- Replace static SVG with interactive canvas
- Track drawing state (pen, eraser, shapes)
- Store strokes in local state

### 6.2 Real-time Sync

**Socket events:**
- `drawing_event` - Broadcast stroke data (coordinates, color, tool)
- `clear_board` - Clear canvas for all

**Data format:**
```javascript
{
  tool: 'pen' | 'eraser' | 'rect' | 'circle',
  color: '#6EEB83',
  size: 3,
  points: [{x, y}, ...]  // for pen/eraser
  start: {x, y}, end: {x, y}  // for shapes
}
```

---

## Phase 7: File Sharing (Days 10-11)

### 7.1 File Upload API

**Endpoint:**
- `POST /api/rooms/:id/files` - Upload file (multipart)
- `GET /api/rooms/:id/files` - List room files
- `GET /api/files/:fileId` - Download file

**Implementation:**
- Multer for file handling
- Store files in `/uploads` directory (or cloud storage)
- Validate file types and size (max 50MB)
- Generate unique filenames to prevent conflicts

### 7.2 Frontend Integration

**Update `room.tsx` FilesPanel:**
- Add file upload button (drag/drop or click)
- Call `POST /api/rooms/:id/files` on upload
- Listen for `file_shared` Socket event
- Display file list with download links
- Show upload progress

---

## Phase 8: Profile & Settings (Days 11-12)

### 8.1 User API

**Endpoints:**
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (name, password)

### 8.2 Frontend Updates

**Update `profile.tsx`:**
- Fetch user data on mount via `GET /api/users/:id`
- Submit form to `PUT /api/users/:id`
- Handle password change separately

**Update `settings.tsx`:**
- Implement theme toggle (dark/light mode)
- Store preferences in localStorage

---

## Phase 9: Polish & Error Handling (Days 12-14)

### 9.1 Error Handling

- Add global error boundary component
- Handle API errors with toast notifications
- Handle WebRTC failures gracefully
- Handle Socket.IO reconnection
- Add loading states for all async operations

### 9.2 Responsive Design

- Test and fix mobile layouts
- Ensure video grid works on small screens
- Make sidebar collapsible on mobile
- Optimize touch interactions for whiteboard

### 9.3 Security Hardening

- Add rate limiting to auth endpoints
- Validate all inputs server-side
- Sanitize file uploads
- Implement CORS properly
- Add Helmet security headers

---

## Phase 10: Testing & Deployment (Days 14-16)

### 10.1 Testing

- Test auth flows (register, login, logout)
- Test room creation and joining
- Test video calling (2+ users)
- Test chat messaging
- Test whiteboard sync
- Test file upload/download
- Test error scenarios (invalid room, wrong password)

### 10.2 Deployment

**Frontend (Vercel):**
- Connect GitHub repo to Vercel
- Set `VITE_API_URL` environment variable
- Auto-deploy on push to main

**Backend (Render):**
- Create Web Service on Render
- Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`
- Configure build command: `npm install`
- Configure start command: `node server.js`

**Database (MongoDB Atlas):**
- Create free-tier cluster
- Create database user
- Whitelist Render IP or allow all (0.0.0.0/0)
- Get connection string

### 10.3 Final Steps

- Update README with setup instructions
- Record demo video
- Test all features on deployed app
- Fix any deployment-specific issues

---

## Environment Variables

**Server `.env`:**
```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/syncspace
JWT_SECRET=your-64-char-secret-here
CLIENT_URL=http://localhost:5173
```

**Client `.env`:**
```
VITE_API_URL=http://localhost:5000
```

---

## API Reference

### Authentication
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{name, email, password}` | `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` | `{token, user}` |
| GET | `/api/auth/me` | - | `{user}` |

### Rooms
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/rooms` | - | `{rooms: [...]}` |
| POST | `/api/rooms` | `{name, isPrivate, password?}` | `{room}` |
| GET | `/api/rooms/:id` | - | `{room}` |
| DELETE | `/api/rooms/:id` | - | `{success}` |

### Files
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/rooms/:id/files` | `multipart/form-data` | `{file}` |
| GET | `/api/rooms/:id/files` | - | `{files: [...]}` |
| GET | `/api/files/:fileId` | - | File download |

### Users
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/users/:id` | - | `{user}` |
| PUT | `/api/users/:id` | `{name?, password?}` | `{user}` |

---

## Socket.IO Events Reference

### Client → Server
- `join_room(roomId)` - Join a room
- `leave_room(roomId)` - Leave a room
- `chat_message({roomId, message})` - Send chat message
- `offer({to, offer})` - WebRTC SDP offer
- `answer({to, answer})` - WebRTC SDP answer
- `ice_candidate({to, candidate})` - ICE candidate
- `drawing_event(roomId, strokeData)` - Whiteboard stroke
- `screen_share_started(roomId)` - Notify screen share
- `screen_share_ended(roomId)` - Notify stop sharing

### Server → Client
- `user_joined(userData)` - New user in room
- `user_left(userId)` - User left room
- `chat_message(messageData)` - Incoming chat message
- `offer({from, offer})` - Incoming SDP offer
- `answer({from, answer})` - Incoming SDP answer
- `ice_candidate({from, candidate})` - Incoming ICE candidate
- `drawing_event(strokeData)` - Whiteboard update
- `file_shared(fileData)` - New file in room
- `room_ended` - Host ended meeting

---

## Success Criteria

- [ ] User can register and login
- [ ] User can create and join rooms
- [ ] 2+ users can video call in a room
- [ ] Users can mute/unmute and toggle camera
- [ ] Users can share screens
- [ ] Users can send real-time chat messages
- [ ] Users can draw on shared whiteboard
- [ ] Users can upload and download files
- [ ] UI is responsive on mobile and desktop
- [ ] App is deployed and accessible via public URL
