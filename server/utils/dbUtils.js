const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../main_db.txt');
const MATCH_HISTORY_PATH = path.join(__dirname, '../../match_history.txt');

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

// Helper: Read Match History
function readMatchHistory() {
  if (!fs.existsSync(MATCH_HISTORY_PATH)) return [];
  const lines = fs.readFileSync(MATCH_HISTORY_PATH, 'utf-8').split('\n').filter(Boolean);
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// Helper: Write Match History (append)
function appendMatchHistory(record) {
  fs.appendFileSync(MATCH_HISTORY_PATH, JSON.stringify(record) + '\n', 'utf-8');
}

module.exports = {
  readDB,
  writeDB,
  readMatchHistory,
  appendMatchHistory
};
