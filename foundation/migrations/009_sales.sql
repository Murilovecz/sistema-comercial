-- Additive sale normalization. Preserve historical identities, presence and snapshots.

CREATE TABLE commercial_sales (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT NOT NULL,
 customer_id TEXT,
 customer_name TEXT,
 created_at TEXT,
 due_date TEXT,
 received_at TEXT,
 cancelled_at TEXT,
 total_cents INTEGER NOT NULL CHECK(total_cents BETWEEN 0 AND 9007199254740991),
 subtotal_cents INTEGER,
 discount_cents INTEGER,
 discount_reason TEXT,
 payment_method TEXT,
 payment_status TEXT,
 request_id TEXT,
 request_fingerprint TEXT,
 commercial_command_fingerprint TEXT,
 account_version INTEGER,
 return_version INTEGER,
 forgiven_cents INTEGER,
 store_credit_cents INTEGER,
 store_credit_restored_cents INTEGER,
 store_credit_issued_cents INTEGER,
 quote_id TEXT,
 quote_number INTEGER,
 reservation_id TEXT,
 reservation_number INTEGER,
 active_agreement_id TEXT,
 code TEXT,
 number INTEGER,
 active INTEGER CHECK(active IS NULL OR active IN(0,1)),
 version INTEGER,
 execution_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 content_hash TEXT NOT NULL CHECK(length(content_hash)=64),
 search_text TEXT NOT NULL,
 sort_name TEXT NOT NULL,
 sale_day TEXT,
 is_cancelled INTEGER NOT NULL CHECK(is_cancelled IN(0,1)),
 executed_by TEXT,
 authorized_by TEXT,
 executor_name TEXT,
 authorizer_name TEXT,
 executed_at TEXT,
 PRIMARY KEY(company_id,unit_id,id),
 UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id),
 FOREIGN KEY(company_id,unit_id,customer_id) REFERENCES commercial_customers(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(executed_by) REFERENCES users(id),
 FOREIGN KEY(authorized_by) REFERENCES users(id)
) STRICT;

CREATE TABLE commercial_sale_items (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 product_id TEXT,
 name TEXT,
 code TEXT,
 quantity TEXT NOT NULL,
 price_cents INTEGER NOT NULL CHECK(price_cents BETWEEN 0 AND 9007199254740991),
 base_price_cents INTEGER,
 list_price_cents INTEGER,
 unit_cost_cents INTEGER,
 cost_cents INTEGER,
 unit TEXT,
 measure_unit TEXT,
 price_origin TEXT,
 price_list_id TEXT,
 price_list_name TEXT,
 price_list_version INTEGER,
 inactive_at_sale INTEGER CHECK(inactive_at_sale IS NULL OR inactive_at_sale IN(0,1)),
 promotion_json TEXT,
 substituted_from_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_items_by_sale ON commercial_sale_items(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_item_packages (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 item_ordinal INTEGER NOT NULL CHECK(item_ordinal>=0),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 package_id TEXT,
 name TEXT,
 factor_quantity TEXT,
 count_quantity TEXT,
 version INTEGER,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,item_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id,item_ordinal) REFERENCES commercial_sale_items(company_id,unit_id,sale_id,ordinal) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_item_packages_by_sale ON commercial_sale_item_packages(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_item_stock_sources (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 item_ordinal INTEGER NOT NULL CHECK(item_ordinal>=0),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 position_id TEXT,
 name TEXT,
 quantity TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,item_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id,item_ordinal) REFERENCES commercial_sale_items(company_id,unit_id,sale_id,ordinal) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_item_stock_sources_by_sale ON commercial_sale_item_stock_sources(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_receipts (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 declared_sale_id TEXT,
 request_id TEXT,
 amount_cents INTEGER,
 payment_method TEXT,
 created_at TEXT,
 cash_session_id TEXT,
 reference TEXT,
 tendered_cents INTEGER,
 change_cents INTEGER,
 agreement_id TEXT,
 agreement_payment_id TEXT,
 legacy INTEGER CHECK(legacy IS NULL OR legacy IN(0,1)),
 execution_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_receipts_by_sale ON commercial_sale_receipts(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_receipt_allocations (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 receipt_ordinal INTEGER NOT NULL CHECK(receipt_ordinal>=0),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 installment_id TEXT,
 amount_cents INTEGER,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,receipt_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id,receipt_ordinal) REFERENCES commercial_sale_receipts(company_id,unit_id,sale_id,ordinal) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_receipt_allocations_by_sale ON commercial_sale_receipt_allocations(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_installments (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 number INTEGER,
 amount_cents INTEGER,
 due_date TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_installments_by_sale ON commercial_sale_installments(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_returns (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 number INTEGER,
 created_at TEXT,
 reason TEXT,
 responsible TEXT,
 total_cents INTEGER,
 store_credit_restored_cents INTEGER,
 execution_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_returns_by_sale ON commercial_sale_returns(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_return_items (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 return_ordinal INTEGER NOT NULL CHECK(return_ordinal>=0),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 product_id TEXT,
 name TEXT,
 quantity TEXT,
 restock_quantity TEXT,
 quarantine_quantity TEXT,
 remaining_quantity TEXT,
 restock INTEGER CHECK(restock IS NULL OR restock IN(0,1)),
 amount_cents INTEGER,
 note TEXT,
 quarantine_entry_id TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,return_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id,return_ordinal) REFERENCES commercial_sale_returns(company_id,unit_id,sale_id,ordinal) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_return_items_by_sale ON commercial_sale_return_items(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_refunds (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 amount_cents INTEGER,
 payment_method TEXT,
 created_at TEXT,
 paid_date TEXT,
 recorded_at TEXT,
 cash_session_id TEXT,
 note TEXT,
 return_refund INTEGER CHECK(return_refund IS NULL OR return_refund IN(0,1)),
 execution_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_refunds_by_sale ON commercial_sale_refunds(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_return_allocations (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 product_id TEXT,
 quantity TEXT,
 discounted_units_quantity TEXT,
 unit_net_cents INTEGER,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_return_allocations_by_sale ON commercial_sale_return_allocations(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_credit_allocations (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 credit_id TEXT,
 amount_cents INTEGER,
 restored_cents INTEGER,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_credit_allocations_by_sale ON commercial_sale_credit_allocations(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_forgiveness (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 created_at TEXT,
 amount_cents INTEGER,
 reason TEXT,
 responsible TEXT,
 execution_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_forgiveness_by_sale ON commercial_sale_forgiveness(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_forgiveness_allocations (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 forgiveness_ordinal INTEGER NOT NULL CHECK(forgiveness_ordinal>=0),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 id TEXT,
 installment_id TEXT,
 amount_cents INTEGER,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,forgiveness_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id,forgiveness_ordinal) REFERENCES commercial_sale_forgiveness(company_id,unit_id,sale_id,ordinal) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_forgiveness_allocations_by_sale ON commercial_sale_forgiveness_allocations(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_checkouts (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 total_cents INTEGER,
 internal_cents INTEGER,
 received_cents INTEGER,
 remaining_cents INTEGER,
 cash_cents INTEGER,
 tendered_cents INTEGER,
 change_cents INTEGER,
 status TEXT,
 recorded_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_checkouts_by_sale ON commercial_sale_checkouts(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_checkout_receipt_ids (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 checkout_ordinal INTEGER NOT NULL CHECK(checkout_ordinal>=0),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 value_json TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,checkout_ordinal,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id,checkout_ordinal) REFERENCES commercial_sale_checkouts(company_id,unit_id,sale_id,ordinal) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_checkout_receipt_ids_by_sale ON commercial_sale_checkout_receipt_ids(company_id,unit_id,sale_id,ordinal);

CREATE TABLE commercial_sale_pos (
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 sale_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 station TEXT,
 shift TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 PRIMARY KEY(company_id,unit_id,sale_id,ordinal),
 FOREIGN KEY(company_id,unit_id,sale_id) REFERENCES commercial_sales(company_id,unit_id,id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX commercial_sale_pos_by_sale ON commercial_sale_pos(company_id,unit_id,sale_id,ordinal);

CREATE INDEX sales_scope_date ON commercial_sales(company_id,unit_id,sale_day,id);
CREATE INDEX sales_scope_customer ON commercial_sales(company_id,unit_id,customer_id,sale_day,id);
CREATE INDEX sales_scope_name ON commercial_sales(company_id,unit_id,sort_name,id);
CREATE INDEX sales_scope_request ON commercial_sales(company_id,unit_id,request_id);
CREATE INDEX sales_scope_executor ON commercial_sales(company_id,unit_id,executed_by,sale_day,id);

