-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `equivalencia` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    ADD COLUMN `unidad_compra` VARCHAR(20) NOT NULL DEFAULT '';
