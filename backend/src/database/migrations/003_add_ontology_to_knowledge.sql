ALTER TABLE knowledge
    ADD COLUMN IF NOT EXISTS ontology_id VARCHAR(255)
    REFERENCES ontology(id);
