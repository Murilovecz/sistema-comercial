CREATE TABLE commercial_customers (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, id TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT NOT NULL,
 phone TEXT, email TEXT, contact_name TEXT, address TEXT, document TEXT,
 commercial_id TEXT, notes TEXT, preferred_price_list_id TEXT,
 active INTEGER CHECK(active IS NULL OR active IN(0,1)),
 version INTEGER CHECK(version IS NULL OR version BETWEEN 1 AND 9007199254740991),
 created_at TEXT, updated_at TEXT,
 present_fields TEXT NOT NULL CHECK(json_valid(present_fields) AND json_type(present_fields)='array'),
 extra_json TEXT NOT NULL CHECK(json_valid(extra_json) AND json_type(extra_json)='object'),
 search_text TEXT NOT NULL, sort_name TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,id), UNIQUE(company_id,unit_id,ordinal),
 FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id)
) STRICT;
CREATE INDEX customers_scope_name ON commercial_customers(company_id,unit_id,sort_name,id);
