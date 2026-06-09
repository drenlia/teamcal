import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runMigrations } from './migrations.js';
import { ensureAdminUser, printAdminCredentials, prepareDemoAdminCredentials } from './auth.js';
import { seedDemoData } from './demoSeed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configuredPath = process.env.DATABASE_PATH;
export const dbPath = configuredPath || join(__dirname, 'schedule.db');

if (configuredPath) {
  mkdirSync(dirname(configuredPath), { recursive: true });
}

export async function initializeDatabase() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      colorIndex INTEGER,
      bgColor TEXT,
      borderColor TEXT,
      textColor TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      teamId TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
    );
  `);

  runMigrations(db);

  const adminCreds = await ensureAdminUser(db);
  if (adminCreds) {
    printAdminCredentials(adminCreds.username, adminCreds.password);
  }
  await prepareDemoAdminCredentials(db, adminCreds);
  await seedDemoData(db);

  return db;
}

export const DEFAULT_EVENT_COLORS = {
  bg: '#F5F5F5',
  border: '#9E9E9E',
  text: '#424242',
};

/** @param {import('better-sqlite3').Database} db @param {string} teamId */
export function getTeamColors(db, teamId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return null;
  if (team.colorIndex == null || !team.bgColor) {
    return DEFAULT_EVENT_COLORS;
  }
  return {
    bg: team.bgColor,
    border: team.borderColor,
    text: team.textColor,
  };
}

/** @param {import('better-sqlite3').Database} db */
export function mapTeamRow(db, team) {
  const user = db
    .prepare('SELECT username, role, listed FROM users WHERE team_id = ? LIMIT 1')
    .get(team.id);

  return {
    id: team.id,
    name: team.name,
    colorIndex: team.colorIndex ?? null,
    colors:
      team.colorIndex != null && team.bgColor
        ? { bg: team.bgColor, border: team.borderColor, text: team.textColor }
        : null,
    hasCredentials: Boolean(user),
    username: user?.username ?? null,
    role: user?.role ?? null,
    listed: !user || user.listed === 1,
  };
}

/** @param {import('better-sqlite3').Database} db */
export function pickAvailableColorIndex(db) {
  const used = new Set(
    db
      .prepare('SELECT colorIndex FROM teams WHERE colorIndex IS NOT NULL')
      .all()
      .map((r) => r.colorIndex)
  );
  const paletteSize = 15;
  for (let i = 0; i < paletteSize; i += 1) {
    if (!used.has(i)) return i;
  }
  return Math.floor(Math.random() * paletteSize);
}

export const TEAM_COLOR_PALETTE = [
  { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' },
  { bg: '#F1F8E9', border: '#8BC34A', text: '#558B2F' },
  { bg: '#FFF3E0', border: '#FF9800', text: '#EF6C00' },
  { bg: '#F3E5F5', border: '#9C27B0', text: '#6A1B9A' },
  { bg: '#E0F2F1', border: '#009688', text: '#00695C' },
  { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  { bg: '#E8EAF6', border: '#3F51B5', text: '#283593' },
  { bg: '#FFF8E1', border: '#FFC107', text: '#FF8F00' },
  { bg: '#E0F7FA', border: '#00BCD4', text: '#00838F' },
  { bg: '#FCE4EC', border: '#E91E63', text: '#AD1457' },
  { bg: '#F5F5F5', border: '#9E9E9E', text: '#424242' },
  { bg: '#EFEBE9', border: '#795548', text: '#4E342E' },
  { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  { bg: '#FFF3E0', border: '#FF5722', text: '#D84315' },
  { bg: '#F3E5F5', border: '#673AB7', text: '#4527A0' },
];
