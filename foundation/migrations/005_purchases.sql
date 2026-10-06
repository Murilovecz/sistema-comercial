CREATE TABLE commercial_purchases (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), number INTEGER,
 supplier_id TEXT, supplier_name TEXT, source_id TEXT,
 version INTEGER NOT NULL CHECK(version BETWEEN 1 AND 9007199254740991),
 total_cents INTEGER NOT NULL CHECK(total_cents BETWEEN 0 AND 9007199254740991),
 expected_date TEXT, confirmed_expected_date TEXT, confirmed_at TEXT,
 closed_at TEXT, close_reason TEXT, closed_pending_quantity TEXT, closed_pending_cents INTEGER,
 supplier_quote_id TEXT, supplier_quote_response_id TEXT, quoted_freight_cents INTEGER,
 note TEXT, created_at TEXT, updated_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,id), UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id),
 FOREIGN KEY(company_id,unit_id,supplier_id) REFERENCES commercial_suppliers(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,source_id) REFERENCES commercial_purchases(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;
CREATE INDEX purchases_scope_supplier ON commercial_purchases(company_id,unit_id,supplier_id,created_at,id);
CREATE TABLE commercial_purchase_items (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, purchase_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), id TEXT, product_id TEXT,
 name TEXT, code TEXT, quantity TEXT NOT NULL,
 unit_cost_cents INTEGER NOT NULL CHECK(unit_cost_cents BETWEEN 0 AND 9007199254740991),
 unit TEXT, measure_unit TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,purchase_id,ordinal),
 UNIQUE(company_id,unit_id,purchase_id,ordinal,product_id),
 FOREIGN KEY(company_id,unit_id,purchase_id) REFERENCES commercial_purchases(company_id,unit_id,id),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;
CREATE TABLE commercial_purchase_receipts (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, purchase_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), id TEXT, sequence INTEGER,
 request_id TEXT, reference TEXT, declared_date TEXT, conference_id TEXT, conferent TEXT,
 note TEXT, created_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,purchase_id,ordinal),
 FOREIGN KEY(company_id,unit_id,purchase_id) REFERENCES commercial_purchases(company_id,unit_id,id)
) STRICT;
CREATE INDEX receipts_scope_id ON commercial_purchase_receipts(company_id,unit_id,id);
CREATE TABLE commercial_purchase_receipt_items (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, purchase_id TEXT NOT NULL,
 receipt_ordinal INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 ordered_item_ordinal INTEGER NOT NULL, id TEXT, product_id TEXT, name TEXT,
 quantity TEXT NOT NULL, unit_cost_cents INTEGER NOT NULL CHECK(unit_cost_cents BETWEEN 0 AND 9007199254740991),
 original_unit_cost_cents INTEGER, cost_reason TEXT, quarantine_quantity TEXT,
 quarantine_entry_id TEXT, destination_position_id TEXT, unit TEXT, measure_unit TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,purchase_id,receipt_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,purchase_id,receipt_ordinal) REFERENCES commercial_purchase_receipts(company_id,unit_id,purchase_id,ordinal),
 FOREIGN KEY(company_id,unit_id,purchase_id,ordered_item_ordinal) REFERENCES commercial_purchase_items(company_id,unit_id,purchase_id,ordinal),
 FOREIGN KEY(company_id,unit_id,purchase_id,ordered_item_ordinal,product_id) REFERENCES commercial_purchase_items(company_id,unit_id,purchase_id,ordinal,product_id),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;
