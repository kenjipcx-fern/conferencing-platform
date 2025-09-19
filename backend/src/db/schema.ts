import { pgTable, uuid, varchar, text, timestamp, boolean, integer, json, index, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table - Presenters who create sessions
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  provider: varchar('provider', { length: 50 }).notNull(), // 'google', 'github'
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free').notNull(), // 'free', 'pro', 'enterprise'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  providerIdx: index('users_provider_idx').on(table.provider, table.providerId),
}));

// Sessions table - Conference rooms/presentations
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  status: varchar('status', { length: 20 }).default('scheduled').notNull(), // 'scheduled', 'live', 'ended'
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  maxAttendees: integer('max_attendees').default(100).notNull(),
  allowQuestions: boolean('allow_questions').default(true).notNull(),
  allowAnonymousQuestions: boolean('allow_anonymous_questions').default(true).notNull(),
  moderateQuestions: boolean('moderate_questions').default(false).notNull(),
  requireRegistration: boolean('require_registration').default(false).notNull(),
  enableRecording: boolean('enable_recording').default(false).notNull(),
  branding: json('branding').$type<{
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
    customCss?: string;
  }>(),
  settings: json('settings').$type<{
    webrtcEnabled?: boolean;
    screenShareEnabled?: boolean;
    chatEnabled?: boolean;
    waitingRoomEnabled?: boolean;
  }>().default({
    webrtcEnabled: true,
    screenShareEnabled: true,
    chatEnabled: true,
    waitingRoomEnabled: false,
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  statusIdx: index('sessions_status_idx').on(table.status),
  slugIdx: index('sessions_slug_idx').on(table.slug),
  scheduledIdx: index('sessions_scheduled_idx').on(table.scheduledAt),
}));

// Attendees table - Dynamic participants in sessions
export const attendees = pgTable('attendees', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  avatar: text('avatar'),
  isAnonymous: boolean('is_anonymous').default(true).notNull(),
  webrtcPeerId: varchar('webrtc_peer_id', { length: 255 }),
  socketId: varchar('socket_id', { length: 255 }),
  status: varchar('status', { length: 20 }).default('waiting').notNull(), // 'waiting', 'joined', 'left'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  sessionIdx: index('attendees_session_idx').on(table.sessionId),
  statusIdx: index('attendees_status_idx').on(table.status),
  webrtcIdx: index('attendees_webrtc_idx').on(table.webrtcPeerId),
  socketIdx: index('attendees_socket_idx').on(table.socketId),
}));

// Questions table - Q&A system with voting
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  attendeeId: uuid('attendee_id').references(() => attendees.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  authorName: varchar('author_name', { length: 255 }),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'approved', 'answered', 'rejected'
  priority: integer('priority').default(0).notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  downvotes: integer('downvotes').default(0).notNull(),
  answer: text('answer'),
  answeredAt: timestamp('answered_at'),
  answeredBy: uuid('answered_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index('questions_session_idx').on(table.sessionId),
  statusIdx: index('questions_status_idx').on(table.status),
  priorityIdx: index('questions_priority_idx').on(table.priority, table.upvotes),
  attendeeIdx: index('questions_attendee_idx').on(table.attendeeId),
}));

// Question votes table - Track individual votes for questions
export const questionVotes = pgTable('question_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  attendeeId: uuid('attendee_id').references(() => attendees.id, { onDelete: 'cascade' }),
  voteType: varchar('vote_type', { length: 10 }).notNull(), // 'up', 'down'
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  questionIdx: index('question_votes_question_idx').on(table.questionId),
  attendeeIdx: index('question_votes_attendee_idx').on(table.attendeeId),
  uniqueVote: index('question_votes_unique_idx').on(table.questionId, table.attendeeId, table.ipAddress),
}));

// Session analytics table - Real-time engagement metrics
export const sessionAnalytics = pgTable('session_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'attendee_joined', 'attendee_left', 'question_asked', 'webrtc_connected'
  eventData: json('event_data').$type<{
    attendeeId?: string;
    questionId?: string;
    connectionType?: string;
    duration?: number;
    quality?: string;
  }>(),
  attendeeCount: integer('attendee_count').default(0).notNull(),
  activeConnections: integer('active_connections').default(0).notNull(),
  questionsCount: integer('questions_count').default(0).notNull(),
}, (table) => ({
  sessionIdx: index('analytics_session_idx').on(table.sessionId),
  timestampIdx: index('analytics_timestamp_idx').on(table.timestamp),
  eventTypeIdx: index('analytics_event_type_idx').on(table.eventType),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(1).max(255),
  subscriptionTier: z.enum(['free', 'pro', 'enterprise']),
});

export const selectUserSchema = createSelectSchema(users);

export const insertSessionSchema = createInsertSchema(sessions, {
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  status: z.enum(['scheduled', 'live', 'ended']),
  maxAttendees: z.number().min(1).max(1000),
});

export const selectSessionSchema = createSelectSchema(sessions);

export const insertAttendeeSchema = createInsertSchema(attendees, {
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  status: z.enum(['waiting', 'joined', 'left']),
});

export const selectAttendeeSchema = createSelectSchema(attendees);

export const insertQuestionSchema = createInsertSchema(questions, {
  content: z.string().min(1).max(1000),
  status: z.enum(['pending', 'approved', 'answered', 'rejected']),
  priority: z.number().min(0).max(100),
});

export const selectQuestionSchema = createSelectSchema(questions);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionVote = typeof questionVotes.$inferSelect;
export type NewQuestionVote = typeof questionVotes.$inferInsert;
export type SessionAnalytics = typeof sessionAnalytics.$inferSelect;
export type NewSessionAnalytics = typeof sessionAnalytics.$inferInsert;
