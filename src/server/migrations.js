/** @param {import('better-sqlite3').Database} db */
export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const current = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get();
  const applied = current?.v ?? 0;

  const migrations = [
    {
      version: 1,
      up: () => {
        db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
            team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
          CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
        `);
      },
    },
    {
      version: 2,
      up: () => {
        const teamsInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='teams'").get();
        if (!teamsInfo?.sql?.includes('colorIndex INTEGER NOT NULL')) {
          return;
        }

        db.exec(`
          CREATE TABLE teams_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            colorIndex INTEGER,
            bgColor TEXT,
            borderColor TEXT,
            textColor TEXT
          );

          INSERT INTO teams_new (id, name, colorIndex, bgColor, borderColor, textColor)
          SELECT id, name, colorIndex, bgColor, borderColor, textColor FROM teams;

          DROP TABLE teams;
          ALTER TABLE teams_new RENAME TO teams;
        `);
      },
    },
    {
      version: 3,
      up: () => {
        const usersInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
        if (!usersInfo?.sql || usersInfo.sql.includes('listed')) {
          return;
        }
        db.exec(`ALTER TABLE users ADD COLUMN listed INTEGER NOT NULL DEFAULT 1`);
      },
    },
    {
      version: 4,
      up: () => {
        const usersInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
        if (!usersInfo?.sql || usersInfo.sql.includes('password_plain')) {
          return;
        }
        db.exec(`ALTER TABLE users ADD COLUMN password_plain TEXT`);
      },
    },
    {
      version: 5,
      up: () => {
        const usersInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
        if (!usersInfo?.sql || !usersInfo.sql.includes('password_plain')) {
          return;
        }
        db.exec(`ALTER TABLE users DROP COLUMN password_plain`);
      },
    },
  ];

  for (const migration of migrations) {
    if (migration.version <= applied) continue;
    migration.up();
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version);
    console.log(`Applied migration ${migration.version}`);
  }
}
