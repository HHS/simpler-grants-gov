CREATE TABLE IF NOT EXISTS user_saved_opportunity
(
user_id             UUID                                                                                       NOT NULL,
opportunity_id      BIGINT                                                                                     NOT NULL
        CONSTRAINT user_saved_opportunity_opportunity_id_opportunity_fkey
            REFERENCES opportunity,
    created_at          TIMESTAMP WITH TIME ZONE                                                               NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE                                                               NOT NULL,
    last_notified_at    TIMESTAMP WITH TIME ZONE                                                               NOT NULL,
    PRIMARY KEY (user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS user_saved_search
(
    saved_search_id          UUID                                   NOT NULL
        PRIMARY KEY,
    user_id                  UUID                                   NOT NULL,
    search_query             JSONB                                  NOT NULL,
    name                     TEXT                                   NOT NULL,
    created_at               TIMESTAMP WITH TIME ZONE               NOT NULL,
    updated_at               TIMESTAMP WITH TIME ZONE               NOT NULL,
    last_notified_at         TIMESTAMP WITH TIME ZONE               NOT NULL,
    searched_opportunity_ids BIGINT[]                               NOT NULL
);

CREATE INDEX IF NOT EXISTS user_saved_search_user_id_idx
    on user_saved_search (user_id);