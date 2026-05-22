#!/bin/bash
# Based on https://github.com/MartinKaburu/docker-postgresql-multiple-databases

set -e
set -u

function create_user_and_database() {
	local database=$(echo $1 | tr ',' ' ' | awk  '{print $1}')
	local owner=$(echo $1 | tr ',' ' ' | awk  '{print $2}')
	echo "  Creating user and database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<EOF
	    DO \$\$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$owner') THEN
          CREATE USER $owner WITH PASSWORD 'secret123';

        END IF;
      END
      \$\$;

      SELECT 'CREATE DATABASE $database' WHERE NOT EXISTS (select from pg_database where datname = '$database')\gexec

      ALTER DATABASE $database OWNER TO $owner
EOF
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ':' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created"
fi