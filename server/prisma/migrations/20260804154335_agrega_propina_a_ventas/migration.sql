-- AlterTable
ALTER TABLE `VENTAS` ADD COLUMN `propina` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `propina_metodo_pago` ENUM('efectivo', 'transferencia', 'tarjeta') NULL;
