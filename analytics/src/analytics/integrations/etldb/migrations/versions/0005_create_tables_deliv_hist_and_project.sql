CREATE TABLE IF NOT EXISTS gh_project (
	id SERIAL PRIMARY KEY,
	ghid INTEGER UNIQUE NOT NULL,
	name TEXT NOT NULL,
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS gh_sprint ADD COLUMN IF NOT EXISTS project_id INTEGER;

CREATE TABLE IF NOT EXISTS gh_deliverable_history (
	id SERIAL PRIMARY KEY,
	deliverable_id INTEGER NOT NULL,
	status TEXT,
	d_effective DATE NOT NULL,
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(deliverable_id, d_effective)
);
CREATE INDEX IF NOT EXISTS gh_dh_i1 on gh_deliverable_history(deliverable_id, d_effective);

