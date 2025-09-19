# Technical Architecture & Specifications

## Technology Stack

### Frontend Architecture
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (lightweight, no Redux complexity)
- **Real-time Communication**: Socket.io client + native WebRTC API
- **Video Components**: Custom WebRTC implementation with MediaStream API
- **Animation**: Framer Motion for micro-interactions
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: fetch API with custom retry logic

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript for type safety
- **Real-time**: Socket.io server for signaling
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js (minimal for anonymous joins)
- **File Storage**: Local filesystem (future: AWS S3)
- **Process Management**: PM2 for production

### Infrastructure & Deployment
- **Development**: Local Docker containers
- **Production**: VPS deployment with Nginx reverse proxy
- **Database**: PostgreSQL instance on same VPS
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Basic health checks

## WebRTC Architecture

### Signaling Server (Socket.io)
```javascript
// Server-side signaling events
io.on('connection', (socket) => {
  // Room management
  socket.on('create-room', handleRoomCreation)
  socket.on('join-room', handleRoomJoin)
  
  // WebRTC signaling
  socket.on('offer', relayOffer)
  socket.on('answer', relayAnswer)
  socket.on('ice-candidate', relayICECandidate)
  
  // Presenter controls
  socket.on('screen-share-start', handleScreenShare)
  socket.on('mute-all-attendees', handleMuteAll)
})
```

### Peer Connection Strategy
**Approach**: Star topology with presenter as hub
- **Presenter** → Multiple attendee connections
- **Attendees** → Only connect to presenter (not each other)
- **Advantages**: Simpler signaling, presenter control
- **Limitations**: Scales to ~25 attendees per presenter

### WebRTC Connection Flow
```
1. Presenter creates room → Socket.io room created
2. Attendee joins → Exchange socket.io messages
3. Create RTCPeerConnection instances
4. Presenter creates offer → Send via socket.io
5. Attendee creates answer → Send via socket.io
6. Exchange ICE candidates → Direct P2P connection established
7. Media streams flowing → Presenter video/audio to attendees
```

## Database Schema

### Core Tables
```sql
-- Rooms (presentations/meetings)
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  presenter_name VARCHAR(100) NOT NULL,
  presenter_socket_id VARCHAR(100),
  password_hash VARCHAR(255), -- Optional room password
  max_participants INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  settings JSONB, -- Room configuration
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Participants (both presenters and attendees)
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  socket_id VARCHAR(100) UNIQUE,
  role VARCHAR(20) DEFAULT 'attendee', -- 'presenter' or 'attendee'
  is_muted BOOLEAN DEFAULT false,
  is_video_on BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP
);

-- Chat messages
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id INT REFERENCES participants(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'chat', -- 'chat', 'system', 'reaction'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Q&A system
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id INT REFERENCES participants(id),
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  votes INT DEFAULT 0,
  answer TEXT,
  answered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question votes (for upvoting)
CREATE TABLE question_votes (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  participant_id INT REFERENCES participants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, participant_id)
);

-- Session analytics (optional)
CREATE TABLE session_stats (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  max_concurrent_participants INT DEFAULT 0,
  total_participants INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  session_duration_minutes INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_rooms_slug ON rooms(slug);
CREATE INDEX idx_rooms_active ON rooms(is_active, created_at);
CREATE INDEX idx_participants_room ON participants(room_id, joined_at);
CREATE INDEX idx_participants_socket ON participants(socket_id);
CREATE INDEX idx_chat_room_time ON chat_messages(room_id, created_at);
CREATE INDEX idx_questions_room ON questions(room_id, votes DESC, created_at);
```

## API Design

### RESTful Endpoints

#### Room Management
```
POST /api/rooms
- Create new presentation room
- Body: { title, presenterName, password?, maxParticipants? }
- Response: { roomId, slug, joinUrl }

GET /api/rooms/:slug
- Get room details and current state
- Response: { room, participants, isActive }

POST /api/rooms/:slug/join
- Join room as attendee
- Body: { name, password? }
- Response: { participantId, roomDetails }

DELETE /api/rooms/:slug
- End room (presenter only)
- Response: { success, sessionStats }
```

#### Chat & Q&A
```
GET /api/rooms/:slug/messages
- Get recent chat messages
- Query: ?limit=50&before=timestamp
- Response: { messages[], hasMore }

POST /api/rooms/:slug/questions
- Submit question
- Body: { question, participantId }
- Response: { questionId }

PUT /api/rooms/:slug/questions/:id/vote
- Upvote question
- Body: { participantId }
- Response: { votes }

POST /api/rooms/:slug/questions/:id/answer
- Answer question (presenter only)
- Body: { answer, participantId }
- Response: { success }
```

#### Real-time Events (Socket.io)
```javascript
// Client to Server
socket.emit('join-room', { slug, participantId })
socket.emit('webrtc-offer', { target, offer })
socket.emit('webrtc-answer', { target, answer })
socket.emit('webrtc-ice-candidate', { target, candidate })
socket.emit('chat-message', { roomSlug, message })
socket.emit('screen-share-start', { roomSlug })

// Server to Client  
socket.on('participant-joined', { participant })
socket.on('participant-left', { participantId })
socket.on('webrtc-offer', { from, offer })
socket.on('webrtc-answer', { from, answer })
socket.on('webrtc-ice-candidate', { from, candidate })
socket.on('new-chat-message', { message })
socket.on('new-question', { question })
socket.on('question-answered', { questionId, answer })
socket.on('presenter-screen-sharing', { isSharing })
```

## Security & Privacy

### Data Protection
- **No persistent user accounts** - Names only, forgotten after session
- **Optional room passwords** - BCrypt hashed
- **Socket authentication** - Temporary tokens per session
- **HTTPS enforcement** - All traffic encrypted
- **No recording by default** - Privacy-first approach

### WebRTC Security
- **STUN/TURN servers** - Use public STUN, implement TURN for NAT traversal
- **ICE candidate filtering** - Prevent IP leaking where possible
- **Encrypted peer connections** - DTLS encryption enabled by default

### Rate Limiting
```javascript
// Express rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  endpoints: {
    '/api/rooms': 10,     // Room creation limited
    '/api/rooms/*/join': 50, // Join attempts limited
    '/api/rooms/*/messages': 200 // Chat less limited
  }
}
```

## Performance Requirements

### Target Metrics
- **Room Creation**: < 2 seconds end-to-end
- **Join Experience**: < 5 seconds from click to video
- **Video Latency**: < 300ms presenter to attendee
- **Chat Latency**: < 100ms message delivery
- **Concurrent Rooms**: 50+ rooms on single VPS
- **Participants per Room**: 25+ with good quality

### Optimization Strategies
- **WebRTC Codecs**: VP9 for video, Opus for audio
- **Connection Management**: Graceful degradation to audio-only
- **Database Connection Pooling**: 20 connections max
- **Static Asset CDN**: Cache JS/CSS for performance
- **Socket.io Clustering**: Ready for horizontal scaling

## Scalability Considerations

### Current Architecture (Phase 1)
- Single VPS deployment
- PostgreSQL on same server
- File storage on local disk
- Suitable for 50+ concurrent rooms

### Future Scaling (Phase 2+)
- **Load Balancer**: Multiple app server instances
- **Database**: Separate PostgreSQL server
- **Redis**: Socket.io adapter for multi-server
- **Media Server**: Consider Janus or Kurento for large rooms
- **CDN**: Static assets and recorded content

## Development Workflow

### Local Development Setup
```bash
# Backend setup
cd backend/
npm install
npm run db:migrate
npm run dev  # Runs on port 3001

# Frontend setup  
cd frontend/
npm install
npm run dev  # Runs on port 3000

# Database
docker run --name postgres-conf \
  -e POSTGRES_DB=conferencing \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 -d postgres:15
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/conferencing
JWT_SECRET=development-secret-key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret
```

### Build & Deployment
```bash
# Production build
npm run build

# Database migrations
npm run db:migrate:prod

# Start production server
npm run start
```

## Monitoring & Analytics

### Health Checks
- **API Health**: `/api/health` endpoint
- **Database**: Connection pool status
- **WebRTC**: Success rate tracking
- **Socket.io**: Connection counts

### Basic Analytics
- Rooms created per day
- Average session duration
- Peak concurrent users
- Popular features usage
- Error rates by endpoint

## Browser Compatibility

### Supported Browsers
- **Chrome/Edge**: 90+ (full WebRTC support)
- **Firefox**: 88+ (good WebRTC support)
- **Safari**: 14+ (basic WebRTC support)
- **Mobile Safari**: 14+ (limited features)
- **Chrome Mobile**: 90+ (full support)

### Feature Detection
```javascript
// WebRTC capability detection
const hasWebRTC = !!(
  window.RTCPeerConnection && 
  navigator.mediaDevices?.getUserMedia
)

// Graceful degradation for unsupported browsers
if (!hasWebRTC) {
  // Show join-only mode without video
  // Or redirect to unsupported browser page
}
```

This architecture provides a solid foundation for a professional conferencing platform that can handle real-time video, audio, and interactive features while maintaining good performance and user experience.
