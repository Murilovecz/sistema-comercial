INSERT INTO permissions(code,description) VALUES('users.reset_password','Redefinir acesso de usuários da empresa');
CREATE TABLE reset_permission_upgrade (
 company_id TEXT NOT NULL, role_id TEXT NOT NULL, granted_at TEXT NOT NULL, audited_at TEXT,
 PRIMARY KEY(company_id,role_id), FOREIGN KEY(company_id,role_id) REFERENCES roles(company_id,id)
) STRICT;
INSERT INTO reset_permission_upgrade(company_id,role_id,granted_at)
SELECT company_id,role_id,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM role_permissions
WHERE permission_code IN ('catalog.view','catalog.manage','inventory.view','inventory.adjust','sales.view','sales.create','sales.cancel','sales.authorize_inactive','purchases.manage','financial.view','financial.manage','cash.manage','operations.view','operations.manage','users.manage','roles.manage','companies.manage','units.manage','audit.view')
GROUP BY company_id,role_id HAVING count(DISTINCT permission_code)=19;
INSERT INTO role_permissions(company_id,role_id,permission_code)
SELECT company_id,role_id,'users.reset_password' FROM reset_permission_upgrade;
CREATE TABLE password_reset_grants (
 id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE CHECK(length(code_hash)=64),
 user_id TEXT NOT NULL, executor_id TEXT NOT NULL, company_id TEXT NOT NULL, unit_id TEXT NOT NULL,
 disabled_hash_digest TEXT NOT NULL CHECK(length(disabled_hash_digest)=64),
 created_at TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT, revoked_at TEXT,
 FOREIGN KEY(user_id,company_id,unit_id) REFERENCES unit_memberships(user_id,company_id,unit_id),
 FOREIGN KEY(executor_id,company_id,unit_id) REFERENCES unit_memberships(user_id,company_id,unit_id)
) STRICT;
CREATE INDEX password_resets_by_user ON password_reset_grants(user_id,revoked_at,consumed_at);
CREATE INDEX password_resets_by_expiry ON password_reset_grants(expires_at,consumed_at);
CREATE INDEX inactive_grants_by_expiry ON inactive_sale_approvals(expires_at,consumed_at);
