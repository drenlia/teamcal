import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  initializeDatabase,
  dbPath,
  mapTeamRow,
  getTeamColors,
  pickAvailableColorIndex,
  TEAM_COLOR_PALETTE,
} from './db.js';
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  generateId,
  hashPassword,
  verifyPassword,
  sessionExpiryDate,
  createAuthMiddleware,
  requireAdmin,
  getSessionUser,
  parseSessionCookie,
  isDemoMode,
  getDemoAdminCredentials,
} from './auth.js';
import { getDemoMemberLogins, DEMO_MEMBER_PASSWORD } from './demoSeed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const distPath = join(__dirname, '../../dist');

const db = await initializeDatabase();
const app = express();
const requireAuth = createAuthMiddleware(db);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'An unexpected error occurred',
    details: err.message,
  });
});

// --- Public config ---

app.get('/api/config', (req, res) => {
  const demoMode = isDemoMode();
  const config = { demoMode };
  if (demoMode) {
    const demoAdmin = getDemoAdminCredentials();
    if (demoAdmin) {
      config.demoAdmin = demoAdmin;
    }
    config.demoMembers = getDemoMemberLogins();
    config.demoMemberPassword = DEMO_MEMBER_PASSWORD;
  }
  res.json(config);
});

// --- Auth routes (public) ---

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db
      .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
      .get(username.trim());
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const sessionId = generateId();
    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
      sessionId,
      user.id,
      sessionExpiryDate()
    );

    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      teamId: user.team_id ?? null,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = parseSessionCookie(req);
  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const sessionId = parseSessionCookie(req);
  const user = getSessionUser(db, sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(user);
});

// --- Protected routes ---

app.get('/api/teams', requireAuth, (req, res, next) => {
  try {
    const teams = db.prepare('SELECT * FROM teams ORDER BY name COLLATE NOCASE').all();
    const mapped = teams.map((team) => mapTeamRow(db, team));
    const visible =
      req.user.role === 'admin' ? mapped : mapped.filter((team) => team.listed);
    res.json(visible);
  } catch (error) {
    next(error);
  }
});

app.post('/api/teams', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { id, name } = req.body;
    if (!id || !name?.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    db.prepare(
      `INSERT INTO teams (id, name, colorIndex, bgColor, borderColor, textColor)
       VALUES (?, ?, NULL, NULL, NULL, NULL)`
    ).run(id, name.trim());

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    res.status(201).json(mapTeamRow(db, team));
  } catch (error) {
    next(error);
  }
});

app.put('/api/teams/:id/credentials', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password, role, listed } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const trimmedUsername = username.trim();
    const existingUser = db.prepare('SELECT id, password_hash FROM users WHERE team_id = ?').get(id);
    if (!existingUser && !password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    const duplicate = db
      .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?')
      .get(trimmedUsername, existingUser?.id ?? '');
    if (duplicate) {
      return res.status(409).json({ error: 'Username already in use' });
    }

    const passwordHash = password ? await hashPassword(password) : null;
    const listedValue = listed === false ? 0 : 1;

    const assignColors = () => {
      const colorIndex = pickAvailableColorIndex(db);
      const colors = TEAM_COLOR_PALETTE[colorIndex];
      db.prepare(
        `UPDATE teams SET colorIndex = ?, bgColor = ?, borderColor = ?, textColor = ? WHERE id = ?`
      ).run(colorIndex, colors.bg, colors.border, colors.text, id);
    };

    if (existingUser) {
      if (passwordHash) {
        db.prepare(
          `UPDATE users SET username = ?, password_hash = ?, role = ?, listed = ? WHERE team_id = ?`
        ).run(trimmedUsername, passwordHash, role, listedValue, id);
      } else {
        db.prepare(
          `UPDATE users SET username = ?, role = ?, listed = ? WHERE team_id = ?`
        ).run(trimmedUsername, role, listedValue, id);
      }
      if (team.colorIndex == null) assignColors();
    } else {
      db.prepare(
        `INSERT INTO users (id, username, password_hash, role, team_id, listed) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(generateId(), trimmedUsername, passwordHash, role, id, listedValue);
      assignColors();
    }

    const updated = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    res.json(mapTeamRow(db, updated));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/teams/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    db.prepare('DELETE FROM users WHERE team_id = ?').run(id);
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/events', requireAuth, (req, res, next) => {
  try {
    const events = db.prepare('SELECT * FROM events').all();
    res.json(
      events
        .map((event) => {
          const teamColors = getTeamColors(db, event.teamId);
          if (!teamColors) return null;
          return {
            id: event.id,
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            employeeId: event.teamId,
            backgroundColor: teamColors.bg,
            borderColor: teamColors.border,
            textColor: teamColors.text,
          };
        })
        .filter(Boolean)
    );
  } catch (error) {
    next(error);
  }
});

app.post('/api/events', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { id, title, description, start, end, employeeId } = req.body;
    if (!id || !title || !start || !end || !employeeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(employeeId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    db.prepare(
      `INSERT INTO events (id, title, description, start, end, teamId)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, title, description ?? null, start, end, employeeId);

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.put('/api/events/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const { start, end, description } = req.body;
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    db.prepare('UPDATE events SET start = ?, end = ?, description = ? WHERE id = ?').run(
      start,
      end,
      description ?? null,
      id
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/events/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

if (isProduction && existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 3111;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Database initialized at ${dbPath}`);
});
