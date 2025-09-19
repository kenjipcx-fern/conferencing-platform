import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { questions, questionVotes, sessions, attendees } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

const router = Router();

// Validation schemas
const submitQuestionSchema = z.object({
  content: z.string().min(1).max(1000),
  isAnonymous: z.boolean().default(false),
  attendeeId: z.string().uuid().optional(),
});

const voteQuestionSchema = z.object({
  voteType: z.enum(['up', 'down']),
  attendeeId: z.string().uuid().optional(),
});

const updateQuestionSchema = z.object({
  status: z.enum(['pending', 'approved', 'answered', 'rejected']).optional(),
  priority: z.number().min(0).max(100).optional(),
  answer: z.string().max(2000).optional(),
});

// GET /api/sessions/:sessionId/questions - Get questions for a session
router.get('/:sessionId/questions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const status = req.query.status as string;

    // Verify session exists
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

    // Build query conditions
    let whereConditions = eq(questions.sessionId, sessionId);
    if (status) {
      whereConditions = and(whereConditions, eq(questions.status, status as any));
    }

    const sessionQuestions = await db
      .select({
        id: questions.id,
        sessionId: questions.sessionId,
        attendeeId: questions.attendeeId,
        content: questions.content,
        authorName: questions.authorName,
        isAnonymous: questions.isAnonymous,
        status: questions.status,
        priority: questions.priority,
        upvotes: questions.upvotes,
        downvotes: questions.downvotes,
        answer: questions.answer,
        answeredAt: questions.answeredAt,
        answeredBy: questions.answeredBy,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
      .from(questions)
      .where(whereConditions)
      .orderBy(desc(questions.priority), desc(questions.upvotes), desc(questions.createdAt));

    res.json({
      success: true,
      data: sessionQuestions,
    });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions',
    });
  }
});

// POST /api/sessions/:sessionId/questions - Submit a question
router.post('/:sessionId/questions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const validatedData = submitQuestionSchema.parse(req.body);

    // Verify session exists and allows questions
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

    if (!session[0].allowQuestions) {
      return res.status(403).json({
        success: false,
        error: 'Questions are not allowed for this session',
      });
    }

    if (validatedData.isAnonymous && !session[0].allowAnonymousQuestions) {
      return res.status(403).json({
        success: false,
        error: 'Anonymous questions are not allowed for this session',
      });
    }

    // Get attendee info if provided
    let authorName = undefined;
    if (validatedData.attendeeId && !validatedData.isAnonymous) {
      const attendee = await db
        .select()
        .from(attendees)
        .where(eq(attendees.id, validatedData.attendeeId))
        .limit(1);

      if (attendee.length > 0) {
        authorName = attendee[0].name;
      }
    }

    const questionData = {
      sessionId,
      attendeeId: validatedData.attendeeId,
      content: validatedData.content,
      authorName,
      isAnonymous: validatedData.isAnonymous,
      status: session[0].moderateQuestions ? 'pending' as const : 'approved' as const,
      priority: 0,
      upvotes: 0,
      downvotes: 0,
    };

    const newQuestion = await db
      .insert(questions)
      .values(questionData)
      .returning();

    res.status(201).json({
      success: true,
      data: newQuestion[0],
    });
  } catch (error) {
    console.error('Failed to submit question:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit question',
    });
  }
});

// POST /api/sessions/:sessionId/questions/:questionId/vote - Vote on a question
router.post('/:sessionId/questions/:questionId/vote', async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const validatedData = voteQuestionSchema.parse(req.body);

    // Verify question exists and belongs to session
    const question = await db
      .select()
      .from(questions)
      .where(and(
        eq(questions.id, questionId),
        eq(questions.sessionId, sessionId)
      ))
      .limit(1);

    if (question.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    // Check for existing vote to prevent duplicates
    const existingVoteConditions = [eq(questionVotes.questionId, questionId)];
    
    if (validatedData.attendeeId) {
      existingVoteConditions.push(eq(questionVotes.attendeeId, validatedData.attendeeId));
    } else {
      // For anonymous votes, use IP address
      existingVoteConditions.push(eq(questionVotes.ipAddress, req.ip || ''));
    }

    const existingVote = await db
      .select()
      .from(questionVotes)
      .where(and(...existingVoteConditions))
      .limit(1);

    if (existingVote.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted on this question',
      });
    }

    // Create vote record
    const voteData = {
      questionId,
      attendeeId: validatedData.attendeeId,
      voteType: validatedData.voteType,
      ipAddress: req.ip,
    };

    await db.insert(questionVotes).values(voteData);

    // Update question vote counts
    const voteCountUpdate = validatedData.voteType === 'up' 
      ? { upvotes: sql`${questions.upvotes} + 1` }
      : { downvotes: sql`${questions.downvotes} + 1` };

    const updatedQuestion = await db
      .update(questions)
      .set({
        ...voteCountUpdate,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId))
      .returning();

    res.json({
      success: true,
      data: updatedQuestion[0],
    });
  } catch (error) {
    console.error('Failed to vote on question:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to vote on question',
    });
  }
});

// PATCH /api/sessions/:sessionId/questions/:questionId - Update question (moderator)
router.patch('/:sessionId/questions/:questionId', async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const validatedData = updateQuestionSchema.parse(req.body);

    // Verify question exists and belongs to session
    const question = await db
      .select()
      .from(questions)
      .where(and(
        eq(questions.id, questionId),
        eq(questions.sessionId, sessionId)
      ))
      .limit(1);

    if (question.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // If answering the question
    if (validatedData.answer) {
      updateData.answeredAt = new Date();
      updateData.answeredBy = 'mock-user-id'; // Would come from auth
      updateData.status = 'answered';
    }

    const updatedQuestion = await db
      .update(questions)
      .set(updateData)
      .where(eq(questions.id, questionId))
      .returning();

    res.json({
      success: true,
      data: updatedQuestion[0],
    });
  } catch (error) {
    console.error('Failed to update question:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update question',
    });
  }
});

// POST /api/sessions/:sessionId/questions/:questionId/answer - Answer a question
router.post('/:sessionId/questions/:questionId/answer', async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string' || answer.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Answer must be a string with max 2000 characters',
      });
    }

    // Verify question exists and belongs to session
    const question = await db
      .select()
      .from(questions)
      .where(and(
        eq(questions.id, questionId),
        eq(questions.sessionId, sessionId)
      ))
      .limit(1);

    if (question.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    const updatedQuestion = await db
      .update(questions)
      .set({
        answer: answer.trim(),
        answeredAt: new Date(),
        answeredBy: 'mock-user-id', // Would come from auth
        status: 'answered',
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId))
      .returning();

    res.json({
      success: true,
      data: updatedQuestion[0],
    });
  } catch (error) {
    console.error('Failed to answer question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to answer question',
    });
  }
});

// DELETE /api/sessions/:sessionId/questions/:questionId - Delete question
router.delete('/:sessionId/questions/:questionId', async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;

    // Verify question exists and belongs to session
    const question = await db
      .select()
      .from(questions)
      .where(and(
        eq(questions.id, questionId),
        eq(questions.sessionId, sessionId)
      ))
      .limit(1);

    if (question.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    await db.delete(questions).where(eq(questions.id, questionId));

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question',
    });
  }
});

export default router;
