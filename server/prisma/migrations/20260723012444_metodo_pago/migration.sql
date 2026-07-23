-- AlterTable
ALTER TABLE `ventas` ADD COLUMN `metodo_pago` ENUM('efectivo', 'transferencia', 'tarjeta') NOT NULL DEFAULT 'efectivo';
