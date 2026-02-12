-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "bookingType" TEXT NOT NULL DEFAULT 'online',
ADD COLUMN     "offlineClientName" TEXT,
ADD COLUMN     "offlineClientPhone" TEXT,
ADD COLUMN     "offlinePetName" TEXT,
ADD COLUMN     "offlinePetType" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "petId" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL;
