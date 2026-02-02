-- Migration to rename the user table to user_data
-- This addresses potential conflicts with reserved keywords in some SQL contexts

-- Rename the table from "user" to user_data
ALTER TABLE "user" RENAME TO user_data;