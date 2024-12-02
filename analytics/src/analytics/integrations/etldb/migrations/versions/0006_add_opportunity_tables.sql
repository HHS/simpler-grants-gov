CREATE TABLE IF NOT EXISTS lk_opportunity_status
(
    opportunity_status_id SERIAL
        PRIMARY KEY,
    description           TEXT                                   NOT NULL,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE lk_opportunity_status
    OWNER TO app;


CREATE TABLE IF NOT EXISTS opportunity
(
    opportunity_id          BIGSERIAL
        primary key,
    opportunity_number      TEXT,
    opportunity_title       TEXT,
    agency_code             TEXT,
    category_explanation    TEXT,
    is_draft                BOOLEAN,
    revision_number         INTEGER,
    modified_comments       TEXT,
    publisher_user_id       TEXT,
    publisher_profile_id    BIGINT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE opportunity
    OWNER TO app;

CREATE INDEX IF NOT EXISTS opportunity_is_draft_idx
    ON opportunity (is_draft);

CREATE INDEX IF NOT EXISTS opportunity_opportunity_title_idx
    ON opportunity (opportunity_title);

CREATE INDEX IF NOT EXISTS opportunity_agency_code_idx
    ON opportunity (agency_code);


CREATE TABLE IF NOT EXISTS opportunity_summary
(
    opportunity_summary_id            BIGSERIAL
        PRIMARY KEY,
    opportunity_id                    BIGINT                                 NOT NULL
        CONSTRAINT opportunity_summary_opportunity_id_opportunity_fkey
            REFERENCES opportunity,
    summary_description               TEXT,
    is_cost_sharing                   BOOLEAN,
    is_forecast                       BOOLEAN                                NOT NULL,
    post_date                         DATE,
    close_date                        DATE,
    close_date_description            TEXT,
    archive_date                      DATE,
    unarchive_date                    DATE,
    expected_number_of_awards         BIGINT,
    estimated_total_program_funding   BIGINT,
    award_floor                       BIGINT,
    award_ceiling                     BIGINT,
    additional_info_url               TEXT,
    additional_info_url_description   TEXT,
    forecasted_post_date              DATE,
    forecasted_close_date             DATE,
    forecasted_close_date_description TEXT,
    forecasted_award_date             DATE,
    forecasted_project_start_date     DATE,
    fiscal_year                       INTEGER,
    revision_number                   INTEGER,
    modification_comments             TEXT,
    funding_category_description      TEXT,
    applicant_eligibility_description TEXT,
    agency_code                       TEXT,
    agency_name                       TEXT,
    agency_phone_number               TEXT,
    agency_contact_description        TEXT,
    agency_email_address              TEXT,
    agency_email_address_description  TEXT,
    is_deleted                        BOOLEAN,
    can_send_mail                     BOOLEAN,
    publisher_profile_id              BIGINT,
    publisher_user_id                 TEXT,
    updated_by                        TEXT,
    created_by                        TEXT,
    created_at                        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at                        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    version_number                    INTEGER,
    CONSTRAINT opportunity_summary_is_forecast_uniq
        UNIQUE (is_forecast, revision_number, opportunity_id)
);

ALTER TABLE opportunity_summary
    OWNER TO app;

CREATE INDEX IF NOT EXISTS opportunity_summary_opportunity_id_idx
    ON opportunity_summary (opportunity_id);


CREATE TABLE IF NOT EXISTS  current_opportunity_summary
(
    opportunity_id         BIGINT                                 NOT NULL
        CONSTRAINT current_opportunity_summary_opportunity_id_opportunity_fkey
            REFERENCES  opportunity,
    opportunity_summary_id BIGINT                                 NOT NULL
        CONSTRAINT current_opportunity_summary_opportunity_summary_id_oppo_8251
            REFERENCES  opportunity_summary,
    opportunity_status_id  INTEGER                                NOT NULL
        CONSTRAINT current_opportunity_summary_opportunity_status_id_lk_op_3147
            REFERENCES  lk_opportunity_status,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (opportunity_id, opportunity_summary_id)
);

ALTER TABLE  current_opportunity_summary
    OWNER TO app;

CREATE INDEX IF NOT EXISTS current_opportunity_summary_opportunity_id_idx
    ON  current_opportunity_summary (opportunity_id);

CREATE INDEX IF NOT EXISTS current_opportunity_summary_opportunity_status_id_idx
    ON  current_opportunity_summary (opportunity_status_id);

CREATE INDEX IF NOT EXISTS current_opportunity_summary_opportunity_summary_id_idx
    ON  current_opportunity_summary (opportunity_summary_id);
