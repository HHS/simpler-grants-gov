-- Migration to add the user table to the analytics database
-- This table stores basic user information for analytics purposes

CREATE TABLE IF NOT EXISTS "user"
(
    user_id    UUID                     NOT NULL
        PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on created_at for performance when querying by date ranges
CREATE INDEX IF NOT EXISTS user_created_at_idx
    ON "user" (created_at);

-- Create index on updated_at for performance when querying by date ranges  
CREATE INDEX IF NOT EXISTS user_updated_at_idx
    ON "user" (updated_at);
