CREATE TABLE commercial_stock_balances (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, product_id TEXT NOT NULL,
 quantity TEXT NOT NULL, technical_anchor TEXT NOT NULL,
 positions_present INTEGER NOT NULL CHECK(positions_present IN (0,1,2)),
 PRIMARY KEY(company_id,unit_id,product_id),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;
CREATE TABLE commercial_position_balances (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, product_id TEXT NOT NULL, position_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL, quantity TEXT NOT NULL, technical_anchor TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,product_id,position_id),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_stock_balances(company_id,unit_id,product_id) DEFERRABLE INITIALLY DEFERRED
) STRICT;
CREATE TABLE commercial_stock_movements (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL,
 product_id TEXT NOT NULL, product_name TEXT, quantity TEXT NOT NULL, stock_after TEXT,
 type TEXT, reference_id TEXT, purchase_id TEXT, receipt_ordinal INTEGER,
 note TEXT, created_at TEXT, execution_json TEXT, search_text TEXT NOT NULL, sort_name TEXT NOT NULL,
 executed_by TEXT, authorized_by TEXT, executor_name TEXT, authorizer_name TEXT, executed_at TEXT,
 present_fields TEXT NOT NULL, extra_json TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,id), UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,purchase_id) REFERENCES commercial_purchases(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,purchase_id,receipt_ordinal) REFERENCES commercial_purchase_receipts(company_id,unit_id,purchase_id,ordinal) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(executed_by) REFERENCES users(id), FOREIGN KEY(authorized_by) REFERENCES users(id),
 CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 CHECK(execution_json IS NULL OR json_valid(execution_json))
) STRICT;
CREATE INDEX stock_movements_scope_product ON commercial_stock_movements(company_id,unit_id,product_id,created_at,id);
CREATE TABLE commercial_position_movements (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL,
 product_id TEXT NOT NULL, product_name TEXT, quantity TEXT NOT NULL,
 from_id TEXT, to_id TEXT, from_name TEXT, to_name TEXT, type TEXT, reference_id TEXT,
 stock_movement_id TEXT, reason TEXT, created_at TEXT, execution_json TEXT,
 executed_by TEXT, authorized_by TEXT, executor_name TEXT, authorizer_name TEXT, executed_at TEXT,
 present_fields TEXT NOT NULL, extra_json TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,id), UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,stock_movement_id) REFERENCES commercial_stock_movements(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(executed_by) REFERENCES users(id), FOREIGN KEY(authorized_by) REFERENCES users(id),
 CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 CHECK(execution_json IS NULL OR json_valid(execution_json))
) STRICT;
CREATE TABLE commercial_stock_entries (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL,
 product_id TEXT NOT NULL, product_name TEXT, quantity TEXT NOT NULL,
 request_id TEXT, destination_position_id TEXT, note TEXT, created_at TEXT,
 present_fields TEXT NOT NULL, extra_json TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,id), UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 CHECK(json_valid(extra_json) AND json_type(extra_json)='object')
) STRICT;
