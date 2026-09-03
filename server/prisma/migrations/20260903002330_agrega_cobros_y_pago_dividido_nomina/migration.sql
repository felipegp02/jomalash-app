-- AlterTable
ALTER TABLE `PAGOS_NOMINA` ADD COLUMN `monto_efectivo` INTEGER NULL,
    ADD COLUMN `monto_transferencia` INTEGER NULL,
    MODIFY `metodo_pago` ENUM('efectivo', 'transferencia') NULL;

-- AlterTable
ALTER TABLE `VENTAS` ADD COLUMN `cobro_id` INTEGER NULL,
    MODIFY `metodo_pago` ENUM('efectivo', 'transferencia', 'tarjeta') NULL;

-- CreateTable
CREATE TABLE `COBROS` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sede_id` INTEGER NOT NULL,
    `pago_efectivo` INTEGER NOT NULL DEFAULT 0,
    `pago_transferencia` INTEGER NOT NULL DEFAULT 0,
    `pago_tarjeta` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VENTAS` ADD CONSTRAINT `VENTAS_cobro_id_fkey` FOREIGN KEY (`cobro_id`) REFERENCES `COBROS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `COBROS` ADD CONSTRAINT `COBROS_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `SEDES`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
