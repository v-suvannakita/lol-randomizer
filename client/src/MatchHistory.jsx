import React, { useEffect, useState } from 'react';

function MatchHistory() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetch('/api/match-history')
      .then(res => res.json())
      .then(setHistory);
  }, []);

  // Pagination logic
  const sortedHistory = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const totalPages = Math.ceil(sortedHistory.length / PAGE_SIZE);
  const pagedHistory = sortedHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a1a 0%, #232526 100%)',
      minHeight: '100vh',
      padding: '48px 0',
      fontFamily: 'inherit'
    }}>
      <h2 style={{
        color: '#00ffa3',
        fontWeight: 900,
        fontSize: 38,
        letterSpacing: 2,
        textAlign: 'center',
        textShadow: '0 4px 24px #00ffa366, 0 1px 0 #222',
        marginBottom: 32
      }}>
        Match History
      </h2>
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 28
      }}>
        {pagedHistory.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#aaa',
            padding: 24,
            fontSize: 18,
            background: '#232526',
            borderRadius: 14,
            boxShadow: '0 2px 8px #00ffa322'
          }}>
            No match history yet.
          </div>
        )}
        {pagedHistory.map((h, idx) => (
          <div key={h.id || idx} style={{
            background: '#18191a',
            borderRadius: 18,
            boxShadow: '0 2px 16px #00ffa322',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            border: h.winner === 'team1'
              ? '2px solid #00ffa3'
              : '2px solid #005bea',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18
            }}>
              <div style={{
                fontWeight: 900,
                fontSize: 18,
                color: '#fff',
                letterSpacing: 1
              }}>
                <span style={{
                  color: h.winner === 'team1' ? '#00ffa3' : '#005bea',
                  fontWeight: 900,
                  fontSize: 20,
                  marginRight: 10
                }}>
                  {h.winner === 'team1' ? '🏆 Team 1' : '🏆 Team 2'}
                </span>
                <span style={{
                  color: '#aaa',
                  fontWeight: 700,
                  fontSize: 16,
                  margin: '0 10px'
                }}>
                  vs
                </span>
                <span style={{
                  color: h.loser === 'team1' ? '#00ffa3' : '#005bea',
                  fontWeight: 700,
                  fontSize: 18
                }}>
                  {h.loser === 'team1' ? 'Team 1' : 'Team 2'}
                </span>
              </div>
              <div style={{
                color: '#aaa',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 1
              }}>
                {new Date(h.timestamp).toLocaleString()}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: 32,
              justifyContent: 'center',
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}>
              {/* Team 1 */}
              <div style={{
                flex: 1,
                minWidth: 220,
                background: h.winner === 'team1' ? 'linear-gradient(90deg,#00ffa322,#005bea11)' : 'linear-gradient(90deg,#232526,#232526)',
                borderRadius: 12,
                padding: 16,
                boxShadow: h.winner === 'team1' ? '0 2px 8px #00ffa344' : 'none',
                border: h.winner === 'team1' ? '2px solid #00ffa3' : '2px solid #232526'
              }}>
                <div style={{
                  color: '#00ffa3',
                  fontWeight: 900,
                  fontSize: 18,
                  marginBottom: 10,
                  letterSpacing: 1,
                  textAlign: 'center'
                }}>Team 1</div>
                {h.teams && h.teams.team1 && h.teams.team1.length > 0 ? (
                  <table style={{
                    width: '100%',
                    color: '#fff',
                    fontSize: 15,
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', color: '#00ffa3', fontWeight: 700, padding: 4 }}>Player</th>
                        <th style={{ textAlign: 'center', color: '#00ffa3', fontWeight: 700, padding: 4 }}>Role</th>
                        <th style={{ textAlign: 'center', color: '#00ffa3', fontWeight: 700, padding: 4 }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.teams.team1.map((p, i) => (
                        <tr key={p.id || i}>
                          <td style={{ padding: 4, fontWeight: 700, color: '#fff' }}>{p.name}</td>
                          <td style={{ padding: 4, textAlign: 'center', color: '#00ffa3', fontWeight: 800 }}>{p.assignedRole?.toUpperCase() || ''}</td>
                          <td style={{ padding: 4, textAlign: 'center' }}>
                            <span style={{
                              color: (p.newScore > p.oldScore) ? '#00ffa3' : (p.newScore < p.oldScore) ? '#ff4b4b' : '#fff',
                              fontWeight: 900
                            }}>
                              {p.oldScore}
                              <span style={{
                                margin: '0 4px',
                                fontWeight: 900,
                                fontSize: 16
                              }}>
                                {p.newScore > p.oldScore ? '→' : p.newScore < p.oldScore ? '→' : ''}
                              </span>
                              {p.newScore}
                              {p.newScore > p.oldScore && <span style={{ color: '#00ffa3', marginLeft: 4 }}>↑</span>}
                              {p.newScore < p.oldScore && <span style={{ color: '#ff4b4b', marginLeft: 4 }}>↓</span>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: 8 }}>-</div>
                )}
              </div>
              {/* Team 2 */}
              <div style={{
                flex: 1,
                minWidth: 220,
                background: h.winner === 'team2' ? 'linear-gradient(90deg,#005bea22,#00ffa311)' : 'linear-gradient(90deg,#232526,#232526)',
                borderRadius: 12,
                padding: 16,
                boxShadow: h.winner === 'team2' ? '0 2px 8px #005bea44' : 'none',
                border: h.winner === 'team2' ? '2px solid #005bea' : '2px solid #232526'
              }}>
                <div style={{
                  color: '#005bea',
                  fontWeight: 900,
                  fontSize: 18,
                  marginBottom: 10,
                  letterSpacing: 1,
                  textAlign: 'center'
                }}>Team 2</div>
                {h.teams && h.teams.team2 && h.teams.team2.length > 0 ? (
                  <table style={{
                    width: '100%',
                    color: '#fff',
                    fontSize: 15,
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', color: '#005bea', fontWeight: 700, padding: 4 }}>Player</th>
                        <th style={{ textAlign: 'center', color: '#005bea', fontWeight: 700, padding: 4 }}>Role</th>
                        <th style={{ textAlign: 'center', color: '#005bea', fontWeight: 700, padding: 4 }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.teams.team2.map((p, i) => (
                        <tr key={p.id || i}>
                          <td style={{ padding: 4, fontWeight: 700, color: '#fff' }}>{p.name}</td>
                          <td style={{ padding: 4, textAlign: 'center', color: '#005bea', fontWeight: 800 }}>{p.assignedRole?.toUpperCase() || ''}</td>
                          <td style={{ padding: 4, textAlign: 'center' }}>
                            <span style={{
                              color: (p.newScore > p.oldScore) ? '#00ffa3' : (p.newScore < p.oldScore) ? '#ff4b4b' : '#fff',
                              fontWeight: 900
                            }}>
                              {p.oldScore}
                              <span style={{
                                margin: '0 4px',
                                fontWeight: 900,
                                fontSize: 16
                              }}>
                                {p.newScore > p.oldScore ? '→' : p.newScore < p.oldScore ? '→' : ''}
                              </span>
                              {p.newScore}
                              {p.newScore > p.oldScore && <span style={{ color: '#00ffa3', marginLeft: 4 }}>↑</span>}
                              {p.newScore < p.oldScore && <span style={{ color: '#ff4b4b', marginLeft: 4 }}>↓</span>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: 8 }}>-</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 24
          }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: page === 1 ? '#444' : 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)',
                color: page === 1 ? '#888' : '#222',
                fontWeight: 900,
                fontSize: 18,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >Prev</button>
            <span style={{ color: '#00ffa3', fontWeight: 900, fontSize: 18 }}>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: page === totalPages ? '#444' : 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)',
                color: page === totalPages ? '#888' : '#222',
                fontWeight: 900,
                fontSize: 18,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchHistory;
