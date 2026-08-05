-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VehicleModel" AS ENUM ('glanza', 'hyryder');

-- CreateEnum
CREATE TYPE "SendJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "SendMessageStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('completed', 'failed');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "referral_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_imports" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "accepted_count" INTEGER NOT NULL,
    "rejected_count" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "send_jobs" (
    "id" TEXT NOT NULL,
    "status" "SendJobStatus" NOT NULL DEFAULT 'pending',
    "total" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "send_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "send_messages" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "phone" TEXT NOT NULL,
    "status" "SendMessageStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "send_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_customer_id" TEXT,
    "referrer_name" TEXT NOT NULL,
    "referrer_phone" TEXT NOT NULL,
    "referred_name" TEXT NOT NULL,
    "referred_phone" TEXT NOT NULL,
    "model" "VehicleModel" NOT NULL,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicate_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_referral_token_key" ON "customers"("referral_token");

-- CreateIndex
CREATE INDEX "send_messages_job_id_status_idx" ON "send_messages"("job_id", "status");

-- CreateIndex
CREATE INDEX "referrals_referred_phone_idx" ON "referrals"("referred_phone");

-- AddForeignKey
ALTER TABLE "send_messages" ADD CONSTRAINT "send_messages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "send_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_messages" ADD CONSTRAINT "send_messages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_customer_id_fkey" FOREIGN KEY ("referrer_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
