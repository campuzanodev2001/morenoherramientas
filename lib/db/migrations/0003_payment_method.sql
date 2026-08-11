CREATE TYPE "public"."payment_method" AS ENUM('mercadopago', 'transfer');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'mercadopago' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;