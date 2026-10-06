CREATE TABLE companies (
 id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE units (
 company_id TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 PRIMARY KEY(company_id,id), FOREIGN KEY(company_id) REFERENCES companies(id)
) STRICT;
CREATE TABLE users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 login TEXT NOT NULL UNIQUE CHECK(length(login) BETWEEN 3 AND 120), password_hash TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE company_memberships (
 user_id TEXT NOT NULL, company_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 PRIMARY KEY(user_id,company_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(company_id) REFERENCES companies(id)
) STRICT;
CREATE TABLE unit_memberships (
 user_id TEXT NOT NULL, company_id TEXT NOT NULL, unit_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 PRIMARY KEY(user_id,company_id,unit_id),
 FOREIGN KEY(user_id,company_id) REFERENCES company_memberships(user_id,company_id),
 FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id)
) STRICT;
CREATE TABLE roles (
 company_id TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 PRIMARY KEY(company_id,id), UNIQUE(company_id,name), FOREIGN KEY(company_id) REFERENCES companies(id)
) STRICT;
CREATE TABLE permissions (code TEXT PRIMARY KEY, description TEXT NOT NULL) STRICT;
CREATE TABLE role_permissions (
 company_id TEXT NOT NULL, role_id TEXT NOT NULL, permission_code TEXT NOT NULL,
 PRIMARY KEY(company_id,role_id,permission_code),
 FOREIGN KEY(company_id,role_id) REFERENCES roles(company_id,id), FOREIGN KEY(permission_code) REFERENCES permissions(code)
) STRICT;
CREATE TABLE unit_roles (
 user_id TEXT NOT NULL, company_id TEXT NOT NULL, unit_id TEXT NOT NULL, role_id TEXT NOT NULL,
 PRIMARY KEY(user_id,company_id,unit_id,role_id),
 FOREIGN KEY(user_id,company_id,unit_id) REFERENCES unit_memberships(user_id,company_id,unit_id),
 FOREIGN KEY(company_id,role_id) REFERENCES roles(company_id,id)
) STRICT;
CREATE TABLE sessions (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash)=64), user_id TEXT NOT NULL,
 company_id TEXT, unit_id TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL, revoked_at TEXT,
 CHECK((company_id IS NULL AND unit_id IS NULL) OR (company_id IS NOT NULL AND unit_id IS NOT NULL)),
 FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(user_id,company_id,unit_id) REFERENCES unit_memberships(user_id,company_id,unit_id)
) STRICT;
CREATE INDEX sessions_by_user ON sessions(user_id,revoked_at);
CREATE TABLE unit_states (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 9007199254740991),
 payload TEXT NOT NULL CHECK(json_valid(payload) AND json_type(payload)='object'), updated_at TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id), FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id)
) STRICT;
CREATE TABLE entity_index (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, kind TEXT NOT NULL, record_id TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id,kind,record_id),
 FOREIGN KEY(company_id,unit_id) REFERENCES unit_states(company_id,unit_id)
) STRICT;
CREATE TABLE import_runs (
 company_id TEXT NOT NULL, unit_id TEXT NOT NULL, source_hash TEXT NOT NULL,
 report_json TEXT NOT NULL CHECK(json_valid(report_json)), imported_at TEXT NOT NULL,
 PRIMARY KEY(company_id,unit_id), FOREIGN KEY(company_id,unit_id) REFERENCES unit_states(company_id,unit_id)
) STRICT;
CREATE TABLE audit_events (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
 user_id TEXT, company_id TEXT, unit_id TEXT, session_id TEXT,
 action TEXT NOT NULL, entity TEXT NOT NULL, record_id TEXT,
 before_json TEXT CHECK(before_json IS NULL OR json_valid(before_json)),
 after_json TEXT CHECK(after_json IS NULL OR json_valid(after_json)),
 executed_by TEXT, authorized_by TEXT, reason TEXT NOT NULL DEFAULT '', date TEXT NOT NULL,
 prev_hash TEXT NOT NULL, entry_hash TEXT NOT NULL,
 CHECK((company_id IS NULL AND unit_id IS NULL) OR (company_id IS NOT NULL AND unit_id IS NOT NULL)),
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(executed_by) REFERENCES users(id),
 FOREIGN KEY(authorized_by) REFERENCES users(id), FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id)
) STRICT;
CREATE INDEX audit_by_scope ON audit_events(company_id,unit_id,sequence);
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TABLE foundation_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
