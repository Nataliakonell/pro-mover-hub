-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triages" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "participantName" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "systolic" INTEGER NOT NULL,
    "diastolic" INTEGER NOT NULL,
    "glucose" INTEGER NOT NULL,
    "spo2" INTEGER NOT NULL,
    "heartRate" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pressure" TEXT NOT NULL,
    "glucose" TEXT NOT NULL,
    "spo2" TEXT,
    "heartRate" TEXT,
    "note" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courtesy_records" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "triageId" TEXT,
    "date" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 4,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courtesy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courtesy_utilizations" (
    "id" TEXT NOT NULL,
    "courtesyRecordId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "professional" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Realizado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courtesy_utilizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "eventDate" TEXT NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "sysMinThreshold" INTEGER NOT NULL DEFAULT 90,
    "sysMaxThreshold" INTEGER NOT NULL DEFAULT 140,
    "diaMinThreshold" INTEGER NOT NULL DEFAULT 60,
    "diaMaxThreshold" INTEGER NOT NULL DEFAULT 90,
    "sysThreshold" INTEGER NOT NULL DEFAULT 140,
    "diaThreshold" INTEGER NOT NULL DEFAULT 90,
    "glucoseThreshold" INTEGER NOT NULL DEFAULT 140,
    "spo2Threshold" INTEGER NOT NULL DEFAULT 92,
    "hrMinThreshold" INTEGER NOT NULL DEFAULT 50,
    "hrMaxThreshold" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triages" ADD CONSTRAINT "triages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triages" ADD CONSTRAINT "triages_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courtesy_records" ADD CONSTRAINT "courtesy_records_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courtesy_utilizations" ADD CONSTRAINT "courtesy_utilizations_courtesyRecordId_fkey" FOREIGN KEY ("courtesyRecordId") REFERENCES "courtesy_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
