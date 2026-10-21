-- CreateTable
CREATE TABLE "pharmacy_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "responsible" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_groups_cnpj_key" ON "pharmacy_groups"("cnpj");

-- AlterTable pharmacies
ALTER TABLE "pharmacies" ADD COLUMN IF NOT EXISTS "groupId" TEXT;

-- AlterTable users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pharmacyId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'pharmacy_user';

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pharmacies_groupId_fkey'
    ) THEN
        ALTER TABLE "pharmacies" ADD CONSTRAINT "pharmacies_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "pharmacy_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_groupId_fkey'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "pharmacy_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_pharmacyId_fkey'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
