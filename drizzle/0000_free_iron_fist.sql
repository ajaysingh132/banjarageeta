CREATE TABLE `ai_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('system','user','assistant') NOT NULL,
	`content` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) DEFAULT 'नई बातचीत',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterNumber` int NOT NULL,
	`titleBanjara` varchar(255) NOT NULL,
	`titleHindi` varchar(255) NOT NULL,
	`titleSanskrit` varchar(255),
	`descriptionBanjara` longtext,
	`descriptionHindi` longtext,
	`totalShlokas` int NOT NULL DEFAULT 0,
	`completedShlokas` int NOT NULL DEFAULT 0,
	`status` enum('draft','in-progress','complete') NOT NULL DEFAULT 'draft',
	`coverPrompt` longtext,
	`pdfPageStart` int,
	`pdfPageEnd` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapters_chapterNumber_unique` UNIQUE(`chapterNumber`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shlokaId` int NOT NULL,
	`sceneDescription` longtext,
	`characters` longtext,
	`background` longtext,
	`dialogue` longtext,
	`dialogueBanjara` longtext,
	`mood` varchar(100),
	`cameraAngle` varchar(100),
	`lighting` varchar(100),
	`audioNotes` longtext,
	`durationSeconds` double DEFAULT 30,
	`status` enum('not-started','draft','in-progress','complete') NOT NULL DEFAULT 'not-started',
	`aiGenerated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`),
	CONSTRAINT `scenes_shlokaId_unique` UNIQUE(`shlokaId`)
);
--> statement-breakpoint
CREATE TABLE `shlokas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`shlokaNumber` int NOT NULL,
	`verseNumber` varchar(20) NOT NULL,
	`sanskrit` longtext,
	`banjara` longtext,
	`hindi` longtext,
	`speaker` varchar(50) DEFAULT 'अर्जुन',
	`speakerBanjara` varchar(50),
	`meaning` longtext,
	`hasScene` int NOT NULL DEFAULT 0,
	`sceneStatus` enum('not-started','draft','in-progress','complete') NOT NULL DEFAULT 'not-started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shlokas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
