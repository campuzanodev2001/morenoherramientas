CREATE TYPE "public"."banner_device" AS ENUM('mobile', 'desktop');--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "device" "banner_device" DEFAULT 'desktop' NOT NULL;