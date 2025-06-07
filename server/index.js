const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, '../main_db.txt');

app.use(cors());
app.use(express.json());

// Helper: Read DB
function readDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  const lines = fs.readFileSync(DB_PATH, 'utf-8').split('\n').filter(Boolean);
  return lines.map(line => {
    const [id, name, overall, top, jungle, mid, adc, sup] = line.split('|');
    return { id, name, overall: +overall, top: +top, jungle: +jungle, mid: +mid, adc: +adc, sup: +sup };
  });
}

// Helper: Write DB
function writeDB(players) {
  const lines = players.map(p => [p.id, p.name, p.overall, p.top, p.jungle, p.mid, p.adc, p.sup].join('|'));
  fs.writeFileSync(DB_PATH, lines.join('\n'), 'utf-8');
}

// Get all players
app.get('/api/players', (req, res) => {
  res.json(readDB());
});

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
  let players = readDB();
  players = players.filter(p => p.id !== id);
  writeDB(players);
  res.json({ success: true });
});

// Randomizer endpoint (simplified, implement balancing logic as needed)
app.post('/api/randomize', (req, res) => {
  const { playerIds } = req.body;
  const players = readDB().filter(p => playerIds.includes(p.id));
  // Shuffle and split into two teams
  const shuffled = players.sort(() => Math.random() - 0.5);
  const team1 = shuffled.slice(0, 5);
  const team2 = shuffled.slice(5, 10);
  res.json({ team1, team2 });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
