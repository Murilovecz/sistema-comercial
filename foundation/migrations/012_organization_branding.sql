CREATE TABLE organization_branding (
    organization_id TEXT NOT NULL PRIMARY KEY REFERENCES companies(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
    primary_color TEXT NOT NULL CHECK (instr(primary_color, char(0)) = 0 AND primary_color GLOB '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]'),
    accent_color TEXT NOT NULL CHECK (instr(accent_color, char(0)) = 0 AND accent_color GLOB '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]'),
    theme_mode TEXT NOT NULL CHECK (theme_mode IN ('LIGHT', 'DARK', 'SYSTEM')),
    revision INTEGER NOT NULL CHECK (revision > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    updated_by TEXT NOT NULL REFERENCES users(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) STRICT;
