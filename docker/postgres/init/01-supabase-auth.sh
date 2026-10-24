#!/bin/sh
# Local only: prepares this plain Postgres for the Supabase Auth container, as the
# Supabase Postgres image does (in Supabase's cloud all of this already exists).
# It runs once, when the db volume is created for the first time.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
  -- Auth's migrations grant read access on its tables to the "postgres" role
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
      CREATE ROLE postgres NOLOGIN;
    END IF;
  END \$\$;

  -- Role that Supabase Auth uses to manage the "auth" schema
  CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD '$AUTH_DB_PASSWORD';
  CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
  GRANT CREATE ON DATABASE "$POSTGRES_DB" TO supabase_auth_admin;
  ALTER ROLE supabase_auth_admin SET search_path = auth;
EOSQL
