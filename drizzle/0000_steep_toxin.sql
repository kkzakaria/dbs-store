CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category_id` text NOT NULL,
	`subcategory_id` text,
	`price` integer NOT NULL,
	`old_price` integer,
	`brand` text NOT NULL,
	`images` text NOT NULL,
	`description` text NOT NULL,
	`specs` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`badge` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);