import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'schedule.db');

// Initialize database
function initializeDatabase() {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      colorIndex INTEGER NOT NULL,
      bgColor TEXT NOT NULL,
      borderColor TEXT NOT NULL,
      textColor TEXT NOT NULL
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

  return db;
}

const db = initializeDatabase();
const app = express();

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'An unexpected error occurred',
    details: err.message
  });
});

// Team endpoints
app.get('/api/teams', (req, res, next) => {
  try {
    const teams = db.prepare('SELECT * FROM teams').all();
    res.json(teams.map(team => ({
      id: team.id,
      name: team.name,
      colorIndex: team.colorIndex,
      colors: {
        bg: team.bgColor,
        border: team.borderColor,
        text: team.textColor
      }
    })));
  } catch (error) {
    next(error);
  }
});

app.post('/api/teams', (req, res, next) => {
  const { id, name, colorIndex, colors } = req.body;
  try {
    if (!id || !name || colorIndex === undefined || !colors) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    db.prepare(`
      INSERT INTO teams (id, name, colorIndex, bgColor, borderColor, textColor)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, colorIndex, colors.bg, colors.border, colors.text);
    
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/teams/:id', (req, res, next) => {
  const { id } = req.params;
  try {
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // With ON DELETE CASCADE, we don't need to manually delete events
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Event endpoints
app.get('/api/events', (req, res, next) => {
  try {
    const events = db.prepare('SELECT * FROM events').all();
    const teams = db.prepare('SELECT * FROM teams').all();
    
    const teamMap = new Map(teams.map(team => [team.id, {
      bgColor: team.bgColor,
      borderColor: team.borderColor,
      textColor: team.textColor
    }]));

    res.json(events.map(event => {
      const teamColors = teamMap.get(event.teamId);
      if (!teamColors) {
        return null;
      }
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        employeeId: event.teamId,
        backgroundColor: teamColors.bgColor,
        borderColor: teamColors.borderColor,
        textColor: teamColors.textColor
      };
    }).filter(Boolean));
  } catch (error) {
    next(error);
  }
});

app.post('/api/events', (req, res, next) => {
  const { id, title, description, start, end, employeeId } = req.body;
  try {
    if (!id || !title || !start || !end || !employeeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(employeeId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    db.prepare(`
      INSERT INTO events (id, title, description, start, end, teamId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, description, start, end, employeeId);
    
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.put('/api/events/:id', (req, res, next) => {
  const { id } = req.params;
  const { start, end, description } = req.body;
  try {
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    db.prepare('UPDATE events SET start = ?, end = ?, description = ? WHERE id = ?')
      .run(start, end, description, id);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/events/:id', (req, res, next) => {
  const { id } = req.params;
  try {
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

const port = 3111;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Database initialized at ${dbPath}`);
});
