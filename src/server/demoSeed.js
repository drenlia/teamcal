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

/** @param {Date} a @param {Date} b */
function daysBetween(a, b) {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
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
 * Two members on overlapping multi-day shifts at all times, plus a few one-day shifts.
 * @param {import('better-sqlite3').Database} db
 * @param {typeof DEMO_MEMBERS} members
 */
function insertShifts(db, members) {
  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, description, start, end, teamId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const { start, end } = getScheduleWindow();
  const totalDays = daysBetween(start, end) + 1;

  const addShift = (member, blockStart, blockEnd, startHour, endHour, description) => {
    const sy = blockStart.getFullYear();
    const sm = blockStart.getMonth() + 1;
    const sd = blockStart.getDate();
    const ey = blockEnd.getFullYear();
    const em = blockEnd.getMonth() + 1;
    const ed = blockEnd.getDate();
    insertEvent.run(
      generateId(),
      member.name,
      description,
      toISO(sy, sm, sd, startHour, 0),
      toISO(ey, em, ed, endHour, 0),
      member.id
    );
  };

  let cursor = new Date(start);
  let pairIndex = 0;

  while (cursor <= end) {
    const durationDays = 3 + (pairIndex % 3);
    const memberA = members[pairIndex % members.length];
    const memberB = members[(pairIndex + 1) % members.length];

    const blockStart = new Date(cursor);
    const blockEnd = new Date(blockStart);
    blockEnd.setDate(blockEnd.getDate() + durationDays + 1);

    addShift(memberA, blockStart, blockEnd, 7, 7, `${durationDays + 1}-day coverage`);
    addShift(memberB, blockStart, blockEnd, 19, 19, 'Overlapping coverage');

    cursor = new Date(blockStart);
    cursor.setDate(cursor.getDate() + durationDays + 1);
    pairIndex += 2;
  }

  const oneDayCount = 2 + Math.floor(Math.random() * 2);
  const usedOffsets = new Set();
  while (usedOffsets.size < oneDayCount) {
    usedOffsets.add(Math.floor(Math.random() * totalDays));
  }

  for (const offset of usedOffsets) {
    const day = new Date(start);
    day.setDate(day.getDate() + offset);
    if (day > end) continue;

    const member = members[Math.floor(Math.random() * members.length)];
    addShift(member, day, day, 9, 17, 'One-day shift');
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
