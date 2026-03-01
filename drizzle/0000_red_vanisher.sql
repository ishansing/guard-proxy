CREATE TABLE "dlp_events" (
	"id" text PRIMARY KEY NOT NULL,
	"ts" text NOT NULL,
	"event" text NOT NULL,
	"path" text NOT NULL,
	"direction" text NOT NULL,
	"action" text NOT NULL,
	"matched_rules" jsonb NOT NULL,
	"hits" jsonb,
	"source_ip" text,
	"method" text,
	"created_at" timestamp DEFAULT now()
);
