-- CreateTable
CREATE TABLE `GASTOS` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoria` ENUM('arriendo', 'servicios', 'varios') NOT NULL,
    `monto` INTEGER NOT NULL,
    `nota` VARCHAR(200) NULL,
    `sede_id` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registrado_por` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GASTOS` ADD CONSTRAINT `GASTOS_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `SEDES`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GASTOS` ADD CONSTRAINT `GASTOS_registrado_por_fkey` FOREIGN KEY (`registrado_por`) REFERENCES `USUARIOS`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
