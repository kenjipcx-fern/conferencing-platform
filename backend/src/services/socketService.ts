import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from '../db/connection';
import { sessions, attendees, questions, sessionAnalytics } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class SocketService {
  private io: SocketIOServer;
  private sessionRooms: Map<string, Set<string>> = new Map(); // sessionId -> socketIds
  private userSessions: Map<string, string> = new Map(); // socketId -> sessionId
  private userAttendees: Map<string, string> = new Map(); // socketId -> attendeeId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : [
              'http://localhost:3000', 
              'http://localhost:3001',
              'https://frontend-morphvm-iedjmk0z.http.cloud.morph.so',
              'https://backend-morphvm-iedjmk0z.http.cloud.morph.so'
            ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('🔌 Socket.IO server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👋 Client connected: ${socket.id}`);

      // Session events
      socket.on('session:join', async (data) => {
        await this.handleSessionJoin(socket, data);
      });

      socket.on('session:leave', async (data) => {
        await this.handleSessionLeave(socket, data);
      });

      // Question events
      socket.on('question:submit', async (data) => {
        await this.handleQuestionSubmit(socket, data);
      });

      socket.on('question:vote', async (data) => {
        await this.handleQuestionVote(socket, data);
      });

      // WebRTC signaling events
      socket.on('webrtc:offer', (data) => {
        this.handleWebRTCOffer(socket, data);
      });

      socket.on('webrtc:answer', (data) => {
        this.handleWebRTCAnswer(socket, data);
      });

      socket.on('webrtc:ice-candidate', (data) => {
        this.handleWebRTCIceCandidate(socket, data);
      });

      // Analytics events
      socket.on('analytics:track', async (data) => {
        await this.handleAnalyticsTrack(socket, data);
      });

      // Disconnection
      socket.on('disconnect', async () => {
        await this.handleDisconnection(socket);
      });
    });
  }

  private async handleSessionJoin(socket: any, data: { sessionId: string; attendeeInfo: any }) {
    try {
      const { sessionId, attendeeInfo } = data;
      console.log(`🎯 ${socket.id} joining session: ${sessionId}`);

      // Verify session exists
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Join socket room
      await socket.join(`session:${sessionId}`);
      
      // Track session membership
      if (!this.sessionRooms.has(sessionId)) {
        this.sessionRooms.set(sessionId, new Set());
      }
      this.sessionRooms.get(sessionId)!.add(socket.id);
      this.userSessions.set(socket.id, sessionId);

      if (attendeeInfo.id) {
        this.userAttendees.set(socket.id, attendeeInfo.id);
        
        // Update attendee with socket ID
        await db
          .update(attendees)
          .set({ 
            socketId: socket.id,
            status: 'joined',
            updatedAt: new Date(),
          })
          .where(eq(attendees.id, attendeeInfo.id));
      }

      // Notify other participants
      socket.to(`session:${sessionId}`).emit('session:attendee-joined', {
        attendee: attendeeInfo,
      });

      // Send current session state
      const currentAttendees = await this.getSessionAttendees(sessionId);
      const currentQuestions = await this.getSessionQuestions(sessionId);

      socket.emit('session:state', {
        session: session[0],
        attendees: currentAttendees,
        questions: currentQuestions,
      });

      // Track analytics
      await this.trackEvent(sessionId, 'attendee_joined', {
        attendeeId: attendeeInfo.id,
      });

      console.log(`✅ ${socket.id} successfully joined session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to join session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  }

  private async handleSessionLeave(socket: any, data: { sessionId: string; attendeeId?: string }) {
    try {
      const { sessionId, attendeeId } = data;
      console.log(`👋 ${socket.id} leaving session: ${sessionId}`);

      // Leave socket room
      await socket.leave(`session:${sessionId}`);

      // Update tracking
      this.sessionRooms.get(sessionId)?.delete(socket.id);
      this.userSessions.delete(socket.id);
      this.userAttendees.delete(socket.id);

      if (attendeeId) {
        // Update attendee status
        await db
          .update(attendees)
          .set({ 
            status: 'left',
            leftAt: new Date(),
            socketId: null,
            updatedAt: new Date(),
          })
          .where(eq(attendees.id, attendeeId));
      }

      // Notify other participants
      socket.to(`session:${sessionId}`).emit('session:attendee-left', {
        attendeeId,
      });

      // Track analytics
      await this.trackEvent(sessionId, 'attendee_left', {
        attendeeId,
      });

      console.log(`✅ ${socket.id} left session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }

  private async handleQuestionSubmit(socket: any, data: { question: any }) {
    try {
      const { question } = data;
      const sessionId = this.userSessions.get(socket.id);

      if (!sessionId) {
        socket.emit('error', { message: 'Not in a session' });
        return;
      }

      console.log(`❓ Question submitted in session: ${sessionId}`);

      // Create question in database
      const newQuestion = await db
        .insert(questions)
        .values({
          sessionId,
          ...question,
        })
        .returning();

      // Broadcast to session participants
      this.io.to(`session:${sessionId}`).emit('question:new', {
        question: newQuestion[0],
      });

      // Track analytics
      await this.trackEvent(sessionId, 'question_submitted', {
        questionId: newQuestion[0].id,
        attendeeId: question.attendeeId,
      });

      console.log(`✅ Question broadcasted: ${newQuestion[0].id}`);
    } catch (error) {
      console.error('Failed to submit question:', error);
      socket.emit('error', { message: 'Failed to submit question' });
    }
  }

  private async handleQuestionVote(socket: any, data: { questionId: string; voteType: 'up' | 'down' }) {
    try {
      const { questionId, voteType } = data;
      const sessionId = this.userSessions.get(socket.id);
      const attendeeId = this.userAttendees.get(socket.id);

      if (!sessionId) {
        socket.emit('error', { message: 'Not in a session' });
        return;
      }

      console.log(`🗳️ Vote ${voteType} on question: ${questionId}`);

      // Update vote counts (simplified - in real app, check for duplicate votes)
      const currentQuestion = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      if (currentQuestion.length === 0) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      const updateData = voteType === 'up' 
        ? { upvotes: currentQuestion[0].upvotes + 1 }
        : { downvotes: currentQuestion[0].downvotes + 1 };

      const updatedQuestion = await db
        .update(questions)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, questionId))
        .returning();

      if (updatedQuestion.length > 0) {
        // Broadcast updated vote counts
        this.io.to(`session:${sessionId}`).emit('question:voted', {
          questionId,
          upvotes: updatedQuestion[0].upvotes,
          downvotes: updatedQuestion[0].downvotes,
        });

        // Track analytics
        await this.trackEvent(sessionId, 'question_voted', {
          questionId,
          attendeeId,
          voteType,
        });
      }
    } catch (error) {
      console.error('Failed to vote on question:', error);
      socket.emit('error', { message: 'Failed to vote on question' });
    }
  }

  private handleWebRTCOffer(socket: any, data: { peerId: string; offer: any }) {
    const { peerId, offer } = data;
    console.log(`📹 WebRTC offer from ${socket.id} to ${peerId}`);
    
    socket.to(peerId).emit('webrtc:offer', {
      peerId: socket.id,
      offer,
    });
  }

  private handleWebRTCAnswer(socket: any, data: { peerId: string; answer: any }) {
    const { peerId, answer } = data;
    console.log(`📹 WebRTC answer from ${socket.id} to ${peerId}`);
    
    socket.to(peerId).emit('webrtc:answer', {
      peerId: socket.id,
      answer,
    });
  }

  private handleWebRTCIceCandidate(socket: any, data: { peerId: string; candidate: any }) {
    const { peerId, candidate } = data;
    console.log(`🧊 ICE candidate from ${socket.id} to ${peerId}`);
    
    socket.to(peerId).emit('webrtc:ice-candidate', {
      peerId: socket.id,
      candidate,
    });
  }

  private async handleAnalyticsTrack(socket: any, data: any) {
    try {
      const sessionId = this.userSessions.get(socket.id);
      if (!sessionId) return;

      await this.trackEvent(sessionId, data.eventType, data.eventData);
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }

  private async handleDisconnection(socket: any) {
    try {
      const sessionId = this.userSessions.get(socket.id);
      const attendeeId = this.userAttendees.get(socket.id);

      if (sessionId) {
        console.log(`🔌 ${socket.id} disconnected from session: ${sessionId}`);

        // Clean up tracking
        this.sessionRooms.get(sessionId)?.delete(socket.id);
        this.userSessions.delete(socket.id);
        this.userAttendees.delete(socket.id);

        if (attendeeId) {
          // Update attendee status
          await db
            .update(attendees)
            .set({ 
              status: 'left',
              leftAt: new Date(),
              socketId: null,
              updatedAt: new Date(),
            })
            .where(eq(attendees.id, attendeeId));

          // Notify other participants
          socket.to(`session:${sessionId}`).emit('session:attendee-left', {
            attendeeId,
          });

          // Track analytics
          await this.trackEvent(sessionId, 'attendee_disconnected', {
            attendeeId,
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle disconnection:', error);
    }
  }

  private async getSessionAttendees(sessionId: string) {
    try {
      return await db
        .select()
        .from(attendees)
        .where(eq(attendees.sessionId, sessionId));
    } catch (error) {
      console.error('Failed to get session attendees:', error);
      return [];
    }
  }

  private async getSessionQuestions(sessionId: string) {
    try {
      return await db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, sessionId));
    } catch (error) {
      console.error('Failed to get session questions:', error);
      return [];
    }
  }

  private async trackEvent(sessionId: string, eventType: string, eventData: any = {}) {
    try {
      const sessionRoomSize = this.sessionRooms.get(sessionId)?.size || 0;

      await db.insert(sessionAnalytics).values({
        sessionId,
        eventType,
        eventData,
        attendeeCount: sessionRoomSize,
        activeConnections: sessionRoomSize,
        questionsCount: 0, // Will be updated in a separate query if needed
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Public methods for external use
  public broadcastToSession(sessionId: string, event: string, data: any) {
    this.io.to(`session:${sessionId}`).emit(event, data);
  }

  public getSessionParticipants(sessionId: string): number {
    return this.sessionRooms.get(sessionId)?.size || 0;
  }

  public getIo(): SocketIOServer {
    return this.io;
  }
}
