import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { sessions, attendees, questions, users, insertSessionSchema, insertAttendeeSchema } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

const router = Router();

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  maxAttendees: z.number().min(1).max(1000).default(100),
  allowQuestions: z.boolean().default(true),
  allowAnonymousQuestions: z.boolean().default(true),
  moderateQuestions: z.boolean().default(false),
  requireRegistration: z.boolean().default(false),
  enableRecording: z.boolean().default(false),
  branding: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    logoUrl: z.string().url().optional(),
    customCss: z.string().optional(),
  }).optional(),
  settings: z.object({
    webrtcEnabled: z.boolean().default(true),
    screenShareEnabled: z.boolean().default(true),
    chatEnabled: z.boolean().default(true),
    waitingRoomEnabled: z.boolean().default(false),
  }).default({}),
});

const joinSessionSchema = z.object({
  name: z.string().max(255).optional(),
  email: z.string().email().optional(),
});

// Helper function to generate unique slug
async function generateSlug(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db
      .select()
      .from(sessions)
      .where(eq(sessions.slug, slug))
      .limit(1);
    
    if (existing.length === 0) {
      break;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// GET /api/sessions - List all sessions
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = (page - 1) * limit;

    const allSessions = await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get attendee counts for each session
    const sessionsWithCounts = await Promise.all(
      allSessions.map(async (session) => {
        const attendeeCount = await db
          .select({ count: sql`count(*)` })
          .from(attendees)
          .where(and(
            eq(attendees.sessionId, session.id),
            eq(attendees.status, 'joined')
          ));

        return {
          ...session,
          currentAttendees: Number(attendeeCount[0]?.count) || 0,
        };
      })
    );

    res.json({
      success: true,
      data: sessionsWithCounts,
      pagination: {
        page,
        limit,
        total: sessionsWithCounts.length, // In a real app, get actual total count
        hasNext: sessionsWithCounts.length === limit,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session[0],
    });
  } catch (error) {
    console.error('Failed to fetch session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session',
    });
  }
});

// GET /api/sessions/slug/:slug - Get session by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.slug, slug))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session[0],
    });
  } catch (error) {
    console.error('Failed to fetch session by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session',
    });
  }
});

// POST /api/sessions - Create new session
router.post('/', async (req, res) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    
    // Generate unique slug
    const slug = await generateSlug(validatedData.title);
    
    // For now, use a mock user ID. In a real app, get from auth
    // Use the first user from our seed data
    const mockUserId = '8eab9885-0296-4dd0-9049-84017689d6fc'; // This would come from authentication middleware

    const sessionData = {
      ...validatedData,
      slug,
      userId: mockUserId,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      status: 'scheduled' as const,
    };

    const newSession = await db
      .insert(sessions)
      .values(sessionData)
      .returning();

    res.status(201).json({
      success: true,
      data: newSession[0],
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create session',
    });
  }
});

// POST /api/sessions/:id/join - Join a session
router.post('/:id/join', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const validatedData = joinSessionSchema.parse(req.body);

    // Check if session exists and is active
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session[0].status === 'ended') {
      return res.status(400).json({
        success: false,
        error: 'Session has ended',
      });
    }

    // Check current attendee count
    const currentAttendees = await db
      .select({ count: sql`count(*)` })
      .from(attendees)
      .where(and(
        eq(attendees.sessionId, sessionId),
        eq(attendees.status, 'joined')
      ));

    const attendeeCount = Number(currentAttendees[0]?.count) || 0;
    
    if (attendeeCount >= session[0].maxAttendees) {
      return res.status(400).json({
        success: false,
        error: 'Session is full',
      });
    }

    // Create attendee
    const attendeeData = {
      sessionId,
      name: validatedData.name,
      email: validatedData.email,
      isAnonymous: !validatedData.name && !validatedData.email,
      status: 'joined' as const,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const newAttendee = await db
      .insert(attendees)
      .values(attendeeData)
      .returning();

    res.status(201).json({
      success: true,
      data: {
        attendee: newAttendee[0],
        session: session[0],
      },
    });
  } catch (error) {
    console.error('Failed to join session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to join session',
    });
  }
});

// GET /api/sessions/:id/attendees - Get session attendees
router.get('/:id/attendees', async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    const sessionAttendees = await db
      .select()
      .from(attendees)
      .where(eq(attendees.sessionId, sessionId))
      .orderBy(desc(attendees.joinedAt));

    res.json({
      success: true,
      data: sessionAttendees,
    });
  } catch (error) {
    console.error('Failed to fetch attendees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendees',
    });
  }
});

// POST /api/sessions/:id/start - Start a session
router.post('/:id/start', async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    const updatedSession = await db
      .update(sessions)
      .set({
        status: 'live',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    if (updatedSession.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: updatedSession[0],
    });
  } catch (error) {
    console.error('Failed to start session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
    });
  }
});

// POST /api/sessions/:id/end - End a session
router.post('/:id/end', async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    const updatedSession = await db
      .update(sessions)
      .set({
        status: 'ended',
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    if (updatedSession.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: updatedSession[0],
    });
  } catch (error) {
    console.error('Failed to end session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
    });
  }
});

export default router;
