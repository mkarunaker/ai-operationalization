# Local SQLite backup and restore

## Scope

The application database is local, ignored by Git, and normally located at `data/ai-editorial-board.sqlite`. Back up the database before migrations and before material editorial work. Do not copy a live SQLite file with Finder or a raw shell copy while the application may be writing; use SQLite's `VACUUM INTO` command to create a consistent snapshot.

## Create a backup

Stop the application first when practical. From the repository root, choose a new backup filename and run:

```bash
mkdir -p data/backups
node --input-type=module -e 'import { DatabaseSync } from "node:sqlite"; const db = new DatabaseSync("data/ai-editorial-board.sqlite"); db.exec("VACUUM INTO '\''data/backups/ai-editorial-board-YYYYMMDDTHHMMSS.sqlite'\''"); db.close();'
chmod 600 data/backups/ai-editorial-board-YYYYMMDDTHHMMSS.sqlite
```

Never overwrite an existing backup. The `data/` directory, including backups, is ignored by Git.

For the same owner-only backup, integrity, and restore-copy verification used by the remediation checkpoint, run:

```bash
npm run db:backup
```

It uses the configured local database path, creates a timestamped backup beside it in `backups/`, verifies `PRAGMA integrity_check`, opens a temporary restore copy, and removes only that temporary copy.

## Verify a backup

Open the backup read-only and confirm integrity before relying on it:

```bash
node --input-type=module -e 'import { DatabaseSync } from "node:sqlite"; const db = new DatabaseSync("data/backups/ai-editorial-board-YYYYMMDDTHHMMSS.sqlite", { readOnly: true }); console.log(db.prepare("PRAGMA integrity_check").get()); console.log(db.prepare("SELECT COUNT(*) AS idea_count FROM ideas").get()); db.close();'
```

The integrity result must be `ok`.

## Restore safely

1. Stop the application.
2. Make a fresh backup of the current database first.
3. Restore only after verifying the intended backup with the command above.
4. Copy the backup to a separate replacement path and open it with the application only after confirming it contains the intended ideas and publications.

Do not delete the current database as part of a restore. Retain it until the restored copy has been validated.

## Milestone 0 verified backup

On 2026-08-06, the application created and verified:

`data/backups/ai-editorial-board-m0-20260806T132000.sqlite`

It has owner-only permissions, passes `PRAGMA integrity_check`, contains six ideas and two publication records, and includes migrations 001–004.
