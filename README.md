# Professional Virtual Conferencing Platform 🎥

A modern, full-stack conferencing platform enabling presenters to host engaging virtual presentations with real-time video, interactive Q&A, and seamless audience participation. No downloads required!

## ✨ Features

### 🎯 Core Features
- **WebRTC Video Streaming** - High-quality presenter video with screen sharing
- **Real-time Q&A System** - Anonymous question submission with voting
- **Live Chat** - Instant messaging between all participants  
- **No Registration Required** - Attendees join instantly with just a name
- **Professional UI** - Modern, responsive design with smooth animations
- **Session Management** - Easy room creation and participant control

### 🚀 Technical Highlights
- **Real-time Communication** - Socket.io for instant updates
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Type-Safe** - Full TypeScript implementation across frontend and backend
- **Performance Optimized** - Efficient WebRTC peer connections
- **Scalable Architecture** - Supports 25+ concurrent attendees per room

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety across the application
- **Tailwind CSS** - Utility-first styling with custom design system
- **Socket.io Client** - Real-time communication
- **WebRTC API** - Native browser video/audio handling
- **Framer Motion** - Smooth animations and transitions

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **Socket.io** - Real-time bidirectional communication
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe database operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/kenjipcx-fern/conferencing-platform.git
cd conferencing-platform
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start PostgreSQL (using Docker)
docker run --name conferencing-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=conferencing \
  -p 5432:5432 -d postgres:15

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Configure environment
cp .env.local.example .env.local
# Edit with your API URLs

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🎯 Live Demo

### Production URLs
- **Frontend**: https://frontend-morphvm-iedjmk0z.http.cloud.morph.so
- **Backend API**: https://backend-morphvm-iedjmk0z.http.cloud.morph.so/api

### Demo Sessions Available
- **Live Integration Test** - Testing full functionality (Max 50 participants)
- **WebRTC Conferencing Demo** - Platform demonstration (Max 250 participants)  
- **Getting Started with Real-time** - Tutorial session (Max 100 participants)

## 📖 Usage

### For Presenters
1. Visit the homepage and click "Host a Presentation"
2. Enter presentation title and your name
3. Configure room settings (password, participant limit)
4. Share the generated room link with attendees
5. Start presenting with video, screen share, and Q&A management

### For Attendees
1. Click the room link shared by the presenter
2. Enter your name (no account required)
3. Join the presentation instantly
4. Engage through chat, questions, and reactions

## 🏗️ Architecture

### System Design
```
┌─────────────┐    WebRTC     ┌─────────────┐
│   Frontend  │ ←──────────→  │   Backend   │
│  (Next.js)  │   Socket.io   │ (Express.js)│
└─────────────┘               └─────────────┘
       │                             │
       │                             │
       ▼                             ▼
┌─────────────┐               ┌─────────────┐
│   Browser   │               │ PostgreSQL  │
│    WebRTC   │               │  Database   │
└─────────────┘               └─────────────┘
```

### Database Schema
- **sessions** - Room information and settings
- **participants** - Users in each session (presenter/attendee)
- **chat_messages** - Real-time chat history
- **questions** - Q&A system with voting
- **question_votes** - Vote tracking for questions

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database with fresh data
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/conferencing
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 📱 Browser Support

- **Chrome/Edge**: 90+ (Full WebRTC support)
- **Firefox**: 88+ (Good WebRTC support)
- **Safari**: 14+ (Basic WebRTC support)
- **Mobile Safari**: 14+ (Limited features)
- **Chrome Mobile**: 90+ (Full support)

## 🔐 Security & Privacy

- **No Persistent Storage** - User names are not stored after sessions
- **Optional Room Passwords** - BCrypt hashed protection
- **HTTPS Enforcement** - All traffic encrypted in production
- **WebRTC Encryption** - DTLS encryption for peer connections
- **Rate Limiting** - Protection against abuse

## 🚀 Deployment

### Production Deployment
1. Set up PostgreSQL database
2. Configure production environment variables
3. Build both frontend and backend
4. Deploy to your preferred hosting platform
5. Configure reverse proxy (Nginx recommended)
6. Set up SSL certificates

### Docker Deployment
```bash
# Coming soon - Docker Compose configuration
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for simple, accessible virtual presentations
- Designed for educators, business presenters, and content creators

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

**Made with ❤️ for seamless virtual presentations**
