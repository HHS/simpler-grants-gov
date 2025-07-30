-- Migration to update opportunity tables to use UUID primary keys
-- This migration handles foreign key constraints properly by dropping and recreating them

-- Step 0: Truncate all table data to support column changes
TRUNCATE TABLE lk_opportunity_status CASCADE;
TRUNCATE TABLE lk_opportunity_category CASCADE;
TRUNCATE TABLE opportunity CASCADE;
TRUNCATE TABLE opportunity_summary CASCADE;
TRUNCATE TABLE current_opportunity_summary CASCADE;
TRUNCATE TABLE user_saved_opportunity CASCADE;
TRUNCATE TABLE user_saved_search CASCADE;

-- Step 1: Drop foreign key constraints that reference the tables we need to modify
ALTER TABLE IF EXISTS current_opportunity_summary 
    DROP CONSTRAINT IF EXISTS current_opportunity_summary_opportunity_id_opportunity_fkey;

ALTER TABLE IF EXISTS current_opportunity_summary 
    DROP CONSTRAINT IF EXISTS current_opportunity_summary_opportunity_summary_id_oppo_8251;

ALTER TABLE IF EXISTS user_saved_opportunity 
    DROP CONSTRAINT IF EXISTS user_saved_opportunity_opportunity_id_opportunity_fkey;

ALTER TABLE IF EXISTS opportunity_summary 
    DROP CONSTRAINT IF EXISTS opportunity_summary_opportunity_id_opportunity_fkey;

-- Step 2: Drop indexes that will be recreated
DROP INDEX IF EXISTS opportunity_summary_opportunity_id_idx;
DROP INDEX IF EXISTS current_opportunity_summary_opportunity_id_idx;
DROP INDEX IF EXISTS current_opportunity_summary_opportunity_summary_id_idx;

-- Step 3: Convert opportunity table primary key from BIGSERIAL to UUID
-- Also add missing legacy_opportunity_id column
ALTER TABLE opportunity ADD COLUMN IF NOT EXISTS legacy_opportunity_id BIGINT;
ALTER TABLE opportunity ALTER COLUMN opportunity_id DROP DEFAULT;
ALTER TABLE opportunity ALTER COLUMN opportunity_id TYPE UUID USING opportunity_id::text::UUID;

-- Step 4: Convert opportunity_summary primary key and foreign key
-- Also add missing legacy_opportunity_id column
ALTER TABLE opportunity_summary ADD COLUMN IF NOT EXISTS legacy_opportunity_id BIGINT;
ALTER TABLE opportunity_summary ALTER COLUMN opportunity_summary_id DROP DEFAULT;
ALTER TABLE opportunity_summary ALTER COLUMN opportunity_summary_id TYPE UUID USING opportunity_summary_id::text::UUID;
ALTER TABLE opportunity_summary ALTER COLUMN opportunity_id TYPE UUID USING opportunity_id::text::UUID;

-- Step 5: Convert current_opportunity_summary foreign keys
ALTER TABLE current_opportunity_summary ALTER COLUMN opportunity_id TYPE UUID USING opportunity_id::text::UUID;
ALTER TABLE current_opportunity_summary ALTER COLUMN opportunity_summary_id TYPE UUID USING opportunity_summary_id::text::UUID;

-- Step 6: Convert user_saved_opportunity foreign key and add missing columns
ALTER TABLE user_saved_opportunity ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
ALTER TABLE user_saved_opportunity ALTER COLUMN opportunity_id TYPE UUID USING opportunity_id::text::UUID;

-- Step 7: Convert user_saved_search array column and add missing columns
ALTER TABLE user_saved_search ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
ALTER TABLE user_saved_search 
    ALTER COLUMN searched_opportunity_ids TYPE UUID[] USING searched_opportunity_ids::text[]::UUID[];

-- Step 8: Recreate foreign key constraints
ALTER TABLE opportunity_summary 
    ADD CONSTRAINT opportunity_summary_opportunity_id_opportunity_fkey 
    FOREIGN KEY (opportunity_id) REFERENCES opportunity(opportunity_id);

ALTER TABLE current_opportunity_summary 
    ADD CONSTRAINT current_opportunity_summary_opportunity_id_opportunity_fkey 
    FOREIGN KEY (opportunity_id) REFERENCES opportunity(opportunity_id);

ALTER TABLE current_opportunity_summary 
    ADD CONSTRAINT current_opportunity_summary_opportunity_summary_id_oppo_8251 
    FOREIGN KEY (opportunity_summary_id) REFERENCES opportunity_summary(opportunity_summary_id);

ALTER TABLE user_saved_opportunity 
    ADD CONSTRAINT user_saved_opportunity_opportunity_id_opportunity_fkey 
    FOREIGN KEY (opportunity_id) REFERENCES opportunity(opportunity_id);

-- Step 9: Recreate indexes
CREATE INDEX IF NOT EXISTS opportunity_summary_opportunity_id_idx
    ON opportunity_summary (opportunity_id);

CREATE INDEX IF NOT EXISTS current_opportunity_summary_opportunity_id_idx
    ON current_opportunity_summary (opportunity_id);

CREATE INDEX IF NOT EXISTS current_opportunity_summary_opportunity_summary_id_idx
    ON current_opportunity_summary (opportunity_summary_id);

-- Step 10: Update the unique constraint in opportunity_summary to match the new schema
-- (Remove revision_number from the constraint as it's not in the API model)
ALTER TABLE opportunity_summary 
    DROP CONSTRAINT IF EXISTS opportunity_summary_is_forecast_uniq;

ALTER TABLE opportunity_summary 
    ADD CONSTRAINT opportunity_summary_is_forecast_uniq 
    UNIQUE (is_forecast, opportunity_id);
