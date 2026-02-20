-- CreateTable
CREATE TABLE `Configuracion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave_admin` VARCHAR(191) NOT NULL,
    `clave_editor` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Liga` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dia` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Liga_dia_key`(`dia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `escudo` VARCHAR(191) NULL,
    `ligaId` INTEGER NOT NULL,
    `partidosJugados` INTEGER NOT NULL DEFAULT 0,
    `golesFavor` INTEGER NOT NULL DEFAULT 0,
    `golesContra` INTEGER NOT NULL DEFAULT 0,
    `puntos` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Equipo_nombre_ligaId_key`(`nombre`, `ligaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ligaId` INTEGER NOT NULL,
    `equipoLocalId` INTEGER NOT NULL,
    `equipoVisitaId` INTEGER NOT NULL,
    `golesLocal` INTEGER NOT NULL DEFAULT 0,
    `golesVisita` INTEGER NOT NULL DEFAULT 0,
    `fecha` DATETIME(3) NOT NULL,
    `cancha` INTEGER NOT NULL DEFAULT 1,
    `horario` VARCHAR(191) NOT NULL,
    `jornada` INTEGER NOT NULL,
    `jugado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Partido_ligaId_equipoLocalId_equipoVisitaId_jornada_key`(`ligaId`, `equipoLocalId`, `equipoVisitaId`, `jornada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Equipo` ADD CONSTRAINT `Equipo_ligaId_fkey` FOREIGN KEY (`ligaId`) REFERENCES `Liga`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partido` ADD CONSTRAINT `Partido_ligaId_fkey` FOREIGN KEY (`ligaId`) REFERENCES `Liga`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partido` ADD CONSTRAINT `Partido_equipoLocalId_fkey` FOREIGN KEY (`equipoLocalId`) REFERENCES `Equipo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partido` ADD CONSTRAINT `Partido_equipoVisitaId_fkey` FOREIGN KEY (`equipoVisitaId`) REFERENCES `Equipo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
