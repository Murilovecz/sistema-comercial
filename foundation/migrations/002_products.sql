-- Additive product normalization. No deletion or reinterpretation of legacy snapshots.
CREATE TABLE commercial_products (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 name TEXT NOT NULL, code TEXT, sku TEXT, barcode TEXT, description TEXT, category TEXT, brand TEXT,
 location TEXT, unit TEXT, measure_unit TEXT,
 active INTEGER CHECK(active IS NULL OR active IN(0,1)),
 version INTEGER CHECK(version IS NULL OR version BETWEEN 1 AND 9007199254740991),
 price_cents INTEGER NOT NULL CHECK(price_cents BETWEEN 0 AND 9007199254740991),
 cost_cents INTEGER CHECK(cost_cents IS NULL OR cost_cents BETWEEN 0 AND 9007199254740991),
 unit_cost_cents INTEGER CHECK(unit_cost_cents IS NULL OR unit_cost_cents BETWEEN 0 AND 9007199254740991),
 minimum_price_cents INTEGER CHECK(minimum_price_cents IS NULL OR minimum_price_cents BETWEEN 0 AND 9007199254740991),
 stock_quantity TEXT NOT NULL, minimum_quantity TEXT,
 created_at TEXT, updated_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 search_text TEXT NOT NULL, sort_name TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,id), UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id)
) STRICT;
CREATE INDEX products_scope_name ON commercial_products(company_id,unit_id,sort_name,id);
CREATE INDEX products_scope_code ON commercial_products(company_id,unit_id,code,id);
CREATE TABLE commercial_product_aliases (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, product_id TEXT NOT NULL, id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT, code TEXT, barcode TEXT,
 active INTEGER CHECK(active IS NULL OR active IN(0,1)),
 version INTEGER CHECK(version IS NULL OR version BETWEEN 1 AND 9007199254740991), created_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 lookup_code TEXT, lookup_barcode TEXT,
 PRIMARY KEY(company_id,unit_id,product_id,id), UNIQUE(company_id,unit_id,product_id,ordinal),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id)
) STRICT;
CREATE TABLE commercial_product_packages (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, product_id TEXT NOT NULL, id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT, code TEXT, barcode TEXT,
 active INTEGER CHECK(active IS NULL OR active IN(0,1)),
 version INTEGER CHECK(version IS NULL OR version BETWEEN 1 AND 9007199254740991),
 factor_quantity TEXT, unit TEXT, created_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 lookup_code TEXT, lookup_barcode TEXT,
 PRIMARY KEY(company_id,unit_id,product_id,id), UNIQUE(company_id,unit_id,product_id,ordinal),
 FOREIGN KEY(company_id,unit_id,product_id) REFERENCES commercial_products(company_id,unit_id,id)
) STRICT;
CREATE INDEX aliases_scope_lookup ON commercial_product_aliases(company_id,unit_id,lookup_code,lookup_barcode);
CREATE INDEX packages_scope_lookup ON commercial_product_packages(company_id,unit_id,lookup_code,lookup_barcode);
CREATE TABLE commercial_normalizations (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, aggregate TEXT NOT NULL,
 source_revision INTEGER NOT NULL CHECK(source_revision>=0), normalized_at TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,aggregate), FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id)
) STRICT;
