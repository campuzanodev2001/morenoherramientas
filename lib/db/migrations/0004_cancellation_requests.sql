CREATE TYPE "public"."cancellation_status" AS ENUM('pending', 'in_review', 'resolved');--> statement-breakpoint
CREATE TABLE "cancellation_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid,
	"order_number" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"reason" text,
	"status" "cancellation_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cancellation_requests" ADD CONSTRAINT "cancellation_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cancellation_requests_status_idx" ON "cancellation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cancellation_requests_created_at_idx" ON "cancellation_requests" USING btree ("created_at");