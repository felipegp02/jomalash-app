-- Mismo motivo que la migracion anterior en RECETA: un consumible que se
-- descuenta 0.003 por servicio necesita mas de 2 decimales para que el
-- descuento no se pierda por redondeo en cada venta.
ALTER TABLE `INSUMOS`
  MODIFY COLUMN `stock_actual` DECIMAL(10, 4) NOT NULL,
  MODIFY COLUMN `stock_minimo` DECIMAL(10, 4) NOT NULL;
