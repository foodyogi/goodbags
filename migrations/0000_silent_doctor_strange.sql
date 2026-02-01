CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"actor_wallet" text,
	"actor_ip" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buybacks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sol_amount" numeric(18, 9) NOT NULL,
	"fyi_amount" numeric(18, 9) NOT NULL,
	"transaction_signature" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buybacks_transaction_signature_unique" UNIQUE("transaction_signature")
);
--> statement-breakpoint
CREATE TABLE "charities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'other' NOT NULL,
	"website" text,
	"email" text,
	"wallet_address" text,
	"twitter_handle" text,
	"x_handle_verified" boolean DEFAULT false,
	"payout_method" text DEFAULT 'wallet' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"logo_url" text,
	"created_by" text,
	"email_verification_token" text,
	"email_verified_at" timestamp,
	"wallet_verification_nonce" text,
	"wallet_verified_at" timestamp,
	"verified_at" timestamp,
	"last_contacted_at" timestamp,
	"registration_number" text,
	"submitter_wallet" text,
	"every_org_id" text,
	"every_org_slug" text,
	"every_org_verified" boolean DEFAULT false,
	"every_org_verified_at" timestamp,
	"every_org_name" text,
	"every_org_description" text,
	"every_org_website" text,
	"every_org_logo_url" text,
	"every_org_is_disbursable" boolean DEFAULT false,
	"change_id" text,
	"country_code" text,
	"country_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_mint" text NOT NULL,
	"amount" numeric(18, 9) NOT NULL,
	"charity_wallet" text NOT NULL,
	"transaction_signature" text NOT NULL,
	"donated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_transaction_signature_unique" UNIQUE("transaction_signature")
);
--> statement-breakpoint
CREATE TABLE "launched_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"description" text,
	"image_url" text,
	"mint_address" text NOT NULL,
	"creator_wallet" text NOT NULL,
	"charity_id" text,
	"charity_approval_status" text DEFAULT 'pending' NOT NULL,
	"charity_approval_note" text,
	"charity_notified_at" timestamp,
	"charity_responded_at" timestamp,
	"charity_name" text,
	"charity_email" text,
	"charity_website" text,
	"charity_twitter" text,
	"charity_facebook" text,
	"initial_buy_amount" numeric(18, 9) DEFAULT '0',
	"charity_donated" numeric(18, 9) DEFAULT '0',
	"platform_fee_collected" numeric(18, 9) DEFAULT '0',
	"trading_volume" numeric(18, 9) DEFAULT '0',
	"transaction_signature" text,
	"launched_at" timestamp DEFAULT now() NOT NULL,
	"donation_count" integer DEFAULT 0,
	"last_donation_at" timestamp,
	"is_test" boolean DEFAULT false,
	"charity_bps" integer DEFAULT 7500 NOT NULL,
	"buyback_bps" integer DEFAULT 500 NOT NULL,
	"creator_bps" integer DEFAULT 2000 NOT NULL,
	"donate_creator_share" boolean DEFAULT false NOT NULL,
	"donate_creator_percent" integer,
	"anomaly_acknowledged_at" timestamp,
	"anomaly_notes" text,
	CONSTRAINT "launched_tokens_mint_address_unique" UNIQUE("mint_address")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"display_name" varchar,
	"twitter_id" varchar,
	"twitter_username" varchar,
	"twitter_display_name" varchar,
	"wallet_address" varchar,
	"wallet_connected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_twitter_id_unique" UNIQUE("twitter_id")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");