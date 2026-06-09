import { generateId, hashPassword, isDemoMode } from './auth.js';
import { pickAvailableColorIndex, TEAM_COLOR_PALETTE } from './db.js';

const DEMO_MEMBER_PASSWORD = 'demo';

const DEMO_MEMBERS = [
  { id: 'demo-anna', name: 'Anna', username: 'anna' },
  { id: 'demo-ben', name: 'Ben', username: 'ben' },
  { id: 'demo-carlos', name: 'Carlos', username: 'carlos' },
  { id: 'demo-diana', name: 'Diana', username: 'diana' },
  { id: 'demo-emma', name: 'Emma', username: 'emma' },
];

/** @param {number} year @param {number} month 1–12 @param {number} day @param {number} hour @param {number} minute */
function toISO(year, month, day, hour, minute) {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function getScheduleWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** @param {Date} from @param {Date} to */
function* eachDay(from, to) {
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(to);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    yield new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {typeof DEMO_MEMBERS} members
 */
function insertMembers(db, members, passwordHash) {
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, colorIndex, bgColor, borderColor, textColor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, team_id, listed)
    VALUES (?, ?, ?, 'member', ?, 1)
  `);

  for (const member of members) {
    const colorIndex = pickAvailableColorIndex(db);
    const colors = TEAM_COLOR_PALETTE[colorIndex];
    insertTeam.run(
      member.id,
      member.name,
      colorIndex,
      colors.bg,
      colors.border,
      colors.text
    );
    insertUser.run(generateId(), member.username, passwordHash, member.id);
  }
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {typeof DEMO_MEMBERS} members
 */
function insertShifts(db, members) {
  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, description, start, end, teamId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const { start, end } = getScheduleWindow();
  let dayIndex = 0;

  const addShift = (member, startISO, endISO, description) => {
    insertEvent.run(generateId(), member.name, description, startISO, endISO, member.id);
  };

  for (const day of eachDay(start, end)) {
    const year = day.getFullYear();
    const month = day.getMonth() + 1;
    const date = day.getDate();
    const weekday = day.getDay();

    const primary = members[dayIndex % members.length];
    const secondary = members[(dayIndex + 1) % members.length];
    const tertiary = members[(dayIndex + 2) % members.length];
    const overlap = members[(dayIndex + 3) % members.length];

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    addShift(
      primary,
      toISO(year, month, date, 7, 0),
      toISO(year, month, date, 15, 0),
      'Day shift'
    );
    addShift(
      secondary,
      toISO(year, month, date, 15, 0),
      toISO(year, month, date, 23, 0),
      'Evening shift'
    );
    addShift(
      tertiary,
      toISO(year, month, date, 23, 0),
      toISO(nextDay.getFullYear(), nextDay.getMonth() + 1, nextDay.getDate(), 7, 0),
      'Night shift'
    );

    if (weekday >= 1 && weekday <= 5) {
      addShift(
        overlap,
        toISO(year, month, date, 9, 0),
        toISO(year, month, date, 17, 0),
        'Standard shift (overlaps day coverage)'
      );
    }

    if (weekday === 5) {
      const weekend = members[(dayIndex + 4) % members.length];
      const endDay = new Date(day);
      endDay.setDate(endDay.getDate() + 3);
      addShift(
        weekend,
        toISO(year, month, date, 23, 0),
        toISO(endDay.getFullYear(), endDay.getMonth() + 1, endDay.getDate(), 7, 0),
        'Extended weekend coverage'
      );
    }

    dayIndex += 1;
  }
}

/** @param {import('better-sqlite3').Database} db */
export async function seedDemoData(db) {
  if (!isDemoMode()) return;

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM teams').get();
  if (count > 0) return;

  const passwordHash = await hashPassword(DEMO_MEMBER_PASSWORD);

  const seed = db.transaction(() => {
    insertMembers(db, DEMO_MEMBERS, passwordHash);
    insertShifts(db, DEMO_MEMBERS);
  });

  seed();

  const eventCount = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;
  console.log(
    `Demo sample data seeded: ${DEMO_MEMBERS.length} members, ${eventCount} shifts (current and next month).`
  );
  console.log(`  Member login password (all demo users): ${DEMO_MEMBER_PASSWORD}`);
}
