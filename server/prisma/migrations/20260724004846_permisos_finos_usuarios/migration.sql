-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `gestiona_catalogo` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `gestiona_empleadas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ve_caja` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ve_dashboard_completo` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ve_insumos` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ve_nomina` BOOLEAN NOT NULL DEFAULT false;
