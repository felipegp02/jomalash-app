/*
  Warnings:

  - Made the column `corte` on table `pagos_nomina` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `pagos_nomina` MODIFY `corte` ENUM('corte1', 'corte2') NOT NULL;
