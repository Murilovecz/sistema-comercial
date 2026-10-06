INSERT INTO permissions(code,description) VALUES('sales.authorize_inactive','Autorizar venda excepcional de produto desativado');
CREATE TABLE inactive_permission_upgrade (
 company_id TEXT NOT NULL, role_id TEXT NOT NULL, granted_at TEXT NOT NULL,
 audited_at TEXT,
 PRIMARY KEY(company_id,role_id), FOREIGN KEY(company_id,role_id) REFERENCES roles(company_id,id)
) STRICT;
INSERT INTO inactive_permission_upgrade(company_id,role_id,granted_at)
SELECT company_id,role_id,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM role_permissions
WHERE permission_code IN ('catalog.view','catalog.manage','inventory.view','inventory.adjust','sales.view','sales.create','sales.cancel','purchases.manage','financial.view','financial.manage','cash.manage','operations.view','operations.manage','users.manage','roles.manage','companies.manage','units.manage','audit.view')
GROUP BY company_id,role_id HAVING count(DISTINCT permission_code)=18;
INSERT INTO role_permissions(company_id,role_id,permission_code)
SELECT company_id,role_id,'sales.authorize_inactive' FROM inactive_permission_upgrade;
CREATE TABLE inactive_sale_approvals (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash)=64),
 executor_id TEXT NOT NULL, session_id TEXT NOT NULL, company_id TEXT NOT NULL, unit_id TEXT NOT NULL,
 request_id TEXT NOT NULL, fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 product_snapshot_json TEXT NOT NULL CHECK(json_valid(product_snapshot_json)),
 authorizer_id TEXT NOT NULL, authorizer_name TEXT NOT NULL,
 authorizer_roles_json TEXT NOT NULL CHECK(json_valid(authorizer_roles_json) AND json_type(authorizer_roles_json)='array'),
 authorizer_hash_digest TEXT NOT NULL CHECK(length(authorizer_hash_digest)=64),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 500), created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
 consumed_at TEXT, sale_id TEXT,
 CHECK((consumed_at IS NULL AND sale_id IS NULL) OR consumed_at IS NOT NULL),
 FOREIGN KEY(executor_id,company_id,unit_id) REFERENCES unit_memberships(user_id,company_id,unit_id),
 FOREIGN KEY(authorizer_id,company_id,unit_id) REFERENCES unit_memberships(user_id,company_id,unit_id),
 FOREIGN KEY(session_id) REFERENCES sessions(id)
) STRICT;
CREATE INDEX inactive_grants_by_session ON inactive_sale_approvals(session_id,expires_at,consumed_at);
