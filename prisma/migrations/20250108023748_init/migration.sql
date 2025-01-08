-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('realtor', 'loan_officer', 'realtor_coach', 'loan_officer_coach', 'admin');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'closed');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'resolved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" TEXT,
    "profileImageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "subscription" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'realtor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "brokerId" INTEGER,
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtorProfile" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanOfficerProfile" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanOfficerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtorCoachProfile" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "specialty" TEXT,
    "bio" TEXT,
    "experience" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability" TEXT,
    "sessionLength" TEXT,
    "specialties" TEXT NOT NULL DEFAULT '[]',
    "calendlyUrl" TEXT,
    "eventTypeUrl" TEXT,
    "hourlyRate" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtorCoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanOfficerCoachProfile" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "specialties" TEXT,
    "yearsOfExperience" INTEGER,
    "hourlyRate" DECIMAL(10,2),
    "bio" TEXT,
    "oneTimeCallPrice" DECIMAL(10,2),
    "bundlePrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanOfficerCoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "coachDbId" INTEGER NOT NULL,
    "menteeDbId" INTEGER NOT NULL,
    "calendlyEventId" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER,
    "payerDbId" INTEGER NOT NULL,
    "payeeDbId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "reviewerDbId" INTEGER NOT NULL,
    "revieweeDbId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachApplication" (
    "id" SERIAL NOT NULL,
    "applicantDbId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "experience" TEXT NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewerDbId" INTEGER,
    "reviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "authorDbId" INTEGER NOT NULL,
    "relatedUserDbId" INTEGER,
    "sessionId" INTEGER,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" SERIAL NOT NULL,
    "payeeDbId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripeTransferId" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chargeback" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chargeback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "senderDbId" INTEGER NOT NULL,
    "recipientDbId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "readStatus" TEXT NOT NULL DEFAULT 'unread',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "referrerDbId" INTEGER NOT NULL,
    "refereeDbId" INTEGER NOT NULL,
    "referralCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "message" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendlyIntegration" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "organizationUrl" TEXT NOT NULL,
    "schedulingUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendlyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "planId" TEXT NOT NULL,
    "defaultPaymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" SERIAL NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userDbId" INTEGER,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "amountDue" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_userId_idx" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_userDbId_key" ON "RealtorProfile"("userDbId");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_licenseNumber_key" ON "RealtorProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "RealtorProfile_userDbId_idx" ON "RealtorProfile"("userDbId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanOfficerProfile_userDbId_key" ON "LoanOfficerProfile"("userDbId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanOfficerProfile_licenseNumber_key" ON "LoanOfficerProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "LoanOfficerProfile_userDbId_idx" ON "LoanOfficerProfile"("userDbId");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorCoachProfile_userDbId_key" ON "RealtorCoachProfile"("userDbId");

-- CreateIndex
CREATE INDEX "RealtorCoachProfile_userDbId_idx" ON "RealtorCoachProfile"("userDbId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanOfficerCoachProfile_userDbId_key" ON "LoanOfficerCoachProfile"("userDbId");

-- CreateIndex
CREATE INDEX "LoanOfficerCoachProfile_userDbId_idx" ON "LoanOfficerCoachProfile"("userDbId");

-- CreateIndex
CREATE INDEX "Session_coachDbId_idx" ON "Session"("coachDbId");

-- CreateIndex
CREATE INDEX "Session_menteeDbId_idx" ON "Session"("menteeDbId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_sessionId_key" ON "Payment"("sessionId");

-- CreateIndex
CREATE INDEX "Payment_sessionId_idx" ON "Payment"("sessionId");

-- CreateIndex
CREATE INDEX "Payment_payerDbId_idx" ON "Payment"("payerDbId");

-- CreateIndex
CREATE INDEX "Payment_payeeDbId_idx" ON "Payment"("payeeDbId");

-- CreateIndex
CREATE INDEX "Review_reviewerDbId_idx" ON "Review"("reviewerDbId");

-- CreateIndex
CREATE INDEX "Review_revieweeDbId_idx" ON "Review"("revieweeDbId");

-- CreateIndex
CREATE INDEX "Review_sessionId_idx" ON "Review"("sessionId");

-- CreateIndex
CREATE INDEX "CoachApplication_applicantDbId_idx" ON "CoachApplication"("applicantDbId");

-- CreateIndex
CREATE INDEX "CoachApplication_reviewerDbId_idx" ON "CoachApplication"("reviewerDbId");

-- CreateIndex
CREATE INDEX "Note_authorDbId_idx" ON "Note"("authorDbId");

-- CreateIndex
CREATE INDEX "Note_relatedUserDbId_idx" ON "Note"("relatedUserDbId");

-- CreateIndex
CREATE INDEX "Note_sessionId_idx" ON "Note"("sessionId");

-- CreateIndex
CREATE INDEX "SupportTicket_userDbId_idx" ON "SupportTicket"("userDbId");

-- CreateIndex
CREATE INDEX "Payout_payeeDbId_idx" ON "Payout"("payeeDbId");

-- CreateIndex
CREATE INDEX "Dispute_paymentId_idx" ON "Dispute"("paymentId");

-- CreateIndex
CREATE INDEX "Chargeback_paymentId_idx" ON "Chargeback"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Message_senderDbId_idx" ON "Message"("senderDbId");

-- CreateIndex
CREATE INDEX "Message_recipientDbId_idx" ON "Message"("recipientDbId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_referrerDbId_idx" ON "Referral"("referrerDbId");

-- CreateIndex
CREATE INDEX "Referral_refereeDbId_idx" ON "Referral"("refereeDbId");

-- CreateIndex
CREATE INDEX "Reminder_userDbId_idx" ON "Reminder"("userDbId");

-- CreateIndex
CREATE INDEX "Reminder_sessionId_idx" ON "Reminder"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyIntegration_userDbId_key" ON "CalendlyIntegration"("userDbId");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_userDbId_idx" ON "CalendlyIntegration"("userDbId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriptionId_key" ON "Subscription"("subscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userDbId_idx" ON "Subscription"("userDbId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_planId_key" ON "SubscriptionPlan"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceId_key" ON "Invoice"("invoiceId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_userDbId_idx" ON "Invoice"("userDbId");

-- AddForeignKey
ALTER TABLE "RealtorProfile" ADD CONSTRAINT "RealtorProfile_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerProfile" ADD CONSTRAINT "LoanOfficerProfile_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtorCoachProfile" ADD CONSTRAINT "RealtorCoachProfile_user_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtorCoachProfile" ADD CONSTRAINT "RealtorCoachProfile_realtorProfile_fkey" FOREIGN KEY ("userDbId") REFERENCES "RealtorProfile"("userDbId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerCoachProfile" ADD CONSTRAINT "LoanOfficerCoachProfile_user_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerCoachProfile" ADD CONSTRAINT "LoanOfficerCoachProfile_loanOfficerProfile_fkey" FOREIGN KEY ("userDbId") REFERENCES "LoanOfficerProfile"("userDbId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachDbId_fkey" FOREIGN KEY ("coachDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_menteeDbId_fkey" FOREIGN KEY ("menteeDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerDbId_fkey" FOREIGN KEY ("payerDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payeeDbId_fkey" FOREIGN KEY ("payeeDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerDbId_fkey" FOREIGN KEY ("reviewerDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeDbId_fkey" FOREIGN KEY ("revieweeDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_applicantDbId_fkey" FOREIGN KEY ("applicantDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_reviewerDbId_fkey" FOREIGN KEY ("reviewerDbId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorDbId_fkey" FOREIGN KEY ("authorDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_relatedUserDbId_fkey" FOREIGN KEY ("relatedUserDbId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payeeDbId_fkey" FOREIGN KEY ("payeeDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chargeback" ADD CONSTRAINT "Chargeback_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderDbId_fkey" FOREIGN KEY ("senderDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientDbId_fkey" FOREIGN KEY ("recipientDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerDbId_fkey" FOREIGN KEY ("referrerDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeDbId_fkey" FOREIGN KEY ("refereeDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendlyIntegration" ADD CONSTRAINT "CalendlyIntegration_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("planId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("subscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
