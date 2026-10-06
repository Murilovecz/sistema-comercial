CREATE TABLE legal_entities (
    organization_id TEXT NOT NULL,
    id TEXT NOT NULL,
    legal_type TEXT NOT NULL,
    identity_ref TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROVISIONED',
    created_at TEXT NOT NULL,
    created_by TEXT,
    creation_provenance TEXT NOT NULL,
    creation_evidence_ref TEXT NOT NULL,
    creation_audit_id TEXT NOT NULL,

    CONSTRAINT legal_entities_pk PRIMARY KEY (organization_id, id),
    CONSTRAINT legal_entities_global_id UNIQUE (id),
    CONSTRAINT legal_entities_id_not_empty CHECK (length(trim(id)) > 0),
    CONSTRAINT legal_entities_type CHECK (legal_type IN ('PF', 'PJ')),
    CONSTRAINT legal_entities_identity_ref_not_empty
        CHECK (length(trim(identity_ref)) > 0),
    CONSTRAINT legal_entities_status
        CHECK (status IN ('PROVISIONED', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
    CONSTRAINT legal_entities_created_at_not_empty
        CHECK (length(trim(created_at)) > 0),
    CONSTRAINT legal_entities_creation_provenance
        CHECK (creation_provenance IN ('USER', 'TECHNICAL')),
    CONSTRAINT legal_entities_user_creation_has_actor
        CHECK (creation_provenance <> 'USER' OR created_by IS NOT NULL),
    CONSTRAINT legal_entities_creation_evidence_not_empty
        CHECK (length(trim(creation_evidence_ref)) > 0),

    CONSTRAINT legal_entities_organization_fk
        FOREIGN KEY (organization_id) REFERENCES companies(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT legal_entities_creator_fk
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT legal_entities_creation_audit_fk
        FOREIGN KEY (creation_audit_id) REFERENCES audit_events(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) STRICT, WITHOUT ROWID;

CREATE TRIGGER legal_entities_insert_guard
BEFORE INSERT ON legal_entities
BEGIN
    SELECT RAISE(ABORT, 'LEGAL_NOT_PROVISIONED')
    WHERE NEW.status <> 'PROVISIONED';

    SELECT RAISE(ABORT, 'LEGAL_ID_ALREADY_EXISTS')
    WHERE EXISTS (SELECT 1 FROM legal_entities WHERE id = NEW.id);
END;

CREATE TRIGGER legal_entities_no_update
BEFORE UPDATE ON legal_entities
BEGIN
    SELECT RAISE(ABORT, 'LEGAL_CANDIDATE_IMMUTABLE');
END;

CREATE TRIGGER legal_entities_no_delete
BEFORE DELETE ON legal_entities
BEGIN
    SELECT RAISE(ABORT, 'LEGAL_CANDIDATE_IMMUTABLE');
END;
