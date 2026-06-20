# SyncSpace: PRD

## 1. Project Name Suggestions  
- **TeamSync** – Brand: a unified “team synchronizer.” Tagline: *“Connect and collaborate seamlessly.”* Color idea: bright blue accent (trustworthy tech vibe).  
- **LinkUp** – Brand: connecting people on video. Tagline: *“Link up with your team instantly.”* Color: green-blue gradient (fresh, tech-friendly).  
- **SyncSpace** – Brand: real-time shared workspace. Tagline: *“Your collaborative space, live.”* Color: purple/indigo (innovative, like Slack).  
- **CollaboHub** – Brand: hub for collaboration. Tagline: *“Where teams meet and create.”* Color: vibrant red/blue (energetic).  
- **MeetFlow** – Brand: smooth video meetings. Tagline: *“Meetings that flow.”* Color: teal/light blue (calm, professional).  
- **PeerPort** – Brand: peer-to-peer connection port. Tagline: *“Connect face-to-face, anywhere.”* Color: navy/sky blue (reliable).  
- **CommuLink** – Brand: community + link. Tagline: *“Your link to team collaboration.”* Color: modern gray/orange (tech-savvy).  
- **CircleChat** – Brand: networking in a circle. Tagline: *“Chat, share, and create together.”* Color: dark blue/white.  
- **CollabCore** – Brand: core of collaboration. Tagline: *“Empower your team’s core.”* Color: deep purple/white (professional).  
- **VibeDesk** – Brand: collaborative vibe. Tagline: *“Set the right vibe for teamwork.”* Color: green/pink (fresh, creative).  

**Selected Name:** **SyncSpace** – Modern, memorable, conveys synchronization and shared space. Tagline: *“Real-time collaboration for teams.”* Branding: use a bold indigo (#4A3FFF) as primary, with light accent (#9F7AFF) and neutral grays/white for a clean SaaS look.

## 2. Product Vision  

- **Purpose:** Enable real-time collaboration for remote teams and students. SyncSpace aims to replicate the experience of an in-person meeting room by providing multi-user video calls, screen sharing, shared whiteboard, chat, and secure file exchange.  

- **Problem Statement:** Remote teams lack a unified, easy-to-use platform that combines video conferencing, interactive whiteboarding, chat, and file sharing in one professional interface. Existing tools either specialize in one area or have clunky UIs, forcing teams to use multiple applications (e.g., Zoom for video + Slack for chat + Google Docs for whiteboard). SyncSpace solves this by integrating all required features in a single web app designed to feel like an intuitive, modern SaaS product.  

- **Goals:** Launch a polished MVP within 2–3 weeks that impresses recruiters. Key goals include: 
  - **Complete Features:** Implement all required features (authentication, multi-user video, chat, whiteboard, file sharing, screen share, room management). 
  - **User Experience:** Achieve a Slack/Zoom-level UI polish and responsive design. 
  - **Reliability:** Ensure real-time features work smoothly (low latency, robust connections). 
  - **Security:** Use industry best practices (encrypted communication, JWT auth, secure password hashing). 

- **Target Users:** Remote-working students and developer teams. Primarily tech-savvy users (junior devs, interns) who need a central collaboration tool for coursework or projects. Also anyone on small remote teams seeking a Slack/Zoom alternative. 

- **Success Metrics:** 
  - **Technical:** Zero critical bugs in real-time calls, 99% uptime for video/chat services, end-to-end encryption of media streams. 
  - **Usage:** Achieve a demo-ready application with sample data and flows. 
  - **Recruiter Appeal:** Code quality and architecture that demonstrate modern practices (e.g. clean monorepo, clear README). 
  - **User Feedback (if demoed):** 90% positive feedback on UX during mock demos; ability to handle 4+ participants with video without major lag.

## 3. Feature Breakdown  

### Authentication  
- **Description:** Users sign up with email/password, then log in to receive a JSON Web Token (JWT) for session management. Only authenticated users can create/join rooms or access protected routes.  
- **User Stories:** 
  - As a user, I want to create an account with my email so that I can access the app.  
  - As a user, I want to log in and out securely, so that no one else can use my account.  
  - As a developer/admin, I want role-based access (future expansion) to restrict admin features.  
- **Functional Requirements:** 
  - **Signup:** `POST /api/auth/register` accepts name, email, password.  
  - **Login:** `POST /api/auth/login` accepts email, password; returns JWT.  
  - Passwords must be hashed (bcrypt with ~10 salt rounds) before storing in MongoDB.  
  - JWT secret stored securely (64+ character secret, loaded from env).  
  - Provide `GET /api/auth/me` to return current user info from JWT.  
- **Non-Functional Requirements:** 
  - Use HTTPS for all auth endpoints.  
  - Enforce strong passwords on signup.  
  - JWT tokens: access tokens short-lived, refresh tokens in HTTP-only cookies or strong rotation.  
  - Protect against brute force (rate-limit login attempts).  
- **Edge Cases:** 
  - Duplicate email registration (return 409 Conflict).  
  - Wrong credentials on login (return generic 401 Unauthorized).  
  - Expired JWT (return 401 with message to re-login).  
- **Acceptance Criteria:** 
  - Given valid credentials, user receives a JWT and can access protected APIs.  
  - Passwords are not stored in plain text (verify bcrypt hash).  
  - Invalid credentials produce error messages without revealing which field is wrong.

### Multi-user Video Calling  
- **Description:** Real-time video/audio chat for multiple participants in a meeting room. Implemented using WebRTC, likely via peer-to-peer connections or via an SFU if needed for scale.  
- **User Stories:** 
  - As a meeting participant, I want to see my video and others’ video streams in real time.  
  - As a user, I want to mute/unmute my mic and turn camera on/off during the call.  
  - As a host, I want to be able to admit users into the room only if authenticated (private rooms).  
- **Functional Requirements:** 
  - Establish WebRTC `RTCPeerConnection` for each pair of users (mesh) or through an SFU for groups.  
  - Use Socket.io for signaling (exchange offers/answers and ICE candidates).  
  - Use STUN (public) for NAT traversal; integrate TURN server if needed.  
  - UI controls for mute/unmute and camera on/off.  
- **Non-Functional Requirements:** 
  - Low latency audio/video (target <200ms round-trip).  
  - Scalable to at least 4–6 participants (beyond that an SFU is preferable).  
  - Encrypt media streams end-to-end (WebRTC uses DTLS-SRTP by default).  
  - Adaptive to bandwidth: lower quality if network is poor.  
- **Edge Cases:** 
  - User denies camera/mic permission: prompt and handle gracefully (allow joining with audio-only or blank video).  
  - Very low bandwidth: may drop video to preserve audio.  
  - Mobile users: ensure layout responsively fits smaller screens.  
- **Acceptance Criteria:** 
  - When two or more users join the same room, each user sees all live video streams (tested with dummy users).  
  - Toggling mute/camera instantly updates local and remote views.  
  - If a user disconnects, their video tile is removed on others’ screens without breaking others’ streams.  

### Screen Sharing  
- **Description:** Allow a participant to share their desktop or application window with others in the meeting. Uses WebRTC’s `getDisplayMedia`.  
- **User Stories:** 
  - As a presenter, I want to share my screen so team members can view my presentation.  
  - As a viewer, I want to see the presenter's shared screen full-size.  
- **Functional Requirements:** 
  - Button in UI to “Share Screen” that calls `navigator.mediaDevices.getDisplayMedia()`.  
  - Stream the captured screen into the existing WebRTC peer connections (just like video).  
  - Allow user to stop sharing.  
- **Non-Functional Requirements:** 
  - Notify participants (UI overlay) when screen share is active.  
  - Ensure shared screen has good resolution (no auto-scaling artifact).  
- **Edge Cases:** 
  - Browser may block screen share (e.g., no support). Provide message if unsupported.  
  - Presenter accidentally shares wrong window: UI focus message.  
- **Acceptance Criteria:** 
  - When user starts screen share, all other participants see the screen stream instead of or alongside the camera video.  
  - Ending share reverts to camera stream for that user.  

### Whiteboard (Drawing/Writing)  
- **Description:** A collaborative canvas that all participants can draw/write on in real time. Synchronization via Socket.io.  
- **User Stories:** 
  - As a participant, I want to draw or write on a shared whiteboard that everyone sees update live.  
  - As an admin, I want to clear the board for all users.  
- **Functional Requirements:** 
  - Canvas element in the meeting room page; support freehand drawing (mouse/touch) and text.  
  - On each drawing event (stroke start, move, end), emit coordinates and styling over Socket.io to other clients.  
  - Optional: basic tools (pen color/size, eraser).  
- **Non-Functional Requirements:** 
  - Low-latency sync: strokes appear quickly (<100ms) on all screens.  
  - Order-preserving events so drawings don’t clash.  
- **Edge Cases:** 
  - Simultaneous drawing: maintain order of events or allow multiple cursors.  
  - Large number of strokes: manage memory (limit undo stack).  
- **Acceptance Criteria:** 
  - When one user draws, all others see the exact strokes drawn with minimal lag.  
  - A “Clear” action by host wipes the board for everyone.  

### File Sharing  
- **Description:** Allow participants to upload and share files (images, PDFs, docs) in a meeting room. Files are stored on the server (or cloud storage).  
- **User Stories:** 
  - As a user, I want to upload a file so that others in the meeting can download it.  
  - As a user, I want to download any file that has been shared in the room.  
- **Functional Requirements:** 
  - Drag/drop or select file upload UI in meeting room.  
  - POST file to backend (via multipart form with size/type checks).  
  - On successful upload, server broadcasts file info (name, URL) to room via Socket.io.  
  - Other clients receive event and show file in a “Shared Files” list.  
- **Non-Functional Requirements:** 
  - Validate file types/extensions on server (allowlist: e.g. .pdf, .png, .jpg) and check MIME signature.  
  - Limit maximum file size (e.g. 50 MB) to prevent abuse.  
  - Sanitize filenames or generate UUID names to avoid path injection.  
  - Store files outside webroot or in a protected bucket.  
- **Edge Cases:** 
  - File too large or type not allowed (respond 400 with error).  
  - Concurrent uploads: queue or concurrent handling.  
- **Acceptance Criteria:** 
  - Uploaded file appears in all participants’ file lists with name and download link.  
  - When a user clicks a shared file, the browser downloads it.  

### Real-time Chat  
- **Description:** In-room text chat between participants. Uses Socket.io for instant messaging.  
- **User Stories:** 
  - As a participant, I want to send text messages to everyone in the room.  
  - As a user, I want to see messages from others appear in real time.  
- **Functional Requirements:** 
  - Chat UI panel with message list and input box.  
  - On send, emit `chat_message` event via Socket.io with message payload.  
  - Server receives and broadcasts it to room: e.g. `io.to(room).emit("chat_message", data)`.  
  - Clients append incoming messages to chat history view.  
- **Non-Functional Requirements:** 
  - Message timestamps (client or server generated).  
  - Escape/validate input to prevent XSS (e.g. sanitize HTML).  
  - Persist chat history in database if implementing optional history (see Feature List).  
- **Edge Cases:** 
  - Very long messages: limit length (e.g. 500 chars).  
  - Special characters or emojis: ensure encoding safe.  
- **Acceptance Criteria:** 
  - When a user sends a message, all other clients see it instantly in their chat window.  

### Room Management  
- **Description:** Users can create meeting “rooms” which others join via link or code. The creator is the room owner.  
- **User Stories:** 
  - As a user, I want to create a new meeting room with a unique code or link.  
  - As a user, I want to join an existing room by entering its code.  
  - As a host, I want to end the meeting (which closes the room).  
- **Functional Requirements:** 
  - **Create Room:** `POST /api/rooms` with optional name/code; server generates unique room ID. Only authenticated users can create.  
  - **Join Room:** `GET /api/rooms/:id` to verify existence, then connect via Socket.io.  
  - Use Socket.io `socket.join(roomId)` on connection.  
  - Owner ID stored in room object (permission to delete).  
  - `DELETE /api/rooms/:id` only allowed for owner (to end meeting).  
- **Non-Functional Requirements:** 
  - Unique, hard-to-guess room IDs (e.g. random strings).  
  - Protect private rooms: only invite link or code grants access.  
  - Limit attendees to prevent massive loads (e.g. max 10).  
- **Edge Cases:** 
  - Invalid room code: show error page (404).  
  - Owner disconnects: decide whether to auto-end room or hand off control. (Simplest: end meeting for all).  
  - Duplicate room names (should allow different IDs).  
- **Acceptance Criteria:** 
  - Creating a room returns a unique URL. Users with that URL or code can join.  
  - Only room participants (sockets in that room) receive media/chat.  
  - Attempting to join a non-existent room shows a “Room not found” error.  

### User Profiles  
- **Description:** Each user has a profile with name, email, password (hashed), and optional avatar.  
- **User Stories:** 
  - As a user, I want to view and edit my profile information (name, password) in the app.  
  - As a user, I want to upload a profile picture.  
- **Functional Requirements:** 
  - `GET /api/users/:id` returns user data (name, email).  
  - `PUT /api/users/:id` updates allowed fields (validate input). Must check JWT and ensure user edits only own profile.  
  - Use bcrypt for password updates.  
- **Non-Functional Requirements:** 
  - Email addresses must be unique.  
  - Validate inputs (e.g. no HTML in name).  
  - Store avatar in cloud storage or in DB as URL.  
- **Edge Cases:** 
  - Invalid input formats (e.g. bad email).  
  - Attempt to change email to one already in use (409 error).  
- **Acceptance Criteria:** 
  - Users can successfully update their name or password, and changes persist.  
  - Email is not editable to keep login consistent (or if allowed, triggers re-auth).

### Dashboard  
- **Description:** Post-login home page summarizing the user’s activity. Shows upcoming/saved meetings and quick actions.  
- **User Stories:** 
  - As a user, I want to see a list of my active or upcoming rooms.  
  - As a user, I want buttons to create a new room or join one.  
- **Functional Requirements:** 
  - `GET /api/rooms` returns rooms created by this user or available to join.  
  - Show each room’s name, ID, and maybe current participant count (via Socket.io events).  
  - **Create Room** button links to Create Room page; **Join Room** links to join dialog.  
- **Non-Functional Requirements:** 
  - Quick load (<300ms) for dashboard data.  
  - Real-time update if someone else invites or room activity (optional).  
- **Edge Cases:** 
  - No existing rooms: show “no rooms, create one!” prompt.  
- **Acceptance Criteria:** 
  - Dashboard displays a table/list of rooms with correct data.  
  - Create/Join navigation works and pre-fills room info if needed.  

### Create Room Page  
- **Purpose:** Form for creating a new meeting.  
- **Components:**  
  - Input for **Room Name** (optional).  
  - [Optional] **Password/Access Code** input for private rooms.  
  - **Create** button.  
- **UI Sections:**  
  - Simple form card with labels and inputs.  
- **API Calls:**  
  - On submit, call `POST /api/rooms { name, isPrivate, password? }`.  
- **States:**  
  - Idle (empty fields), Submitting (spinner), Success (redirect to meeting room), Error (display message).  
- **Navigation Flow:**  
  - After successful creation, redirect to the new Meeting Room page (`/rooms/:id`).  
  - Cancel or back returns to Dashboard.  

### Join Room Page  
- **Purpose:** Allow a user to enter a room code or select from a list (if public).  
- **Components:**  
  - Input for **Room ID/Code**.  
  - [If private] Input for **Password**.  
  - **Join** button.  
- **UI Sections:**  
  - Simple input form.  
- **API Calls:**  
  - On submit, call `GET /api/rooms/:id` to check existence (and password match).  
  - If valid, connect to Socket.io and redirect to Meeting Room page.  
- **States:**  
  - Idle, Validating (checking server), Error (room not found or wrong password).  
- **Navigation Flow:**  
  - Successful join → Meeting Room page.  
  - On failure, show error and stay.  

### Meeting Room Page  
- **Purpose:** Main collaboration interface with video call, chat, whiteboard, etc.  
- **Components/UI:**  
  - **Header:** Room name, Leave button (end call).  
  - **Video Grid:** Responsive grid showing each participant’s video stream (e.g., 2x2 or tile view).  
  - **Sidebar:** Tabs or sections for chat, participants list, and shared files (e.g., like Zoom’s panel or Slack’s threads).  
  - **Controls Bar:** At bottom or top, buttons for mute, camera toggle, screen share, start whiteboard, upload file.  
  - **Whiteboard:** Overlay canvas or separate tab that covers screen when active.  
- **API/Socket:**  
  - On entering page, emit `socket.emit('join_room', roomId, userData)`.  
  - Set up handlers for `user_joined`, `user_left`, `chat_message`, `drawing_data`, `file_shared`, `signal`, `ice_candidate`.  
  - Poll or fetch initial data (e.g. existing file list via API).  
- **States:**  
  - Connecting (joining sockets, getting media), Connected (all streams on), Reconnecting (on network drops), Error (if unable to connect).  
  - In Meeting: Active, then Ended on leave.  
- **Navigation Flow:**  
  - Leaving the room (click Leave) disconnects socket, then redirect to Dashboard.  
  - If host ends meeting, all users get a message and are sent to Dashboard.  

### Shared Files Page  
- **Purpose:** (Optional) A central area listing all files shared in past meetings or all rooms.  
- **Components:**  
  - List/table of files with metadata (name, uploader, upload date).  
  - Search or filter (optional).  
- **API Calls:**  
  - `GET /api/files?userId=...` to fetch user’s file history, or `GET /api/rooms/:id/files`.  
  - Download link goes to backend route (`GET /api/files/:fileId` or direct S3 link).  
- **States:**  
  - Loading files, Showing list, Empty (no files uploaded).  
- **Navigation:**  
  - From Dashboard or navbar as “Shared Files.”  
  - Clicking file triggers download.

### Settings Page  
- **Purpose:** User account settings and app preferences.  
- **Components:**  
  - Profile info (name, avatar) with edit capability.  
  - Theme toggle (light/dark, if implemented).  
  - Notification preferences (if any).  
  - **Save** button.  
- **API Calls:**  
  - `GET /api/users/:id` for current info.  
  - `PUT /api/users/:id` to save changes.  
- **States:**  
  - Loading current settings, Editable form, Saved confirmation.  
- **Navigation:**  
  - Accessible from Dashboard navbar or profile dropdown.

### Error Pages  
- **404 Not Found:** Shown when user navigates to non-existent route or room. Contains a friendly message and link to Dashboard.  
- **500 Internal Error:** Generic error screen for unexpected failures.  
- **UI:** Clean, minimal (e.g., “Oops! Page not found.”).  
- **Navigation:** “Go Home” button to redirect to Dashboard or Landing.

## 4. Complete Feature List  

- **Core Features:**  
  - **Authentication:** Email/password login with JWT (protected routes).  
  - **Multi-user Video Calling:** WebRTC-based group video/audio chat.  
  - **Screen Sharing:** Share entire screen or application window.  
  - **Whiteboard:** Collaborative drawing canvas synced via WebSockets.  
  - **File Sharing:** Upload/download files in-meeting.  
  - **Real-time Chat:** Text messaging within rooms (Socket.io).  
  - **Room Management:** Create/join/leave meeting rooms with unique codes.  
  - **User Profiles:** Account details and settings pages.  
  - **Dashboard:** Post-login overview of rooms and quick actions.  

- **Optional Features:**  
  - **Meeting History:** View past meeting logs (participants, chat transcripts).  
  - **Meeting Scheduling:** Calendar integration to set future meetings.  
  - **Activity Tracking:** Usage analytics (time spent, number of meetings).  

## 5. User Roles  

- **User:** Registered participant; can create/join rooms, share audio/video, chat, draw, and upload files. Has access to their own profile and dashboard.  
- **Room Host:** Creator of a meeting; inherits user privileges plus ability to end the room for all, clear whiteboard, or remove participants (future enhancement).  
- **Admin (optional):** Full system access (manage users, view analytics). Not required for MVP but can be considered later.  

Permissions: Only authenticated Users can access core functionality. Room actions (like end meeting) are limited to the Host of that room.  

## 6. Complete Page Breakdown  

### Landing Page  
- **Purpose:** Public homepage marketing the app, with “Login” and “Register” calls-to-action.  
- **Components:** Header with logo and nav links, Hero section (headline and screenshot), Feature highlights (icons or text), Footer with contact/info.  
- **UI Sections:** Hero banner, features grid, signup/login buttons, footer.  
- **API Calls:** None (public page).  
- **States:** Static; no dynamic states.  
- **Navigation Flow:** Links to Login and Register pages.  

### Login Page  
- **Purpose:** Authenticate existing users.  
- **Components:** Form (Email, Password fields), “Forgot Password” link, Login button, link to Register.  
- **UI Sections:** Centered login form card.  
- **API Calls:** `POST /api/auth/login` on submit.  
- **States:** Idle, Submitting (loading indicator), Error (invalid credentials).  
- **Navigation:** Successful login → Dashboard; link to Register page.  

### Register Page  
- **Purpose:** Create a new user account.  
- **Components:** Form (Name, Email, Password, Confirm Password), Register button, link to Login.  
- **UI Sections:** Centered signup form.  
- **API Calls:** `POST /api/auth/register` on submit.  
- **States:** Idle, Submitting, Error (e.g., email exists).  
- **Navigation:** Success → Dashboard (auto-login or prompt to login).  

### Dashboard  
- **Purpose:** User home showing rooms and actions.  
- **Components:** Navbar (logo, profile icon), Sidebar or cards for action shortcuts (Create/Join Room), Room list table (columns: Room ID, Name, Status, Participants).  
- **API Calls:** `GET /api/rooms` to fetch user’s rooms. Possibly real-time updates if rooms created by others (optional).  
- **States:** Loading rooms list, Empty list message, Display list.  
- **Navigation:** Buttons to open Create/Join Room pages; clicking a room goes to that room.  

### Profile  
- **Purpose:** Display and edit user information.  
- **Components:** Form fields (Name, Email read-only, Change Password fields), Save button, avatar upload.  
- **API Calls:** `GET /api/users/:id` to load data, `PUT /api/users/:id` on save.  
- **States:** Idle (show data), Editing (enable fields), Saving, Success message, Error (validation).  
- **Navigation:** Save stays on page; link back to Dashboard.  

### Create Room  
- **Purpose:** Form to set up a new meeting.  
- **Components:** Room name input, optional password toggle/input, Create button.  
- **UI Sections:** Simple form panel.  
- **API Calls:** `POST /api/rooms`.  
- **States:** Idle, Submitting, Error (e.g. name missing).  
- **Navigation:** On success, navigate to the new Meeting Room. Back to Dashboard on cancel.  

### Join Room  
- **Purpose:** Let user enter a room code to join.  
- **Components:** Input for Room ID/code, optional password input, Join button.  
- **UI Sections:** Form card.  
- **API Calls:** `GET /api/rooms/:id` to verify existence and password check.  
- **States:** Idle, Verifying, Error (invalid code/password).  
- **Navigation:** Success → Meeting Room page.  

### Meeting Room  
- **Purpose:** The main collaboration screen (video, chat, whiteboard).  
- **Components:** 
  - **Header:** Room title, Leave button.  
  - **Video Container:** Grid or floating windows of participant video elements.  
  - **Control Bar:** Mute, camera, screen share, whiteboard, file upload buttons.  
  - **Side Panel:** Tabs for Chat messages, Participant list, Shared files.  
  - **Whiteboard Overlay:** Full-screen canvas (shown when active).  
- **API/Socket Calls:** On mount, emit `socket.emit('join_room', roomId)`. Listen for events: `user_joined`, `user_left`, `chat_message`, `drawing_event`, `file_shared`, `signal`, `ice_candidate`.  
- **States:** 
  - **Connecting:** showing “Connecting to room…”  
  - **Active Call:** streams rendering, chat active.  
  - **Reconnecting:** if network drops (Socket.io will auto-retry).  
  - **Ended:** on host leaving.  
- **Navigation:** Leave button disconnects and returns to Dashboard.  

### Shared Files  
- **Purpose:** Show files uploaded across user’s rooms or current room (depending on scope).  
- **Components:** List view of files with name, uploader, date.  
- **API Calls:** `GET /api/rooms/:id/files`.  
- **States:** Loading list, Empty (no files), List displayed.  
- **Navigation:** Click file to download. Link back to Dashboard or Meeting.  

### Settings  
- **Purpose:** App-wide preferences and account settings (beyond profile).  
- **Components:** Toggles (e.g. Dark Mode), other settings as needed.  
- **API Calls:** May use same user API for preferences.  
- **States:** Loaded, Saved.  
- **Navigation:** Save confirms change, remains; back to Dashboard.  

### Error Pages  
- **Purpose:** Inform user of failures.  
- **Components:** 
  - **404:** “Page/Room not found.” with Home link.  
  - **500:** “Something went wrong.” with Refresh or Home link.  
- **API Calls:** None.  
- **States:** Static messages.  
- **Navigation:** Home button to Dashboard or Landing.

## 7. Database Design  

- **Collections:**  

  - **Users:** `{ _id, name: String, email: String, passwordHash: String, role: String, createdAt: Date }`.  
  - **Rooms:** `{ _id, name: String, ownerId: ObjectId (ref Users), participants: [ObjectId], isPrivate: Boolean, passwordHash: String?, createdAt: Date }`.  
  - **Messages (optional):** `{ _id, roomId: ObjectId, senderId: ObjectId, content: String, timestamp: Date }`.  
  - **Files:** `{ _id, roomId: ObjectId, uploaderId: ObjectId, fileName: String, fileURL: String, uploadedAt: Date }`.  
  - **Meetings/History (optional):** `{ _id, roomId, startTime, endTime, participantIds: [ObjectId] }`.  

- **Fields & Types:** Example (Mongoose schemas):  
  - *User*: `name`, `email` (unique), `passwordHash`, `role` (e.g. “user” or “admin”), `createdAt`.  
  - *Room*: `name`, `ownerId`, `participants` (array of User IDs), `isPrivate`, hashed `password` (if private), timestamps.  
  - *Message*: `roomId`, `senderId`, `text`, `timestamp`.  
  - *File*: `roomId`, `uploaderId`, `name`, `url`, `timestamp`.  

- **Relationships:**  
  - One-to-many from User→Rooms (user can own many rooms).  
  - Many-to-many (through Room): Users ↔ Rooms (participants list).  
  - One-to-many Room→Messages (each message links to one room and one sender).  
  - One-to-many Room→Files, User→Files.  

- **ER Diagram (described):** Users ↔ (joins/owns) ↔ Rooms. Each Room has many Messages and Files. We use MongoDB’s flexible schema (Mongoose) with `ref` fields to link collections. For example, `Room.ownerId` references a User, and `Message.roomId` references a Room.  

- **MongoDB Schema Design:** Example snippet (pseudo-Mongoose):  
  ```js
  const User = new Schema({ name: String, email: String, passwordHash: String, role: String });
  const Room = new Schema({ name: String, ownerId: {type: ObjectId, ref: 'User'}, participants: [ObjectId], isPrivate: Boolean, passwordHash: String });
  const Message = new Schema({ roomId: ObjectId, senderId: ObjectId, content: String, createdAt: Date });
  const File = new Schema({ roomId: ObjectId, uploaderId: ObjectId, fileName: String, fileURL: String, uploadedAt: Date });
  ```  
  These schemas enforce data shape and relationships. Indexes on `email` (unique) and `roomId` for fast queries.

## 8. Backend Architecture  

- **Folder Structure:** Organize an Express.js/Node app (per best practices):  
  ```
  /server
    ├── config/         # database and environment config
    ├── controllers/    # functions for each route
    ├── models/         # Mongoose schemas
    ├── routes/         # Express route definitions
    ├── middlewares/    # auth (JWT verification), error handling, upload handling
    ├── services/       # (optional) business logic or external APIs
    ├── sockets/        # socket event handling logic
    ├── app.js          # Express app setup
    └── server.js       # start HTTP & Socket.IO servers
  ```
  This aligns with common Node structure.

- **Service Architecture:**  
  - **Express HTTP server** handles REST endpoints (auth, user, rooms, file uploads).  
  - **Socket.IO server** (mounted on same HTTP server) handles real-time events (chat, signaling, whiteboard).  
  - Controllers delegate to models and utilities. Use a central config for MongoDB URI and JWT secret.  

- **Controllers:**  
  - `AuthController` for login/register (uses bcrypt, issues JWT).  
  - `UserController` for profile view/edit.  
  - `RoomController` for create/join/delete rooms.  
  - `FileController` for handling uploads (using multer) and listing downloads.  
  - (Optional) `MessageController` if persisting chat history.  

- **Middleware:**  
  - **Authentication:** Verify JWT on protected routes. Tokens can be in `Authorization: Bearer`. Based on OWASP, use strong secrets and short expiry.  
  - **Error Handler:** Centralized error middleware for consistent JSON error responses.  
  - **File Upload:** `multer` to validate file size/type.  
  - **Rate Limiting:** e.g. `express-rate-limit` on auth endpoints to prevent brute force.  

- **Socket.IO Structure:**  
  - On server startup, initialize Socket.IO on the HTTP server.  
  - In `sockets/index.js`, define `io.on("connection", socket => { ... })`.  
  - Handle events:  
    - `join_room`: add `socket.join(roomId)`.  
    - `signal`/`ice-candidate`: relay WebRTC offers/answers via `socket.to(roomId).emit(...)`.  
    - `chat_message`: broadcast `io.to(roomId).emit('chat_message', msg)`.  
    - `drawing_data`: broadcast canvas updates.  
    - `file_shared`: broadcast new file info.  
  - On `disconnect`, Socket.IO cleans up rooms automatically.  

- **Authentication Flow:**  
  1. **Register:** Endpoint hashes password with bcrypt (saltRounds ~10) and saves user.  
  2. **Login:** Compares bcrypt hash, then signs JWT (HS256 with strong secret).  
  3. **Protected Routes:** Middleware extracts JWT from header/cookie and verifies. If valid, attach `req.userId`.  
  4. **Logout:** Simply client-side delete of token (no server action needed for stateless JWT).  

## 9. Frontend Architecture  

- **Folder Structure:** Organize React code by feature:  
  ```
  /client/src
    ├── components/   # Reusable UI components (Button, Modal, Avatar, etc.)  
    ├── features/     # Feature-specific folders (e.g. auth/, dashboard/, meeting/)  
    ├── hooks/        # Custom hooks (useAuth, useWebRTC, etc.)  
    ├── services/     # API calls (Axios wrappers)  
    ├── utils/        # Helper functions (date formatting, validators)  
    ├── store/        # State management (Context or Redux slices)  
    ├── App.jsx       # Root component with Router  
    └── index.jsx     # Render to DOM  
  ```  
  This follows the “feature-based” organization recommended for scalable React apps.

- **Component Hierarchy:**  
  - **App:** Sets up React Router and global context (AuthContext, SocketContext).  
  - **Layout:** Wraps page components with common UI (Navbar, Footer).  
  - **Pages:** Components for Landing, Login, Dashboard, MeetingRoom, etc.  
  - **Common Components:** Form inputs, cards, buttons, video tile component, chat message bubble, whiteboard canvas, etc.  
  - **Feature Components:** E.g. `VideoGrid`, `WhiteboardCanvas`, `ChatPanel`.  

- **State Management Strategy:**  
  - Use React Context or a lightweight store for global state (e.g. user auth, current room). For example, an `AuthContext` holds JWT and user info; a `SocketContext` manages the Socket.IO connection.  
  - Local component state (useState/useReducer) for forms and UI toggles.  
  - Axios interceptors to attach JWT to API requests.  

- **Routing Architecture:**  
  - React Router v6 with routes: `/` (Landing), `/login`, `/register`, `/dashboard`, `/profile`, `/rooms/create`, `/rooms/join`, `/rooms/:id` (Meeting).  
  - PrivateRoute wrapper for protected routes (redirect to login if no JWT).  
  - URL parameters: `:id` for room.  

- **API Layer Design:**  
  - Use Axios or Fetch for REST calls. Example service functions: `AuthService.login()`, `RoomService.create()`, etc.  
  - Centralize base URL (from environment) and JSON headers.  
  - On login success, store JWT in memory or localStorage (with care) and update context.  
  - Handle API errors uniformly (e.g. toast notifications).  

## 10. WebRTC Architecture  

- **Peer Connection Flow:**  
  1. User loads Meeting Room: obtains local media (`getUserMedia`).  
  2. Establish Socket.io connection and emit `join_room`.  
  3. Server broadcasts new user to others in room.  
  4. Existing participants each create an `RTCPeerConnection` to the newcomer: send an SDP offer via Socket.io (`socket.emit('signal', {to:peerId, offer})`).  
  5. New user creates PeerConnections back to each: responds with SDP answers.  
  6. Exchange ICE candidates via Socket.io (`icecandidate` events) until connectivity is established.  
  7. Once connected, media streams flow peer-to-peer.  

- **Signaling Flow:**  
  - **`offer/answer`:** Use Socket.IO events as the signaling channel.  
  - **ICE candidates:** On `icecandidate`, send candidate to peer through Socket.io.  
  - Example:  
    ```
    // Sender side
    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        socket.emit('ice_candidate', { to: peerId, candidate: e.candidate });
      }
    };
    ```
  - On receiving `offer`, set as remote description and generate `answer`.  
  - On receiving `answer`, set as remote description to finalize.  

- **ICE/STUN/TURN:**  
  - Configure `RTCPeerConnection` with a public STUN server (e.g. Google STUN) for NAT traversal.  
  - If peers can’t connect directly (symmetric NAT), fall back to a TURN server (relay). We will include configuration for an open TURN (or skip if testing locally).  

- **Multi-user Handling:**  
  - For small groups, we can use a *full mesh* (each pair of users connects directly). Note: mesh does not scale past ~4 users.  
  - If aiming for higher scale or professional feel, an SFU (Selective Forwarding Unit) would be ideal. However, building an SFU (using e.g. Jitsi or Janus) is likely beyond a 2-week scope. We may start with mesh (as in many demos) and note SFU as a future improvement.  
  - MDN notes that multi-party often uses an SFU to efficiently route streams.  

- **Media Stream Management:**  
  - Attach local audio/video tracks to each peer connection.  
  - Handle `ontrack` events to add remote video elements.  
  - Provide controls to mute microphone or disable camera by enabling/disabling tracks.  

## 11. Socket.io Architecture  

- **Events:**  
  - **Connection (`connection`):** On new Socket.IO connection, authenticate the user (if needed) and join rooms.  
  - **`join_room`:** Payload `{roomId, userName}` – server adds socket to `roomId`.  
  - **`leave_room`:** When user exits, server removes socket from room. (Socket.IO does this automatically on disconnect.)  
  - **`chat_message`:** `{roomId, userName, message, timestamp}` – server broadcasts to `io.to(roomId).emit('chat_message', data)`.  
  - **`drawing_event`:** Contains stroke coordinates (x,y, draw state) – broadcast to others for whiteboard sync.  
  - **`file_shared`:** `{roomId, fileName, fileURL}` – broadcast so clients add to file list.  
  - **WebRTC signaling:** `offer`, `answer`, `ice_candidate` events carrying SDP or ICE payloads to coordinate peer connections.  
  - **Presence:** `user_joined` / `user_left` events to update participant lists.  

- **Rooms:**  
  - Each meeting room is a Socket.IO “room” (namespace). Sockets join a room with `socket.join(roomId)`.  
  - We broadcast to a room using `io.to(roomId).emit(...)`, which sends to all clients in that room.  

- **Broadcasting:**  
  - Chat and signaling use `io.to(roomId).emit(...)` to send events to everyone in the room.  
  - If we want to exclude the sender for some events (e.g. whiteboard drawn by current user), use `socket.to(roomId).emit(...)`.  
  - Global announcements (e.g. user connected) use `socket.broadcast.emit` or similar as needed.  

- **Presence Tracking:**  
  - On connection to a room, emit `user_joined` with user info; on `disconnect`, Socket.IO auto-leaves rooms, so server can emit `user_left`.  
  - Maintain an in-memory map of socket IDs to user IDs. On `disconnect`, broadcast to the room that this user left.  

- **Chat System:**  
  - When server receives `chat_message`, it attaches server timestamp (if not provided) and broadcasts to the room. Clients append in chronological order.  
  - Optionally store chat in DB under Messages collection.  

- **Whiteboard Sync:**  
  - Every draw/move event sent by one client is broadcast to others. Data includes stroke start, move, end signals, and coordinates.  
  - Ensure flood control or rate-limiting on drawing events to avoid overload.  

## 12. Security Architecture  

- **JWT & Authentication:**  
  - Sign tokens with a strong secret (at least 64 chars).  
  - Set short expiration on access tokens (e.g. 15 minutes) and use refresh tokens.  
  - Send JWT in `Authorization: Bearer` header or secure HttpOnly cookie to protect from XSS. Implement CSRF protection if cookies are used.  
  - Verify JWT on every protected route in middleware; reject invalid/expired tokens.  

- **Password Hashing:**  
  - Use `bcrypt` with sufficient rounds (e.g. saltRounds ≈10). Higher work factor if performance permits. Never store plaintext.  

- **Rate Limiting:**  
  - Apply rate limits on auth endpoints (e.g. max 5 login attempts/minute per IP) to prevent brute-force attacks.  

- **Input Validation:**  
  - Sanitize and validate all user inputs (especially for registration, room codes, messages). Use libraries like Joi or express-validator. Reject inputs that contain scripts or SQL/NoSQL injection patterns.  
  - For chat and whiteboard data, limit size and sanitize if interpreted (escape HTML).  

- **File Upload Security:**  
  - Only accept allowed MIME types/extensions. Verify file “magic bytes” to prevent disguised executables.  
  - Generate random filenames and store uploads in a non-served directory or a cloud storage (AWS S3 with restricted permissions). If serving directly, use a safe delivery endpoint.  
  - Enforce size limits and scan for malware (if time permits).  

- **Room Access Security:**  
  - Unauthenticated users cannot join rooms or call socket events.  
  - For private rooms (if implemented), require the correct password (hash on server).  
  - Ensure that only sockets in a room can exchange media/chat for that room ID.  

- **HTTPS:**  
  - Serve backend over HTTPS in production (Vercel/Render handle SSL). Use secure WebSocket (`wss://`) by default.  

- **Environment Variables:**  
  - All secrets (JWT_SECRET, DB URI, TURN server credentials) are stored in environment variables (never commit `.env` to Git).  
  - Provide a `.env.example` file documenting required keys for developer onboarding.  

- **Miscellaneous:**  
  - Use Helmet (or similar) to set secure HTTP headers.  
  - Sanitize cookies and enforce SameSite.  
  - If scaling, use a WebSocket adapter with Redis for session persistence (not needed in MVP).  

## 13. REST API Design  

- **POST /api/auth/register**  
  - **Request:** `{ name, email, password }` (JSON)  
  - **Response:** `201 Created` `{ id, name, email, token }` or `409 Conflict` if email exists.  
  - **Auth:** No.  
  - **Errors:** 400 for invalid input.  

- **POST /api/auth/login**  
  - **Request:** `{ email, password }`  
  - **Response:** `200 OK` `{ id, name, email, token }` or `401 Unauthorized` for wrong creds.  
  - **Auth:** No.  
  - **Errors:** 400 for missing fields.  

- **GET /api/users/:id**  
  - **Request:** URL param user ID  
  - **Response:** `200 OK` `{ id, name, email }`  
  - **Auth:** Yes (JWT); a user can only fetch their own profile.  
  - **Errors:** 404 if not found, 403 if accessing other’s data.  

- **PUT /api/users/:id**  
  - **Request:** `{ name?, password? }`  
  - **Response:** `200 OK` updated user object (or just success message).  
  - **Auth:** Yes (JWT). Users can only update their own profile.  
  - **Errors:** 400 for invalid data.  

- **GET /api/rooms**  
  - **Request:** None  
  - **Response:** `200 OK` list of rooms `{ rooms: [ {id, name, isPrivate} ] }` for this user.  
  - **Auth:** Yes.  
  - **Errors:** none (empty list if none).  

- **POST /api/rooms**  
  - **Request:** `{ name, isPrivate, password? }`  
  - **Response:** `201 Created` `{ id, name, ownerId }`.  
  - **Auth:** Yes.  
  - **Errors:** 400 for invalid params.  

- **GET /api/rooms/:roomId**  
  - **Request:** Room ID in URL, password in query/body if needed.  
  - **Response:** `200 OK` room details (name, id, etc) if authorized.  
  - **Auth:** Yes. If private, password must match.  
  - **Errors:** 404 if room not found, 403 if private and wrong password.  

- **DELETE /api/rooms/:roomId**  
  - **Request:** Room ID.  
  - **Response:** `200 OK` on success.  
  - **Auth:** Yes; only room owner.  
  - **Errors:** 403 if not owner, 404 if no such room.  

- **GET /api/rooms/:roomId/messages** (optional)  
  - **Response:** `200 OK` list of message objects.  
  - **Auth:** Yes; only if user is in room.  
  - **Errors:** 403 if not in room.  

- **POST /api/rooms/:roomId/files**  
  - **Request:** multipart form with file upload.  
  - **Response:** `201 Created` `{ fileId, fileName, fileURL }`.  
  - **Auth:** Yes; only members of room.  
  - **Errors:** 400 if no file or disallowed type.  

- **GET /api/rooms/:roomId/files**  
  - **Request:** Room ID.  
  - **Response:** `200 OK` list of `{ fileId, fileName, uploader, uploadedAt }`.  
  - **Auth:** Yes; must be in room.  
  - **Errors:** 403/404 as needed.  

- **GET /api/files/:fileId**  
  - **Response:** 200 with file download (stream) or redirect.  
  - **Auth:** Yes; verify user has access to that file’s room.  
  - **Errors:** 404 if not found.  

Each endpoint uses standard HTTP status codes and JSON bodies. Errors should include a message field. Authentication required for all except register/login.

## 14. UI/UX Design System  

- **Color Palette:**  
  - Primary: Indigo (#4A3FFF) and Violet (#9F7AFF) for buttons and highlights (modern, professional).  
  - Secondary: Slate Gray (#2F3C4F) for text and headers.  
  - Neutrals: Light gray backgrounds (#F5F5F5, #E0E0E0) and white (#FFFFFF).  
  - Accent: Soft Blue (#6CCFF6) for interactive elements (hover states).  
  (Palette inspired by modern SaaS like Slack/Linear: bold primary with cool grays.)  

- **Typography:**  
  - Base font: system-ui or a clean sans-serif (e.g. **Inter** or **Roboto**).  
  - Headings (H1, H2): bold, larger sizes (e.g. H1 = 2rem, H2 = 1.5rem).  
  - Body text: 1rem, line-height ~1.5 for readability.  
  - Consistent use of font weights (400 regular, 600 semibold for emphasis).  

- **Component System:**  
  - Reusable UI components (buttons, inputs, cards) styled with Tailwind CSS utility classes.  
  - Use a 4px/8px spacing scale for margins/padding (Tailwind’s default spacing).  
  - Design grammar: ample white space, minimalistic icons (e.g., use Heroicons).  
  - Buttons: Solid primary color for main actions, outlined for secondary.  
  - Forms: Clear labels and placeholder text, validation messages in red (#E53E3E).  

- **Spacing & Layout:**  
  - Responsive layout with breakpoints (mobile-first).  
  - Meeting Room: video grid is responsive (e.g., 2x2 on desktop, stacked on mobile).  
  - Sidebar/panels should collapse on small screens (e.g. chat slides over video).  

- **Design Inspiration:**  
  - **Zoom/Slack:** User interface should feel slick like Zoom’s clean meeting UI or Slack’s channel layout (side nav + main panel).  
  - **Notion/Linear:** Minimalist aesthetic with plenty of whitespace and consistent styling.  
  - **Branding vibe:** Trustworthy and modern – no decorative gradients, just clean colors.

## 15. Development Roadmap  

**Week 1 (Backend & Auth Foundations):**  
- **Day 1:** Finalize stack and architecture. Set up repository (monorepo) with `client/` and `server/` directories. Initialize projects (Vite React and Express).  
- **Day 2:** Implement user auth backend: design User model, JWT logic, bcrypt hashing. Write `POST /register` and `/login` in Express.  
- **Day 3:** Develop frontend auth pages (Login, Register). Connect to backend API using Axios.  
- **Day 4:** Add user profile and dashboard UI (dummy data). Implement protected routes and AuthContext.  
- **Day 5:** Set up Socket.IO on backend (`server.js`). Begin basic room API (`POST /rooms`) and frontend Create/Join forms.  
- **Day 6:** Implement `socket.join` logic for rooms. On the frontend, handle joining: connect socket and join room.  
- **Day 7:** Test user flows (signup, login, create/join room). Fix backend CORS, deployment config in dev.  

**Week 2 (Real-Time Features Integration):**  
- **Day 8:** Integrate WebRTC: get local media and create peer connections. Establish signaling over Socket.IO (`offer`/`answer` exchange). Use STUN servers (Google’s).  
- **Day 9:** Finalize video calling: handle multiple peers (at least 2). Layout video grid and test 2-user call.  
- **Day 10:** Implement text chat: UI and Socket.IO `chat_message` events. Broadcast messages in room.  
- **Day 11:** Add screen sharing toggle: test `getDisplayMedia` integration. Users should be able to share and stop.  
- **Day 12:** Build whiteboard feature: canvas drawing + socket sync. Ensure drawing is smooth for two participants.  
- **Day 13:** File upload: set up multer on server, implement `POST /rooms/:id/files`. Frontend upload button and list update via socket.  
- **Day 14:** Implement room leaving: on backend, clean up; on frontend, Leave button ends session and navigates back.  

**Week 3 (Polish, Extras, Deployment):**  
- **Day 15:** Add Authentication guards and error handling. Style UI with Tailwind; ensure responsiveness.  
- **Day 16:** Optional features if time (e.g. Meeting History view). Work on any tricky bugs (e.g. cross-browser WebRTC).  
- **Day 17:** Prepare deployment: finalize environment variables, scripts.  
- **Day 18:** **Frontend Deployment:** Deploy React app to Vercel. Configure domain, env (API URL).  
- **Day 19:** **Backend Deployment:** Deploy Node app to Render (as web service, with WebSocket support). Set Render env vars (Mongo URI, JWT secret).  
- **Day 20:** **Testing & Documentation:** End-to-end testing (simulated users), create README, record demo video. Buffer day for final tweaks.  

## 16. GitHub Repository Structure  

- **Monorepo Setup:** Root folder with two subfolders: `/client` (React/Vite) and `/server` (Node/Express). Shared config (e.g. ESLint) in root if needed.  
- **Branches:** Use a *GitFlow*-like model: `main` (production-ready), `develop` (integration), and feature branches (`feature/auth`, `feature/video`, etc).  
- **Commits:** Follow Conventional Commits (e.g. `feat:`, `fix:`) for clarity. Write descriptive messages.  
- **Pull Requests:** Code reviews on PRs from feature branches into `develop`. Merge to `main` only when stable.  
- **Documentation:** 
  - **README.md:** Project overview, setup instructions, and usage examples.  
  - Inline code comments for complex logic.  
  - Update a CHANGELOG if time permits.  
- **Code Quality:** Use ESLint/Prettier configs to maintain consistency.  

## 17. Deployment Architecture  

- **Frontend (Vercel):**  
  - Push the `/client` code to GitHub, connect repository in Vercel.  
  - Build command: `npm run build` (Vite) and serve `dist`.  
  - Set Vercel Environment Variables: `REACT_APP_API_URL` pointing to backend. (Vercel provides easy env var UI.)  
  - Vercel handles HTTPS and provides a public URL (or custom domain).  

- **Backend (Render):**  
  - Push `/server` code to GitHub. Create a Web Service in Render (Free tier) with `npm start`.  
  - Environment Variables on Render: `MONGO_URI` (MongoDB Atlas connection string), `JWT_SECRET`, (optional) TURN credentials.  
  - Render automatically gives TLS (HTTPS/WSS) and keeps WebSockets alive (no timeout). Ensure `app.listen(process.env.PORT)` uses Render’s port.  

- **Database (MongoDB Atlas):**  
  - Create a free-tier Atlas cluster.  
  - Add a database user and get the connection string. Ensure network access allows your backend (0.0.0.0/0 or specific IP).  
  - Use this URI in `MONGO_URI` env var on Render. Atlas encrypts data at rest by default (AES-256). Use TLS for in-transit encryption (Atlas enables TLS by default).  

- **Environment Variables:**  
  - Store all secrets (DB credentials, JWT secret, any API keys) in Render/Vercel env settings. Do not commit `.env` to Git.  
  - Provide a `.env.example` in repo (without values) to show needed keys.  

- **CI/CD:**  
  - Vercel will auto-deploy frontend on every push to `main` (and preview on PRs).  
  - Render can auto-deploy backend on pushes to `main` as well.  
  - Optionally, configure GitHub Actions to run lint/tests before merges.  

## 18. Interview Preparation  

- **Project Explanation:** Frame it as solving remote team collaboration. Example outline: *“SyncSpace is a Slack/Zoom-style platform built with React, Node.js, WebRTC, and Socket.IO. It meets all the given requirements: user auth with JWT, multi-user video, screen sharing, real-time chat and whiteboard, file sharing, etc. We used MongoDB Atlas for storage and Vercel/Render for deployment, following modern SaaS architecture. In interviews, highlight challenging aspects like setting up WebRTC peer connections and securing the app with industry practices.”*  

- **Common Interview Questions:**  
  - *“Why WebRTC?”* – Explain P2P media without server bandwidth, open-standard, works in browsers.  
  - *“How do you handle multi-user calls?”* – Discuss mesh vs SFU tradeoffs. Mesh is simple (each peer connects to others) but doesn’t scale; SFU scales better (Jitsi, etc.).  
  - *“Security measures?”* – Mention JWT with short expiry, HTTPS, bcrypt hashing, input validation, file upload checks.  
  - *“Why this tech stack?”* – React/Vite for fast, modern frontend; Tailwind for rapid styling; Node/Express for simple backend; Socket.io for real-time events; Mongo for flexible schema.  
  - *“Trade-offs & challenges?”* – E.g., not implementing an SFU due to time, handling network/firewall issues with TURN, and ensuring synchronous state (whiteboard) among users.  
  - *“How would you improve?”* – Mention using a TURN server, adding encryption keys management, scaling (Redis adapter), writing automated tests, or containerizing with Docker.  

- **Technical Decisions:**  
  - Chose **WebRTC** for real-time media because it’s open-source and supported in browsers, rather than proprietary services.  
  - Chose **Socket.IO** over raw WebSocket for ease (auto-reconnect, rooms).  
  - No Redux (excessive for intern project); used Context for auth/room state.  
  - **Monorepo** simplifies dev workflow (single repo for client & server).  
  - Use **JWT** for stateless auth (scalable, no sessions).  
  - **MongoDB Atlas** for managed DB (handles ops overhead).  
  - **Deployment**: Vercel/Render for fast CI/CD and free SSL.  

- **Trade-offs:**  
  - Did mesh calls for simplicity; an SFU would better support large conferences but adds complexity.  
  - Used email/password auth (good for prototyping); could add OAuth social login later.  
  - Stored files locally/Atlas; could integrate S3 for scalability.  

## 19. Portfolio Presentation Strategy  

- **GitHub README Structure:**  
  - **Title & Description:** App name (SyncSpace) with tagline, short overview.  
  - **Features Section:** Bullet-list all core features with icons.  
  - **Tech Stack:** Logos/badges (React, WebRTC, Node, Tailwind, MongoDB, Socket.io).  
  - **Screenshots:** Embed key UI images (landing, dashboard, meeting room) with captions.  
  - **Demo/Installation:** Steps to run locally (clone, `npm install`, `npm run dev`).  
  - **Architecture:** Brief mention of structure or link to documentation (optional).  
  - **Live Demo:** Link to deployed app.  
  - **License & Contributing:** Short note (if any).  

- **Project Screenshots:**  
  - **Landing Page** (polished homepage).  
  - **Dashboard Page** (after login, showing room list).  
  - **Meeting Room** (grid of videos, with chat/whiteboard visible).  
  - **Whiteboard in Action** (drawing on canvas).  
  - **Mobile View** (responsive UI example).  

- **Demo Video Flow:**  
  1. **Intro Slide** – Title and quick tech list.  
  2. **Login/Register** – Show signing in.  
  3. **Dashboard** – Navigate creating a room.  
  4. **Create/Join Meeting** – Show generating a room and another user joining via code.  
  5. **Video Call** – Demonstrate webcams, muting, and screen share.  
  6. **Features** – Chat a message, draw on whiteboard, upload a file.  
  7. **Conclusion** – Summary of how the feature set meets requirements.  

- **LinkedIn Post Strategy:**  
  - **Headline:** “Announcing SyncSpace: A Real-Time Team Collaboration App 📺👥”  
  - **Content:** One-two paragraphs explaining the problem solved and tech stack (highlight WebRTC, Node.js, etc.).  
  - **Media:** Include an eye-catching screenshot (e.g., meeting room UI).  
  - **Call to Action:** Link to GitHub repo or live demo.  
  - **Hashtags:** #ReactJS #WebRTC #NodeJS #SocketIO #Tailwind #Portfolio #InternshipProject  
  - **Engagement:** Tag any mentors or peers, invite feedback/comments.  

## 20. Final Deliverables  

- **Product Requirements Document (this document):** Comprehensive PRD with all above details to guide development.  
- **GitHub Repository:** Monorepo containing all source code, structured with documented README.  
- **Deployed Application:** Live demo links (Vercel frontend, Render backend) for recruiters to test.  
- **Demo Video:** A short screen-recorded walkthrough showing app features in action.  
- **Presentation Assets:** Screenshots and documentation to include in portfolio.  

Each deliverable should reflect a polished, startup-quality codebase and documentation, ready to impress reviewers and recruiters.  

**Sources:** Official WebRTC docs, Socket.IO docs, OWASP and security best practices, and industry blog insights were consulted for this design.