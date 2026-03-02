-- CreateTable
CREATE TABLE `MatchAttendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partidoId` INTEGER NOT NULL,
    `jugadoraId` INTEGER NOT NULL,
    `equipoId` INTEGER NOT NULL,
    `presente` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MatchAttendance_partidoId_jugadoraId_key`(`partidoId`, `jugadoraId`),
    INDEX `MatchAttendance_partidoId_idx`(`partidoId`),
    INDEX `MatchAttendance_jugadoraId_idx`(`jugadoraId`),
    INDEX `MatchAttendance_equipoId_idx`(`equipoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MatchAttendance` ADD CONSTRAINT `MatchAttendance_partidoId_fkey` FOREIGN KEY (`partidoId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchAttendance` ADD CONSTRAINT `MatchAttendance_jugadoraId_fkey` FOREIGN KEY (`jugadoraId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchAttendance` ADD CONSTRAINT `MatchAttendance_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
