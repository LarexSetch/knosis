CREATE TABLE IF NOT EXISTS knowledge_import (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document TEXT NOT NULL DEFAULT '',
    status VARCHAR(100) NOT NULL DEFAULT '0',
    ontology_id VARCHAR(255) NOT NULL REFERENCES ontology(id),
    knowledge_id VARCHAR(255) NOT NULL REFERENCES knowledge(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_import_name ON knowledge_import(name);
