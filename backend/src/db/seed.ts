import { db } from './connection';
import { users, sessions, attendees, questions } from './schema';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create demo users
    const demoUsers = await db.insert(users).values([
      {
        email: 'demo@example.com',
        name: 'Demo Presenter',
        provider: 'google',
        providerId: 'demo123',
        subscriptionTier: 'pro',
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
      {
        email: 'test@example.com',
        name: 'Test User',
        provider: 'github',
        providerId: 'test456',
        subscriptionTier: 'free',
        avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
      }
    ]).returning();

    console.log(`✅ Created ${demoUsers.length} demo users`);

    // Create demo sessions
    const demoSessions = await db.insert(sessions).values([
      {
        userId: demoUsers[0].id,
        title: 'WebRTC Conferencing Platform Demo',
        description: 'A comprehensive demo of our new conferencing platform featuring real-time video, Q&A, and analytics.',
        slug: 'webrtc-demo',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        maxAttendees: 250,
        allowQuestions: true,
        allowAnonymousQuestions: true,
        moderateQuestions: false,
        branding: {
          backgroundColor: '#1e40af',
          textColor: '#ffffff',
          logoUrl: 'https://example.com/logo.png',
        },
        settings: {
          webrtcEnabled: true,
          screenShareEnabled: true,
          chatEnabled: true,
          waitingRoomEnabled: false,
        },
      },
      {
        userId: demoUsers[1].id,
        title: 'Getting Started with Real-time Communication',
        description: 'Learn the basics of implementing WebRTC in modern web applications.',
        slug: 'realtime-basics',
        status: 'live',
        scheduledAt: new Date(),
        startedAt: new Date(),
        maxAttendees: 100,
        allowQuestions: true,
        allowAnonymousQuestions: false,
        moderateQuestions: true,
        branding: {
          backgroundColor: '#059669',
          textColor: '#ffffff',
        },
        settings: {
          webrtcEnabled: true,
          screenShareEnabled: true,
          chatEnabled: true,
          waitingRoomEnabled: true,
        },
      }
    ]).returning();

    console.log(`✅ Created ${demoSessions.length} demo sessions`);

    // Create demo attendees for the live session
    const liveSession = demoSessions.find(s => s.status === 'live');
    if (liveSession) {
      const demoAttendees = await db.insert(attendees).values([
        {
          sessionId: liveSession.id,
          name: 'Alice Developer',
          email: 'alice@example.com',
          isAnonymous: false,
          status: 'joined',
          webrtcPeerId: 'peer-alice-123',
          socketId: 'socket-alice-123',
        },
        {
          sessionId: liveSession.id,
          name: 'Anonymous User',
          isAnonymous: true,
          status: 'joined',
          webrtcPeerId: 'peer-anon-456',
          socketId: 'socket-anon-456',
        },
        {
          sessionId: liveSession.id,
          name: 'Bob Student',
          email: 'bob@university.edu',
          isAnonymous: false,
          status: 'waiting',
          socketId: 'socket-bob-789',
        }
      ]).returning();

      console.log(`✅ Created ${demoAttendees.length} demo attendees`);

      // Create demo questions
      const demoQuestions = await db.insert(questions).values([
        {
          sessionId: liveSession.id,
          attendeeId: demoAttendees[0].id,
          content: 'How does WebRTC handle NAT traversal in complex network environments?',
          authorName: 'Alice Developer',
          isAnonymous: false,
          status: 'approved',
          priority: 5,
          upvotes: 8,
          downvotes: 1,
        },
        {
          sessionId: liveSession.id,
          attendeeId: demoAttendees[1].id,
          content: 'What are the best practices for handling connection drops during live sessions?',
          isAnonymous: true,
          status: 'pending',
          priority: 3,
          upvotes: 4,
          downvotes: 0,
        },
        {
          sessionId: liveSession.id,
          attendeeId: demoAttendees[2].id,
          content: 'Can you show an example of implementing screen sharing with this platform?',
          authorName: 'Bob Student',
          isAnonymous: false,
          status: 'answered',
          priority: 7,
          upvotes: 12,
          downvotes: 0,
          answer: 'Absolutely! Screen sharing is implemented using the getDisplayMedia() API. Let me demonstrate...',
          answeredAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          answeredBy: demoUsers[1].id,
        }
      ]).returning();

      console.log(`✅ Created ${demoQuestions.length} demo questions`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📊 Summary:
- Users: ${demoUsers.length}
- Sessions: ${demoSessions.length}
- Attendees: ${liveSession ? 3 : 0}
- Questions: ${liveSession ? 3 : 0}

🔗 Demo session URL: http://localhost:3000/session/${demoSessions[0].slug}
🎥 Live session URL: http://localhost:3000/session/${demoSessions[1].slug}
    `);

    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
