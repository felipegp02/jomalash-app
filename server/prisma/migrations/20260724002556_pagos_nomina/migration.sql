-- AlterTable
ALTER TABLE `INSUMOS` ALTER COLUMN `unidad_compra` DROP DEFAULT;

-- CreateTable
CREATE TABLE `PAGOS_NOMINA` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `sede_id` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` ENUM('vale', 'liquidacion') NOT NULL,
    `monto` INTEGER NOT NULL,
    `metodo_pago` ENUM('efectivo', 'transferencia') NOT NULL,
    `periodo_inicio` DATE NULL,
    `periodo_fin` DATE NULL,
    `nota` VARCHAR(200) NULL,
    `registrado_por` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PAGOS_NOMINA` ADD CONSTRAINT `PAGOS_NOMINA_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIOS`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PAGOS_NOMINA` ADD CONSTRAINT `PAGOS_NOMINA_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `SEDES`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PAGOS_NOMINA` ADD CONSTRAINT `PAGOS_NOMINA_registrado_por_fkey` FOREIGN KEY (`registrado_por`) REFERENCES `USUARIOS`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
