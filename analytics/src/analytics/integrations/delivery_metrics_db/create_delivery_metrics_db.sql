# create tables

CREATE TABLE IF NOT EXISTS gh_deliverable (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	guid TEXT UNIQUE NOT NULL,
	title TEXT NOT NULL,
	pillar TEXT, 
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS gh_deliverable_quad_map (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	deliverable_id INTEGER NOT NULL,
	quad_id INTEGER,
	d_effective DATE NOT NULL,
	t_modified TIMESTAMP,
	UNIQUE(deliverable_id, d_effective)
);
CREATE INDEX IF NOT EXISTS dqm_i1 on gh_deliverable_quad_map(quad_id, d_effective);

CREATE TABLE IF NOT EXISTS gh_epic (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	guid TEXT UNIQUE NOT NULL,
	title TEXT NOT NULL,
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS gh_epic_deliverable_map (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	epic_id INTEGER NOT NULL,
	deliverable_id INTEGER,
	d_effective DATE NOT NULL,
	t_modified TIMESTAMP,
	UNIQUE(epic_id, d_effective)
);
CREATE INDEX IF NOT EXISTS edm_i1 on gh_epic_deliverable_map(deliverable_id, d_effective);

CREATE TABLE IF NOT EXISTS gh_issue (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	guid TEXT UNIQUE NOT NULL,
	title TEXT NOT NULL,
	type TEXT NOT NULL,
	opened_date DATE,
	closed_date DATE,
	parent_issue_guid TEXT,
	epic_id INTEGER,
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP 
);
CREATE INDEX IF NOT EXISTS issue_i1 on gh_issue(epic_id);

CREATE TABLE IF NOT EXISTS gh_issue_history (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	issue_id INTEGER NOT NULL,
	status TEXT,
	is_closed INTEGER NOT NULL,
	points INTEGER NOT NULL DEFAULT 0,
	d_effective DATE NOT NULL,
	t_modified TIMESTAMP,
	UNIQUE(issue_id, d_effective)
);
CREATE INDEX IF NOT EXISTS ih_i1 on gh_issue_history(issue_id, d_effective);

CREATE TABLE IF NOT EXISTS gh_issue_sprint_map (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	issue_id INTEGER NOT NULL,
	sprint_id INTEGER,
	d_effective DATE NOT NULL,
	t_modified TIMESTAMP,
	UNIQUE(issue_id, d_effective)
);

CREATE TABLE IF NOT EXISTS gh_sprint (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	guid TEXT UNIQUE NOT NULL,
	name TEXT NOT NULL,
	start_date DATE,
	end_date DATE,
	duration INTEGER,
	quad_id INTEGER,
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS gh_quad (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	guid TEXT UNIQUE NOT NULL,
	name TEXT NOT NULL,
	start_date DATE,
	end_date DATE,
	duration INTEGER,
	t_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	t_modified TIMESTAMP 
);
CREATE INDEX IF NOT EXISTS quad_i1 on gh_quad(start_date);
 
