-- Nuevos campos: tipo de insumo, tipo de medida (solo consumibles) y
-- contenido_por_compra (reemplaza a equivalencia)
ALTER TABLE `INSUMOS`
  ADD COLUMN `tipo` ENUM('consumible', 'herramienta') NOT NULL DEFAULT 'consumible',
  ADD COLUMN `tipo_medida` ENUM('ml', 'gramos', 'unidades') NULL,
  ADD COLUMN `contenido_por_compra` DECIMAL(10, 2) NOT NULL DEFAULT 1;

-- Backfill de tipo_medida a partir de la vieja columna de texto libre "unidad"
UPDATE `INSUMOS` SET `tipo_medida` = CASE
  WHEN `unidad` = 'ml' THEN 'ml'
  WHEN `unidad` IN ('gramos', 'gramo', 'g') THEN 'gramos'
  ELSE 'unidades'
END;

-- Backfill de contenido_por_compra a partir de la vieja "equivalencia"
UPDATE `INSUMOS` SET `contenido_por_compra` = `equivalencia`;

-- Las columnas viejas quedan reemplazadas por las nuevas
ALTER TABLE `INSUMOS`
  DROP COLUMN `unidad`,
  DROP COLUMN `equivalencia`;
