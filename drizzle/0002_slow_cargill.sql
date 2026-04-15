CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`studentCount` int,
	`status` enum('ativo','inativo','trial') NOT NULL DEFAULT 'trial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `userSchools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolId` int NOT NULL,
	`role` enum('admin','director','coordinator','teacher') NOT NULL DEFAULT 'coordinator',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSchools_id` PRIMARY KEY(`id`)
);
