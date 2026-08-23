# Backup / Restore Runbook

> **Why this exists:** Phase 8's pre-launch checklist (`plan-execution-claude-code.md`) requires a *tested* backup restore before onboarding real pilots — "a backup exists" is not the same claim as "a backup works." This is that test, written so it's a checklist to follow rather than something to figure out live in the Supabase dashboard.
>
> **Update `PROGRESS.md`** (Known Issues + Phase 8 row) once you've run this for the first time.

---

## 0. Ground rule: never restore onto the live project

Fidoo currently has one Supabase project — there is no separate staging environment. A restore operation replaces data, so it must never be pointed at the production project. Everything below restores into a **throwaway scratch project** instead, which you delete afterward. This proves the backup is valid without any risk to real data.

## 1. Check what your plan tier actually gives you

1. Supabase dashboard → your Fidoo project → **Settings → Add-ons → Backups** (or **Database → Backups**, the exact location has moved between Supabase versions).
2. Note down:
   - **Backup type**: daily logical backups (Free/Pro) vs. Point-in-Time Recovery / PITR (Pro+ with the add-on).
   - **Retention window**: how many days back you can actually restore from.
3. If you're on the Free tier, backups may be minimal or unavailable — if so, this runbook still works using a manual `pg_dump` (step 2 fallback) instead of Supabase's restore UI.

## 2. Get a copy of the data

**If Supabase backups are available:**
1. Dashboard → **Backups** → pick the most recent daily backup (or a PITR timestamp).
2. Use the dashboard's **Download** option if offered, or follow Supabase's restore-to-new-project flow if that's what your plan exposes.

**Fallback (works on any tier), from your machine:**
```bash
# DIRECT_URL from .env — the non-pooled connection, required for pg_dump
pg_dump "$DIRECT_URL" --format=custom --file=fidoo-backup-test.dump
```

## 3. Restore into a throwaway project

1. Create a new, temporary Supabase project (any name like `fidoo-restore-test`, Free tier is fine).
2. Get its `DIRECT_URL` connection string from Settings → Database.
3. Restore:
   ```bash
   pg_restore --clean --if-exists --no-owner --dbname="$SCRATCH_DIRECT_URL" fidoo-backup-test.dump
   ```
   (If you downloaded a Supabase-native backup instead of using `pg_dump`, follow the import steps Supabase's UI gives you for that file instead.)

## 4. Verify the restore actually worked

Don't just check that the command exited 0 — confirm the data is real and complete:

```sql
select count(*) from establishments;
select count(*) from customers;
select count(*) from events;
select count(*) from staff_members;
select count(*) from audit_logs;
```

Compare row counts against what you'd expect from the source project at backup time (roughly — some drift is fine if the backup isn't from this exact minute).

**Also check RLS came through**, since a raw `pg_dump`/`pg_restore` can silently drop policies depending on flags used:
```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- rowsecurity should be true for establishments, establishment_users, customers,
-- events, staff_members, audit_logs

select polname, tablename from pg_policies where schemaname = 'public';
-- should list the same policies as in prisma/migrations/*/migration.sql
```

If RLS or policies are missing, re-run the relevant `migration.sql` files against the scratch project before trusting the restore — or better, note that your restore process needs to include migrations replay, not just data.

## 5. Clean up

Delete the scratch Supabase project once verified. Delete the local `.dump` file if it contains real customer data (it will, once this is run against production) — it's equivalent to an unencrypted copy of the customers table, treat it accordingly and never commit it.

## 6. Record the result

Update `PROGRESS.md`:
- Phase 8 tracker row: note the date this was last verified.
- Known Issues: remove "No tested Supabase backup/restore" (or update its date) once done.
- If anything above didn't work as described (wrong menu location, missing tier feature, RLS didn't survive), note the actual behavior — this file should reflect what Supabase does today, not what it did when this was written.
