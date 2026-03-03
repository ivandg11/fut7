-- AlterTable
ALTER TABLE `MatchAttendance`
ADD COLUMN `tarjetaAmarilla` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `tarjetaRoja` BOOLEAN NOT NULL DEFAULT false;
