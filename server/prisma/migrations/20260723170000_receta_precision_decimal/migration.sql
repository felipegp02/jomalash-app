-- Algunos consumibles se desgastan en fracciones muy chicas por servicio
-- (ej. 0.003 unidades de una lima); Decimal(10,2) redondeaba eso a 0.
ALTER TABLE `RECETA` MODIFY COLUMN `cantidad_usada` DECIMAL(10, 4) NOT NULL;
