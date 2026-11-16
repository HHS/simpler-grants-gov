-- Drupal 11 requires pg_trgm on PostgreSQL. In AWS the database role manager
-- installs it, so the Drupal user never needs superuser rights. Do the same
-- locally when the database volume is first created.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
