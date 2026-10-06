-- Support the deferred receipt FK without changing data or business constraints.
-- Keep the existing product index; receipt checks need all four child-key columns.
CREATE INDEX stock_movements_scope_receipt
 ON commercial_stock_movements(company_id,unit_id,purchase_id,receipt_ordinal);
