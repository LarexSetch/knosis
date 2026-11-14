-- Initialize Apache AGE extension for knosis
CREATE EXTENSION IF NOT EXISTS age;
LOAD 'age';

-- Set search_path so ag_catalog functions and types are available
SET search_path = ag_catalog, "$user", public;
ALTER DATABASE knosis SET search_path = ag_catalog, "$user", public;

-- Create default graph for knosis
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = 'knosis_graph') THEN
        PERFORM create_graph('knosis_graph');
        RAISE NOTICE 'Graph knosis_graph created successfully';
    ELSE
        RAISE NOTICE 'Graph knosis_graph already exists';
    END IF;
END $$;
