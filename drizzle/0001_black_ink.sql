CREATE TABLE `csv_import_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(64) NOT NULL,
	`statementMonth` varchar(7) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`totalTransactions` int NOT NULL,
	`totalAmountCadCents` int NOT NULL,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `csv_import_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `csv_import_batches_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`merchantName` varchar(255) NOT NULL,
	`amountCadCents` int NOT NULL,
	`gstItcCadCents` int NOT NULL DEFAULT 0,
	`preTaxAmountCadCents` int NOT NULL,
	`category` enum('gas_fuel','office_supplies','software_subscription','stripe_fees','advertising','professional_services','equipment','other') NOT NULL DEFAULT 'other',
	`gstEligible` boolean NOT NULL DEFAULT true,
	`notes` text,
	`importBatchId` varchar(64),
	`reviewed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(7) NOT NULL,
	`grossRevenueCadCents` int NOT NULL DEFAULT 0,
	`totalRefundsCadCents` int NOT NULL DEFAULT 0,
	`stripeFeesTotalCadCents` int NOT NULL DEFAULT 0,
	`netRevenueCadCents` int NOT NULL DEFAULT 0,
	`gstCollectedCadCents` int NOT NULL DEFAULT 0,
	`totalExpensesCadCents` int NOT NULL DEFAULT 0,
	`totalGstItcCadCents` int NOT NULL DEFAULT 0,
	`netGstRemittableCadCents` int NOT NULL DEFAULT 0,
	`netProfitCadCents` int NOT NULL DEFAULT 0,
	`pdfUrl` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_reports_period_unique` UNIQUE(`period`)
);
--> statement-breakpoint
CREATE TABLE `stripe_income` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeChargeId` varchar(128) NOT NULL,
	`amountUsdCents` int NOT NULL,
	`amountCadCents` int NOT NULL,
	`exchangeRate` decimal(8,6) NOT NULL,
	`gstCollectedCadCents` int NOT NULL DEFAULT 0,
	`stripeFeesCadCents` int NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`customerEmail` varchar(320),
	`description` text,
	`status` enum('succeeded','refunded','disputed') NOT NULL DEFAULT 'succeeded',
	`refunded` boolean NOT NULL DEFAULT false,
	`refundAmountCadCents` int NOT NULL DEFAULT 0,
	`chargedAt` timestamp NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripe_income_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_income_stripeChargeId_unique` UNIQUE(`stripeChargeId`)
);
