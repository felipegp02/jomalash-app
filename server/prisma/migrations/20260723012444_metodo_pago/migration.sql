-- AlterTable
ALTER TABLE `VENTAS` ADD COLUMN `metodo_pago` ENUM('efectivo', 'transferencia', 'tarjeta') NOT NULL DEFAULT 'efectivo';
