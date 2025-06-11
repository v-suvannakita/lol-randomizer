const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, '../main_db.txt');
const MATCH_HISTORY_PATH = path.join(__dirname, '../match_history.txt');
const SESSION_PATH = path.join(__dirname, '../session.txt');

app.use(cors());
app.use(express.json());

// Helper: Read DB
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) return [];
  return fs.readFileSync(DB_PATH, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [id, name, overall, top, jungle, mid, adc, sup] = line.split('|');
      return { id, name, overall: +overall, top: +top, jungle: +jungle, mid: +mid, adc: +adc, sup: +sup };
    });
};

// Helper: Write DB
const writeDB = players => {
  fs.writeFileSync(
    DB_PATH,
    players.map(({ id, name, overall, top, jungle, mid, adc, sup }) =>
      [id, name, overall, top, jungle, mid, adc, sup].join('|')
    ).join('\n'),
    'utf-8'
  );
};

// Helper: Read Match History
const readMatchHistory = () => {
  if (!fs.existsSync(MATCH_HISTORY_PATH)) return [];
  return fs.readFileSync(MATCH_HISTORY_PATH, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
};

// Helper: Write Match History (append)
const appendMatchHistory = record => {
  fs.appendFileSync(MATCH_HISTORY_PATH, JSON.stringify(record) + '\n', 'utf-8');
};

// --- API Routes ---

// Get all players
app.get('/api/players', (req, res) => res.json(readDB()));

// Add player
app.post('/api/players', (req, res) => {
  const { name, overall, top, jungle, mid, adc, sup } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const players = readDB();
  const newPlayer = { id: uuidv4(), name, overall, top, jungle, mid, adc, sup };
  players.push(newPlayer);
  writeDB(players);
  res.json(newPlayer);
});

// Edit player
app.put('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const players = readDB();
  const idx = players.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  players[idx] = { ...players[idx], ...req.body };
  writeDB(players);
  res.json(players[idx]);
});

// Delete player
app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const players = readDB().filter(p => p.id !== id);
  writeDB(players);
  res.json({ success: true });
});

// Randomizer endpoint (simple shuffle, split into two teams)
app.post('/api/randomize', (req, res) => {
  const { playerIds } = req.body;
  const players = readDB().filter(p => playerIds.includes(p.id));
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  res.json({ team1: shuffled.slice(0, 5), team2: shuffled.slice(5, 10) });
});

// API: Get match history
app.get('/api/match-history', (req, res) => res.json(readMatchHistory()));

// API: Add match history
app.post('/api/match-history', (req, res) => {
  const { winner, loser, teams, timestamp } = req.body;
  if (
    !winner ||
    !loser ||
    !teams ||
    !Array.isArray(teams.team1) ||
    !Array.isArray(teams.team2)
  ) {
    return res.status(400).json({ error: 'Invalid match data' });
  }
  const record = {
    id: uuidv4(),
    winner,
    loser,
    teams,
    timestamp: timestamp || Date.now()
  };
  appendMatchHistory(record);
  res.json({ success: true, record });
});

// --- Session API ---
app.get('/api/session', (req, res) => {
  if (!fs.existsSync(SESSION_PATH)) return res.status(404).end();
  try {
    res.json(JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8')));
  } catch {
    res.status(500).json({ error: 'Failed to read session' });
  }
});

app.post('/api/session', (req, res) => {
  try {
    fs.writeFileSync(SESSION_PATH, JSON.stringify(req.body), 'utf-8');
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.delete('/api/session', (req, res) => {
  try {
    if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
