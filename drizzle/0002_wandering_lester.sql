CREATE TABLE `hero_slides` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`badge` text,
	`image_url` text NOT NULL,
	`text_align` text DEFAULT 'center' NOT NULL,
	`overlay_color` text DEFAULT '#000000' NOT NULL,
	`overlay_opacity` integer DEFAULT 40 NOT NULL,
	`cta_primary_label` text,
	`cta_primary_href` text,
	`cta_secondary_label` text,
	`cta_secondary_href` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
