# Migrations

Schema changes are files in this directory, applied by `prisma migrate deploy`
during the build. They are not generated from the schema at deploy time.

## Why, and what went wrong before

The build used to run `prisma db push`, which compares the schema in the
commit being built against the live database and reshapes the database to
match. That works exactly as long as the deployed branch is never behind the
database — and the moment it is, `db push` reads the difference as "delete
what is extra".

That is not hypothetical. A local build during development pushed two new
tables to the shared database while `main` did not yet have them in its
schema; the next production build of `main` therefore tried to drop a table
with rows in it and refused, and production could not be deployed at all
until the branch was merged. A preview build of any older branch, or a
rollback to an earlier deployment, would have hit the same wall — and a
rollback is the worst possible moment to discover it.

`migrate deploy` only ever applies migrations the database has not seen. It
never infers an intent to drop anything, so a branch whose schema lags behind
simply deploys unchanged.

## Adding a migration

The development database here *is* the production database, so
`prisma migrate dev` is not used — it is allowed to reset the database it is
pointed at. Generate the SQL by diffing instead, then apply it:

```sh
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_short_name

npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel  prisma/schema.prisma \
  --script > prisma/migrations/<the directory you just made>/migration.sql

npx prisma migrate deploy
```

Read the generated SQL before applying it. `migrate diff` will happily write a
`DROP COLUMN` for a field you renamed, and the rename is what you meant.

## 0_init

The baseline. It describes the schema as it stood when migrations were
adopted, and it was marked applied with `prisma migrate resolve --applied`
rather than run — the tables it creates already existed. It is only executed
against a genuinely empty database, such as a fresh local one.
