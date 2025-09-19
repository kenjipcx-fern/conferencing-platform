CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"avatar" text,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"webrtc_peer_id" varchar(255),
	"socket_id" varchar(255),
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "question_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"attendee_id" uuid,
	"vote_type" varchar(10) NOT NULL,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"attendee_id" uuid,
	"content" text NOT NULL,
	"author_name" varchar(255),
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"answer" text,
	"answered_at" timestamp,
	"answered_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" json,
	"attendee_count" integer DEFAULT 0 NOT NULL,
	"active_connections" integer DEFAULT 0 NOT NULL,
	"questions_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"max_attendees" integer DEFAULT 100 NOT NULL,
	"allow_questions" boolean DEFAULT true NOT NULL,
	"allow_anonymous_questions" boolean DEFAULT true NOT NULL,
	"moderate_questions" boolean DEFAULT false NOT NULL,
	"require_registration" boolean DEFAULT false NOT NULL,
	"enable_recording" boolean DEFAULT false NOT NULL,
	"branding" json,
	"settings" json DEFAULT '{"webrtcEnabled":true,"screenShareEnabled":true,"chatEnabled":true,"waitingRoomEnabled":false}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar" text,
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"subscription_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_votes" ADD CONSTRAINT "question_votes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_votes" ADD CONSTRAINT "question_votes_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_answered_by_users_id_fk" FOREIGN KEY ("answered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_analytics" ADD CONSTRAINT "session_analytics_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendees_session_idx" ON "attendees" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attendees_status_idx" ON "attendees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendees_webrtc_idx" ON "attendees" USING btree ("webrtc_peer_id");--> statement-breakpoint
CREATE INDEX "attendees_socket_idx" ON "attendees" USING btree ("socket_id");--> statement-breakpoint
CREATE INDEX "question_votes_question_idx" ON "question_votes" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_votes_attendee_idx" ON "question_votes" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "question_votes_unique_idx" ON "question_votes" USING btree ("question_id","attendee_id","ip_address");--> statement-breakpoint
CREATE INDEX "questions_session_idx" ON "questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_priority_idx" ON "questions" USING btree ("priority","upvotes");--> statement-breakpoint
CREATE INDEX "questions_attendee_idx" ON "questions" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "session_analytics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_timestamp_idx" ON "session_analytics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "session_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_slug_idx" ON "sessions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sessions_scheduled_idx" ON "sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_provider_idx" ON "users" USING btree ("provider","provider_id");